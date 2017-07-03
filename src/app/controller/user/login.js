const { List, constant, curry, eitherToAsync, head, maybeToAsync, pick } = require('crocks')
const getUser = require('./getUser')
const { find } = require('../../../database')
const { compare } = require('../../crypto')
const { sign } = require('../../jwt')
const { serverError } = require('../../error')
// login :: String -> a -> Async e String
const login = curry((secret, body) => 
	getUser(body)
		.map(pick(['name', 'role']))
		.chain(find('User'))
		.map(List.fromArray)
		.map(head)
		.chain(maybeToAsync(new Error('Cannot find User with name ' + body.name)))
		.chain(user => compare(body.password, user.password)
			.chain(eitherToAsync)
			.bimap(
				serverError(403),
				constant(user)
			)
		)
		.chain(user => sign(secret, {_id: user._id, role: user.role})
		.map(token => ({token})))
	)
module.exports = login