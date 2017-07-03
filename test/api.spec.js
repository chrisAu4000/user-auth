const dotenv = require('dotenv')
dotenv.load();
const { assert } = require('chai')
const request = require('supertest')
const config = require('../config')
const app = require('../src/app')
const mongoose = require('mongoose');
const Mockgoose = require('mockgoose').Mockgoose;
const mockgoose = new Mockgoose(mongoose);
const db = require('../src/database')

// to test https
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const deleteModels = () => Promise.all(Object.keys(mongoose.connection.models).map(function(model) {
		delete mongoose.connection.models[model]
		return Promise.resolve()
}))

before((done) => {
	mockgoose
	.prepareStorage()
	.then(done)
	.catch(done)
})

// after((done) => {
// 	mongoose.connection.model('User').remove({})
// 	.then(() => mockgoose.reset())
// 	.then(deleteModels)
// 	.then(() => mongoose.connection.db.dropDatabase())
// 	.then(() => mongoose.connection.close(done))
// 	.catch(done)
// })

describe('end to end API', () => {
	let appToTest 
	before((done) => {
		app(config).fork(
			err => done(err),
			res => {
				appToTest = res
				done()
			})
	})
	
	describe('login root-user', () => {
		it('should login the root-user', (done) => {
			const data = { name: 'admin', password: 'admin' }
			request(appToTest)
				.post('/v1/login/')
				.set('Content-Type', 'application/json')
				.send(data)
				.expect(200)
				.expect('Content-Type', /json/)
				.end((err, res) => {
					if (err) app.close(() => { throw err })
					mongoose.model('User').find({})
						.then(docs => {
							appToTest.close(() => {
								assert.equal(docs.length, 1, 'User was not inserted.')
								assert.equal(docs[0].role, 'ROOT')
								done()
							})
						})
						.catch(done)
				})
		})
	})
	describe('POST /user', () => {
		let rootToken = undefined
		before((done) => {
			const data = { name: 'admin', password: 'admin' }
			request(appToTest)
				.post('/v1/login/')
				.set('Content-Type', 'application/json')
				.send(data)
				.expect(200)
				.expect('Content-Type', /json/)
				.end((err, res) => {
					if (err) appToTest.close(() => { throw err })
					appToTest.close(() => {
						rootToken = 'Bearer ' + res.body.token
						done()
					})
				})
		})

		afterEach(() => mongoose
			.model('User')
			.remove({role: {$ne: 'ROOT'}})
		)

		it('root should be able to create an admin', (done) => {
			const userdata = {
				password: 'password',
				name: 'admin-user'
			}
			request(appToTest)
				.post('/v1/admin/')
				.set('Content-Type', 'application/json')
				.set('Authorization', rootToken)
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
		})
		it('root should be able to create an user', (done) => {
			const userdata = {
				password: 'password',
				name: 'username'
			}
			request(appToTest)
				.post('/v1/user/')
				.set('Content-Type', 'application/json')
				.set('Authorization', rootToken)
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
		})
		
	})

})
// describe('GET /user/:id', () => {
// 	it('returns a user', (done) => {
// 		const expectedBody = {
// 			id: '1', 
// 			name: 'John Math' 
// 		}
// 		app(serverconfig)
// 			.fork(
// 				err => done(err),
// 				app => {
// 					request(app) 
// 						.get('/user')
// 						.expect(200)
// 						.end((err, res) => {
// 							if (err) throw err
// 							app.close()
// 							done()
// 						})
					// 	.get('/user')
					// 	.set('Accept', 'application/json')
					// 	.expect(200)
					// 	.expect('Content-Type', /json/)
					// 	.end((err, res) => {
					// 		if (err) return done(err)
					// 		app.http.close()
					// 		app.https.close(done)
					// 	}) 
					
// 				}
// 			)
// 	})
// })
