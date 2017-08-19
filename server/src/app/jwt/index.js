const { Async, curry } = require('crocks')
const jwt = require('jsonwebtoken')

const sign = curry((secret, payload) => new Async((rej, res) => {
	res(jwt.sign(payload, secret))
}))

const  verify = curry((secret, token) => new Async((rej, res) => {
	jwt.verify(token, secret, (err, payload) => {
		return err ? rej(err) : res(payload)
	})
}))

module.exports = {
	sign,
	verify
}