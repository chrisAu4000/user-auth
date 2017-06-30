const { Async, Maybe, curry } = require('crocks')
const models = require('./models')
const mongoose = require('mongoose')

const initializeModel = curry(({name, schema, collection}) =>
	mongoose.model(name, new mongoose.Schema(schema, {collection: collection}))
)

const connectDatabase = (url) => Async((rej, res) => {
	let exit = false;
	mongoose.Promise = global.Promise
	models.forEach(initializeModel)
	mongoose.connect(url).catch(rej)
	mongoose.connection.once('disconnected', 
		() => exit === false && rej(new Error(`Database dissconnected for url: [${ url }]`))
	)
	mongoose.connection.once('open', res.bind(null, mongoose))
	process.once('SIGINT', () => {
		exit = true
		mongoose.connection.close(() => {
			console.log('Mongoose default connection disconnected through app termination')
			process.exit(0)
		})
	})
})

const find = curry((model, query) => 
	Async((rej, res) => mongoose.model(model).find(query)
		.then(doc => res(Maybe.fromNullable(doc)))
		.catch(rej)
	))

const create = curry((model, data) => 
	Async((rej, res) => mongoose.model(model).create(data)
		.then(res)
		.catch(rej)
	))

module.exports = {
	connectDatabase,
	create,
	find
}