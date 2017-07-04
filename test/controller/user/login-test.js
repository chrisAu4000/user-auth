const { assert } = require('chai')
const request = require('supertest')

const correctRootLogin = (appToTest, done) => {
	const data = { name: 'admin', password: 'admin' }
	request(appToTest)
		.post('/v1/login/')
		.set('Content-Type', 'application/json')
		.send(data)
		.expect(200)
		.expect('Content-Type', /json/)
		.end((err, res) => {
			if (err) appToTest.close(() => { done(err) })
			assert.isDefined(res.body.token)
			assert.isUndefined(res.body.error)
			done()
		})
}

const incorrectPasswordLogin = (appToTest, done) => {
	const data = { name: 'admin', password: 'wrong' }
	request(appToTest)
		.post('/v1/login/')
		.set('Content-Type', 'application/json')
		.send(data)
		.expect(403)
		.expect('Content-Type', /json/)
		.end((err, res) => {
			if (err) appToTest.close(() => { done(err) })
			assert.isUndefined(res.body.token)
			assert.isDefined(res.body.error)
			done()
		})
}

const unknownUsernameLogin = (appToTest, done) => {
	const data = { name: 'wrong', password: 'admin' }
	request(appToTest)
		.post('/v1/login/')
		.set('Content-Type', 'application/json')
		.send(data)
		.expect(404)
		.expect('Content-Type', /json/)
		.end((err, res) => {
			if (err) appToTest.close(() => { done(err) })
			assert.isUndefined(res.body.token)
			assert.isDefined(res.body.error)
			done()
		})
}

const noPasswordLogin = (appToTest, done) => {
	const data = { name: 'admin' }
	request(appToTest)
		.post('/v1/login/')
		.set('Content-Type', 'application/json')
		.send(data)
		.expect(400)
		.expect('Content-Type', /json/)
		.end((err, res) => {
			if (err) appToTest.close(() => { done(err) })
			assert.isUndefined(res.body.token)
			assert.isDefined(res.body.error)
			done()
		})
}

const noUsernameLogin = (appToTest, done) => {
	const data = { password: 'admin' }
	request(appToTest)
		.post('/v1/login/')
		.set('Content-Type', 'application/json')
		.send(data)
		.expect(400)
		.expect('Content-Type', /json/)
		.end((err, res) => {
			if (err) appToTest.close(() => { done(err) })
			assert.isUndefined(res.body.token)
			assert.isDefined(res.body.error)
			done()
		})
}

const emptyLogin = (appToTest, done) => {
	const data = { }
	request(appToTest)
		.post('/v1/login/')
		.set('Content-Type', 'application/json')
		.send(data)
		.expect(400)
		.expect('Content-Type', /json/)
		.end((err, res) => {
			if (err) appToTest.close(() => { done(err) })
			assert.isUndefined(res.body.token)
			assert.isDefined(res.body.error)
			done()
		})
}

module.exports = { 
	correctRootLogin,
	incorrectPasswordLogin,
	unknownUsernameLogin,
	noPasswordLogin,
	noUsernameLogin,
	emptyLogin,
}