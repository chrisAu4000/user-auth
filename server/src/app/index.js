const bodyParser = require('body-parser')
const { 
	Async,
	List,
	ap,
	assign,
	chain, 
	constant,
	compose, 
	curry,
	identity,
	isEmpty,
	map,
	maybeToAsync,
	not,
	prop,
	resultToAsync, 
	safe,
	tap,
} = require('crocks')
const { readFile, readJson } = require('./file-system')
const Express = require('express')
const express = Express()
const expressJWT = require('express-jwt')
const https = require('https')
const morgan = require('morgan')
const path = require('path')
const setupRoutes = require('./routes')
// const webpack = require('webpack')
// const webpackConfig = require('../../../webpack.dev.config.js')
// const webpackMiddleware = require('webpack-dev-middleware')
const { connectDatabase, create, findAll, removeById } = require('../database')
const { hash } = require('./crypto')
// TYPES
// HttpCredentials :: String -> String -> HttpCredentials
const HttpCredentials = curry((cert, key) => ({cert, key}))
// ConnectionCredentials :: Number -> Number -> Server -> ConnectionCredentials
const ConnectionCredentials = curry((port, backlog, server) => ({port, backlog, server}))
// Application :: Async Error Application
const app = Async.of(express)
// FUNCTIONS
// asyncProp :: String -> String -> a -> Async e b
const asyncProp = curry((propName, errText, resource) => 
	maybeToAsync(new Error(errText), prop(propName, resource)))
// createHTTPS :: HttpsCredentials -> Express -> Async Error (HttpsCredentials -> Express) -> Server
const createHTTPS = Async.of(
	curry((httpsCredentials, app) => https.createServer(httpsCredentials, app)))
// setupHttpsConfig :: String -> String -> Async e HttpsCredentials
const setupHttpsConfig = curry((certPath, keyPath) => 
	Async.of(HttpCredentials)
		.ap(certPath.chain(readFile))
		.ap(keyPath.chain(readFile)))
// setupMiddleware :: Express -> Async Error Express
const setupMiddleware = curry((secret, app) => secret.map(_secret => {
	app.use(morgan('dev'))
	app.use(bodyParser.urlencoded({extended: false}))
	app.use(bodyParser.json())
	app.use(function (req, res, next) {
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
		next();
	});

	// app.use(webpackMiddleware(webpack(webpackConfig)))
	app.use(expressJWT({ 
		secret: _secret, 
		getToken: function fromHeaderOrQuerystring (req) {
			if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
				return req.headers.authorization.split(' ')[1];
			} else if (req.query && req.query.token) {
				return req.query.token;
			}
    	return null;
  	}
	})
	.unless({ path: [
		'/v1/',
		'/v1/login/',
		'/v1/%PUBLIC_URL%/favicon.ico',
		/^\/v1\/user\//g
	]
	}))
	return app
}))
// setupApplication :: Application -> Application
const setupApplication = curry((apiVersion, jwtSecret, application) => 	
	application
		.chain(setupMiddleware(jwtSecret))
		.map(setupRoutes)
		.chain(fn => apiVersion.map(fn))
		.chain(fn => jwtSecret.map(fn))
		.chain(identity)
	)
// setupDatabaseConnection :: Async e String -> Server -> Async e Server 
const setupDatabaseConnection = curry((dbConnection, server) => dbConnection
	.chain(connectDatabase)
	.map(constant(server)))
// listen :: ConnectionCredentials -> Server
const listen = connectionCredentials => Async((rej, res) => {
	connectionCredentials.server.on('error', rej)
	process.once('SIGINT', () => {
		connectionCredentials.server.close(() => {
			console.log('Server default connection disconnected through app termination')
			process.exit(0)
		})
	})
	connectionCredentials.server.listen(
		connectionCredentials.port,
		null,
		connectionCredentials.backlog,
		() => res(connectionCredentials.server)
	)
})
// closeServer :: Server -> Error -> m Error
const closeServer = curry((server, error) => Async(
	(rej, res) => server.close(rej.bind(null, error))))
// connectServer :: Number -> Number -> Server -> Async e Server
const connectServer = curry((port, backlog, server) => 
	Async.of(ConnectionCredentials)
		.ap(port)
		.ap(backlog)
		.ap(Async.of(server))
		.chain(listen)
		.bimap(closeServer(server), Async.of)
		.chain(identity))
//
const prefillDatabase = curry((jsonPath, server) => {
	return findAll('User')
		.chain(list => list.length === 0
			? Async.of(list)
			: Async.Rejected()
		)
		.chain(constant(readJson(jsonPath, 'utf-8')))
		.chain(hash('password'))
		.map(assign({role: 'ROOT'}))
		.chain(create('User'))
		.coalesce(constant(server), constant(server))
})
const application = (params) => {
	const port = asyncProp('port', 'Please set a env.PORT_WEB', params)
	const backlog = Async.of(prop('backlog', params).option(511))
	const certPath = asyncProp('certPath', 'Please set a env.CERT', params)
	const keyPath = asyncProp('keyPath', 'Please set a env.KEY', params)
	const dbConnection = asyncProp('dbConn', 'Please set a env.DB_CONN', params)
	const jwtSecret = asyncProp('jwtSecret', 'Please set a env.JWT_SEC', params)
	const apiVersion = asyncProp('apiVersion', 'Please set a env.API_V', params)
	return createHTTPS
		.ap(setupHttpsConfig(certPath, keyPath))
		.ap(setupApplication(apiVersion, jwtSecret, app))
		.chain(setupDatabaseConnection(dbConnection))
		.chain(prefillDatabase(path.join(__dirname, 'data.json')))
		.chain(connectServer(port, backlog))
}

module.exports = application