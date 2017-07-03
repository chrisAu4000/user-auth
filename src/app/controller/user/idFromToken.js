const { curry, prop, maybeToAsync } = require('crocks')
const { serverError } = require('../../error')
const { verify } = require('../../jwt')
// idFromToken :: Token -> Async e Id
const idFromToken = curry((secret, token) => token
	.chain(verify(secret))
	.map(prop('_id'))
	.chain(maybeToAsync(new Error('Cannot find _id in payload'))))

module.exports = idFromToken