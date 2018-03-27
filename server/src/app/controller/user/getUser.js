const { Async, curry } = require('crocks')
const asyncProp = require('./asyncProp')
// getUser :: a -> Async e User
const getUser = input => 
	Async.of(curry((name, email, password) => ({name, email, password})))
		.ap(asyncProp('name', 'Name is required', input))
		.ap(asyncProp('email', 'Email is required', input))
		.ap(asyncProp('password', 'Password is required', input))

module.exports = getUser