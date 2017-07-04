const { assert } = require('chai')
const request = require('supertest')
const mongoose = require('mongoose')

const removeRootUser = (appToTest, token, done) => {
	request(appToTest)
		.delete('/v1/user')
		.set('Authorization', token)
		.expect(405)
		.expect('Content-Type', /json/)
		.end((err, res) => {
			if (err) return done(err)
			mongoose.model('User')
				.find({role: 'ROOT'})
				.then(docs => {
					assert.equal(1, docs.length)
					assert.equal('admin', docs[0].name)
					assert.equal('ROOT', docs[0].role)
					done()
				})
				.catch(err => appToTest.close(done.bind(this, err)))
		})
}

const removeAdminUser = (appToTest, token, done) => {
	const testAdmin = {name: 'test-admin', password: 'password'}
	request(appToTest)
		.post('/v1/admin/')
		.set('Content-Type', 'application/json')
		.set('Authorization', token)
		.send(testAdmin)
		.expect(200)
		.expect('Content-Type', /json/)
		.end((err, res) => {
			if (err) return done(err)
			assert.isDefined(res.body._id)
			const userIdToRemove = res.body._id
			request(appToTest)
				.delete('/v1/user/' + userIdToRemove)
				.set('Authorization', token)
				.expect(200)
				.end((err, res) => {
					if (err) return done(err)
					assert.equal(userIdToRemove, res.body._id)
					mongoose.model('User')
						.find({name: 'test-admin'})
						.then(docs => {
							assert.equal(0, docs.length)
							done()
						})
						.catch(err => appToTest.close(done.bind(this, err)))
				})
		})
}

const removeUser = (appToTest, token, done) => {
	const testUser = {name: 'test', password: 'password'}
	request(appToTest)
		.post('/v1/user/')
		.set('Content-Type', 'application/json')
		.set('Authorization', token)
		.send(testUser)
		.expect(200)
		.expect('Content-Type', /json/)
		.end((err, res) => {
			if (err) return done(err)
			assert.isDefined(res.body._id)
			const userIdToRemove = res.body._id
			request(appToTest)
				.delete('/v1/user/' + userIdToRemove)
				.set('Authorization', token)
				.expect(200)
				.end((err, res) => {
					if (err) return done(err)
					assert.equal(userIdToRemove, res.body._id)
					mongoose.model('User')
						.find({name: 'test'})
						.then(docs => {
							assert.equal(0, docs.length)
							done()
						})
						.catch(err => appToTest.close(done.bind(this, err)))
				})
		})
}

module.exports = {
	removeRootUser,
	removeAdminUser,
	removeUser
}