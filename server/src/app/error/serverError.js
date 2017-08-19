const { curry } = require('crocks')

const serverError = curry((status, message) => {
	const error = new Error(message)
	error.status = status
	return error
})

module.exports = serverError