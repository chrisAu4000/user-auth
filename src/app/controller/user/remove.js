const {
	Async,
	constant,
	curry,
	identity,
	maybeToAsync,
	prop,
	safe,
	isObject 
} = require('crocks')
const idFromToken = require('./idFromToken')
const asyncProp = require('./asyncProp')
const { findById, removeById } = require('../../../database')
const { isAllowed } = require('./rights')
const { serverError } = require('../../error')

// removeSelf :: HttpHeaders -> Id
const removeSelf = user => 
	asyncProp('_id', 'DELETE: Users _id is required', user)
		.chain(removeById('User'))
		.map(user => ({_id: user._id}))

const remove = curry((user, id) => {
	const admin = Async.of(safe(isObject, user))
		.chain(maybeToAsync(serverError(500, 'User must be an object')))
	const userToRemove = findById('User', id)
	return Async
		.of(isAllowed('remove_user'))
		.ap(findById('User', id)
			.map(prop('role'))
			.chain(maybeToAsync(serverError(500, 'User must have a role.')))
		)
		.ap(admin)
		.chain(identity)
		.chain(constant(removeById('User', id)))
		.map(user => ({_id: user._id}))
})
module.exports = { removeSelf, remove }