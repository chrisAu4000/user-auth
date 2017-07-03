const { 
	Async,
	List,
	Maybe,
	chain,
	compose,
	curry,
	head,
	isObject,
	isString,
	map,
	maybeToAsync,
	pick, 
	prop,
	safe,
	tap
} = require('crocks')
const userController = require('../controller/user')
const { hash, compare } = require('../crypto')
const { sign, verify } = require('../jwt')
const { create, find, findById, removeById } = require('../../database')
// asyncProp :: String -> String -> Async e a
const asyncProp = curry((propName, errorText) => 
	maybeToAsync(
		new Error(errorText), 
		compose(chain(prop(propName)), safe(isObject))
	))

// getUser :: a -> Async e User
const getUser = input => Async.of(curry((name, password) => ({name, password})))
		.ap(asyncProp('name', 'Name is required', input))
		.ap(asyncProp('password', 'Password is required', input))

// findUserByToken :: String -> HttpHeaders -> User
const findUserByToken = curry((secret, headers) => 
	getIdFromToken(
			secret,
			asyncProp('authorization', 'Authorization is required', headers)
		)
		.chain(findById('User')))

// fork :: m e a -> b -> c -> Unit
const fork = curry((async, req, res) => 
	async.fork(
		error => {
			console.error(error)
			res.status(error.status || 500).json({error: error.message})
		},
		result => res.json(result)))
// routes :: Application -> String -> String -> Async e a
const routes = curry((app, apiVersion, jwtSecret) => Async((rej, res) => {
	const api = '/v' + apiVersion

	app.post(api + '/login/', (req, res) => fork(userController
		.login(jwtSecret, req.body), req, res))

	app.post(api + '/admin/', (req, res) => fork(userController
		.insert('ADMIN', jwtSecret, req), req, res))
		
	app.post(api + '/user/', (req, res) => fork(userController
		.insert('USER', jwtSecret, req), req, res))
	
	app.delete(api + '/user/', (req, res) => fork(userController
		.removeSelf(req.user), req, res))
	
	app.delete(api + '/user/:id', (req, res) => fork(userController
		.remove(req.user, req.params.id), req, res))

	app.get(api + '/user/', (req, res) => {
		findUserByToken(jwtSecret, req.headers)
			.fork(
				err => res.status(err.status || 500).json({error: err.message}),
				user => res.json(user)
			)
	})

	app.get('/', (rej, res) => {
		res.send('Hello')
	})
	return res(app)
}))

module.exports = routes