const {
	Async,
	chain,
	curry,
	compose,
	constant,
	map,
	resultToAsync,
	tryCatch
} = require('crocks')
const fs = require('fs')
// readFile :: (String, String) -> Async e String
const readFile = Async.fromNode(fs.readFile)
// parseJson :: a -> Result e b
const parseJson = tryCatch(JSON.parse)
// readJson :: (String, String) -> Async e b
const readJson = compose(
	chain(resultToAsync), 
	map(parseJson), 
	readFile
)
// writeFile :: String -> a -> Async e a
const writeFile = curry(
	(path, data) => Async.fromNode(fs.writeFile)(path, data).map(constant(data))
)

module.exports = {
	readFile,
	readJson,
	writeFile
}