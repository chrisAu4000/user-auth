const { 
	Async, 
	Maybe,
	curry, 
	safe, 
	isString,
	isObject,
	pick, 
	prop,
	compose,
	maybeToAsync,
	chain
} = require('crocks')
const { create } = require('../../database')

const insertUser = (data) => {
	const getName = maybeToAsync(
		new Error('Name is required'),
		compose(chain(prop('name')), safe(isObject))
	)
	const getPass = maybeToAsync(
		new Error('Password is required'),
		compose(chain(prop('password')), safe(isObject))
	)
	const name = getName(data)
	const pass = getPass(data)
	return Async.of(curry((name, password) => ({name, password})))
		.ap(name)
		.ap(pass)
		.chain(create('User'))
		.map(user => ({_id: user._id}))
}

const routes = app => Async((rej, res) => {
	app.post('/v1/user/register', (req, res) => {
		console.log(req.body)
		insertUser(req.body)
			.fork(
				err => res.status(500).json({error: err.message}),
				id => {
					
					res.json(id)
				}
			)
	})
	app.get('/', (rej, res) => {
		console.log('root')
		res.send('Hello')
	})
	return res(app)
})

module.exports = routes