const { assert } = require('chai')
const request = require('supertest')
const mongoose = require('mongoose')

const insertAdmin = (appToTest, token, done) => {
	const userdata = {
		password: 'password',
		name: 'admin-user'
	}
	request(appToTest)
		.post('/v1/admin/')
		.set('Content-Type', 'application/json')
		.set('Authorization', token)
		.send(userdata)
		.expect(200)
		.expect('Content-Type', /json/)
		.end((err, res) => {
			if (err) appToTest.close(() => done(err))
			assert.equal('admin-user', res.body.name)
			assert.isDefined(res.body._id)
			mongoose.model('User').findById(res.body._id).then(doc => {
				assert.equal('admin-user', doc.name)
				assert.equal(res.body._id, doc._id)
				done()
			})
			.catch(err => appToTest.close(done.bind(this, err)))
		})
}

const insertUser = (appToTest, token, done) => {
	const userdata = {
		password: 'password',
		name: 'username'
	}
	request(appToTest)
		.post('/v1/user/')
		.set('Content-Type', 'application/json')
		.set('Authorization', token)
		.send(userdata)
		.expect(200)
		.expect('Content-Type', /json/)
		.end((err, res) => {
			if (err) appToTest.close(() => done(err))
			assert.equal('username', res.body.name)
			assert.isDefined(res.body._id)
			mongoose.model('User').findById(res.body._id).then(doc => {
				assert.equal('username', doc.name)
				assert.equal('USER', doc.role)
				assert.equal(res.body._id, doc._id)
				done()
			})
			.catch(err => appToTest.close(done.bind(this, err)))
		})
}
module.exports = {
	insertAdmin,
	insertUser
}