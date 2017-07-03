const {
	Async,
	List,
	Maybe,
	compose,
	curry,
	flip,
	pick
} = require('crocks')
const { serverError } = require('../app/error')
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
// find :: a -> b -> Async e 
const find = curry((model, query) => 
	Async((rej, res) => mongoose.model(model).find(query)
		.then(res)
		.catch(compose(rej, serverError(500)))
	))
// findAll :: a -> Async e docs	
const findAll = flip(find)({})
// count :: String -> a -> Async e Number
const count = curry((model, query) => 
	Async((rej, res) => mongoose.model(model).count(query)
		.then(res)
		.catch(rej)))
// create :: a -> b -> Async e doc
const create = curry((model, data) => 
	Async((rej, res) => mongoose.model(model).create(data)
		.then(res)
		.catch(compose(rej, serverError(500)))
	))
// createUnique :: a -> String -> b -> Async e b
const createUnique = curry((model, property, data) => 
	count(model, pick([property], data))
		.chain(n => n > 0 
			? Async.Rejected(serverError(409, model + ' with ' + property + ' ' + data[property] + ' already exists.'))
			: Async.Resolved(data)
		)
		.chain(create(model))
)
// findById :: a -> b -> Async e doc
const findById = curry((model, id) => 
	Async((rej, res) => mongoose.model(model).findById(id)
		.then(doc => doc 
			? res(doc)
			: rej(serverError(404, 'Cannot find ' + model + ' with _id: ' + id)))
		.catch(compose(rej, serverError(500)))
	))
const updateById = curry((model, id, data) => 
	Async((rej, res) => mongoose.model(model)
		.findByIdAndUpdate(id, {$set: data})
			.then(doc => doc 
				? res(Object.assign({}, doc._doc, data))
				: rej(serverError(404, 'Cannot find document with _id: ' + id))
			)
			.catch(rej)
	))
// removeById :: String -> String -> Async e a
const removeById = curry((model, id) => 
	Async((rej, res) => mongoose.model(model).findByIdAndRemove(id)
		.then(docs => docs 
			? res(docs) 
			: rej(serverError(404, 'Cannot find ' + model + 'with _id: ' + id)))
		.catch(compose(rej, serverError(500)))
	))
module.exports = {
	connectDatabase,
	create,
	createUnique,
	find,
	findAll,
	findById,
	updateById,
	removeById
}