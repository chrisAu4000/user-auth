const { Async, curry, constant } = require('crocks')
const fs = require('fs')

const readFile = Async.fromNode(fs.readFile)
const writeFile = curry(
	(path, data) => Async.fromNode(fs.writeFile)(path, data).map(constant(data))
)

module.exports = {
	readFile,
	writeFile
}