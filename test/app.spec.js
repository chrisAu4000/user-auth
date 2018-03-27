const dotenv = require('dotenv')
dotenv.load();
const config = require('../config')
const { assert } = require('chai')
const app = require('../server/src/app')

describe('Application', () => {
	it('should be function', () => {
		assert.isFunction(app)
	})
	it('should return an Async', () => {
		assert.equal(app(config).type(), 'Async')
	})
	// it('should fork a http-server and a https-server', (done) => {
	// 	app().fork(
	// 		err => done(err),
	// 		res => {
	// 			assert.equal(res.constructor.name, 'Server')
	// 			res.close(done)
	// 		}
	// 	)
	// })
})