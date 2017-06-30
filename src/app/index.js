const { Async, chain, constant, curry, identitiy, maybeToAsync, prop } = require('crocks')
const { readFile } = require('./file-system')
const Express = require('express')
const express = Express()
const https = require('https')
const path = require('path')
const certPath = path.join(__dirname, '../../server.crt')
const keyPath = path.join(__dirname, '../../server.key')
const routes = require('./routes')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const { connectDatabase } = require('../database')

// credentials :: a -> a -> Async Error Credentials
const credentials = //curry((certPath, keyPath) =>
	Async.of(cert => key => ({cert, key}))
		.ap(readFile(certPath))
		.ap(readFile(keyPath))
	// )
// app :: Async Error Express
const app = 
	Async.of(express)
// createHTTPS :: Credentials -> Express -> Async Error (Credentials -> Express) -> Server
const createHTTPS = 
	Async.of(curry((credentials, app) => https.createServer(credentials, app)))
// listen :: Number -> IP -> Number -> Server
const listen = curry((port, hostname, backlog, server) => Async((rej, res) => {
	server.on('error', rej)
	server.listen(port, hostname, backlog, () => res(server))
}))
// middleware :: Express -> Async Error Express
const middleware = app => Async((rej, res) => {
	app.use(morgan('dev'))
	app.use(bodyParser.urlencoded({extended: false}))
	app.use(bodyParser.json())
	return res(app)
})

const application = (params) => {
	const portHTTPS = maybeToAsync(new Error('Please set a env.PORT_WEB'), prop('port', params))
	const hostname = maybeToAsync(new Error('Please set a env.HOST'), prop('host', params))
	const backlog = Async.of(prop('backlog', params).option(511))
	const listenHTTPS = portHTTPS
		.map(listen)
		.ap(hostname)
		.ap(backlog)
		
	return createHTTPS
		.ap(credentials)
		.ap(app
			.chain(middleware)
			.chain(routes)
		)
		.chain(server => connectDatabase(params.dbConn).map(constant(server)))
		.chain(server => listenHTTPS
			.chain(listenOn => listenOn(server))
		)
}

module.exports = application