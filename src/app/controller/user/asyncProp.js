const { compose, chain, curry, prop, maybeToAsync, safe, isObject } = require('crocks')
const { serverError } = require('../../error')
// asyncProp :: String -> String -> Async e a
const asyncProp = curry((propName, errorText) => 
	maybeToAsync(
		serverError(400, errorText), 
		compose(chain(prop(propName)), safe(isObject))
	))
module.exports = asyncProp