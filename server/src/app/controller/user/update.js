const { Async, assign, constant, curry, identity, pick } = require('crocks')
const { isAllowed } = require('./rights')
const { updateById } = require('../../../database')
const asyncProp = require('./asyncProp')
const { hash } = require('../../crypto')

const updateSelf = curry((user, data) => {
	const id = asyncProp('_id', 'User id is required', user)
	const name = asyncProp('name', '', data)
		.coalesce(constant(undefined), identity)
	const password = asyncProp('password', '', data)
		.map(password => ({ password }))
		.chain(hash('password'))
		.map(obj => obj.password)
		.coalesce(constant(undefined), identity)

	return Async.of(updateById('User'))
		.ap(id)
		.ap(Async.of(curry((name, password) => ({name, password})))
			.ap(name)
			.ap(password)
			.map(pick(['name', 'password']))
		)
		.chain(identity)
})

const update = curry(() => {

})

module.exports = { updateSelf, update }