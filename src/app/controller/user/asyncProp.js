const { compose, chain, curry, prop, maybeToAsync, safe, isObject } = require('crocks')
// asyncProp :: String -> String -> Async e a
const asyncProp = curry((propName, errorText) => 
	maybeToAsync(
		new Error(errorText), 
		compose(chain(prop(propName)), safe(isObject))
	))
module.exports = asyncProp