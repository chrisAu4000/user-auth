const { assign, constant, curry } = require('crocks')
const getUser = require('./getUser')
const { hash } = require('../../crypto')
const { createUnique } = require('../../../database')
const { sign } = require('../../jwt')
const { isAllowed } = require('./rights')
// insertUser :: User -> Async e Token
const insertUser = curry((role, secret, req) => 
	isAllowed('insert_user', role, req.body)
		.chain(constant(getUser(req.body)))
		.chain(hash('password'))
		.map(assign({role: role.toUpperCase()}))
		.chain(createUnique('User', 'name'))
		.chain(user => 
			sign(secret, { _id: user._id, role: user.role })
				.map(token => ({ user: user, jwt: token }))
		)
	)

module.exports = insertUser