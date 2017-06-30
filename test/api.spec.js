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
const serverconfig = { port: 3443, hostname: 'localhost' }
const deleteModels = () => Promise.all(Object.keys(mongoose.connection.models).map(function(model) {
		delete mongoose.connection.models[model]
		return Promise.resolve()
}))

before((done) => {
	mockgoose
	.prepareStorage()
	.then(done)
	// .then(deleteModels)
	// .then(() => db.connect(config.db_url).fork(
	// 	err => err.message !== 'Database dissconnected.' && done(err), 
	// 	res => done()
	// ))
	.catch(done)
})

after((done) => {
	mongoose.connection.model('User').remove({})
	.then(deleteModels)
	.then(() => mongoose.connection.db.dropDatabase())
	.then(() => mongoose.connection.close(done))
	.catch(done)
})

describe('POST /register', () => {
	it('should save a user', (done) => {
		const userdata = {
			password: 'password',
			name: 'username'
		}
		app(serverconfig).fork(done, app => {
			request(app)
				.post('/v1/user/register')
				.set('Accept', 'application/json')
				.send(userdata)
				.expect(200)
				.expect('Content-Type', /json/)
				.end((err, res) => {
					if (err) app.close(() => { throw err })
					mongoose.model('User').find(userdata).then(docs => {
						app.close(() => {
							assert.equal(docs.length, 1)
							assert.equal(docs[0]._id, res.body._id)
							done()
						})
					})
					.catch(err => app.close(done.bind(this, err)))
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
