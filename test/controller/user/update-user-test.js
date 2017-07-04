const { assert } = require('chai')
const request = require('supertest')
const mongoose = require('mongoose')

const updateRootUser = (appToTest, token, done) => {
	const data = {name: 'newRoot'}
	request(appToTest)
		.patch('/v1/user/')
		.set('Content-Type', 'application/json')
		.set('Authorization', token)
		.send(data)
		.expect(200)
		.end((err, res) => {
			if (err) return done(err)
			assert.equal('newRoot', res.body.name)
			assert.isDefined(res.body.password)
			mongoose.model('User')
				.find({role: 'ROOT'})
				.then(docs => {
					assert.equal(1, docs.length)
					assert.equal('newRoot', docs[0].name)
					done()
				})
		})
} 

module.exports = {
	updateRootUser
}