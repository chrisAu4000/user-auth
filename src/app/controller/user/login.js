const getUser = require('./getUser')
const { find } = require('../../../database')
const { List, curry, head, maybeToAsync, pick } = require('crocks')
const { sign } = require('../../jwt')
// login :: String -> a -> Async e String
const login = curry((secret, body) => 
	getUser(body)
		.map(pick(['name', 'role']))
		.chain(find('User'))
		.map(List.fromArray)
		.map(head)
		.chain(maybeToAsync(new Error('Cannot find User with name ' + body.name)))
		.chain(user => sign(secret, {_id: user._id, role: user.role})
		.map(token => ({token})))
	)
module.exports = login