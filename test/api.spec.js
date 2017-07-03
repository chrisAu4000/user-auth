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

before(() => mockgoose.prepareStorage())

describe('API', () => {
	let appToTest 
	before((done) => {
		app(config).fork(
			err => done(err),
			res => {
				appToTest = res
				done()
			})
	})
	
	describe('login', () => {
		it('should login the root-user', (done) => {
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
		})
		it('should return access denied', (done) => {
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
		})
	})

	describe('As root-user ', () => {
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

		it('create an admin-user', (done) => {
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
		it('create an standard-user', (done) => {
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
		it('not remove the root-user', (done) => {
			request(appToTest)
				.delete('/v1/user')
				.set('Authorization', rootToken)
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
		})
		it('remove an admin-user', (done) => {
			const testAdmin = {name: 'test-admin', password: 'password'}
			request(appToTest)
				.post('/v1/admin/')
				.set('Content-Type', 'application/json')
				.set('Authorization', rootToken)
				.send(testAdmin)
				.expect(200)
				.expect('Content-Type', /json/)
				.end((err, res) => {
					if (err) return done(err)
					assert.isDefined(res.body._id)
					const userIdToRemove = res.body._id
					request(appToTest)
						.delete('/v1/user/' + userIdToRemove)
						.set('Authorization', rootToken)
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
		})
		it('remove an standard-user', (done) => {
			const testUser = {name: 'test', password: 'password'}
			request(appToTest)
				.post('/v1/user/')
				.set('Content-Type', 'application/json')
				.set('Authorization', rootToken)
				.send(testUser)
				.expect(200)
				.expect('Content-Type', /json/)
				.end((err, res) => {
					if (err) return done(err)
					assert.isDefined(res.body._id)
					const userIdToRemove = res.body._id
					request(appToTest)
						.delete('/v1/user/' + userIdToRemove)
						.set('Authorization', rootToken)
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
		})
		it('update my own name', (done) => {
			const data = {name: 'newRoot'}
			request(appToTest)
				.patch('/v1/user/')
				.set('Content-Type', 'application/json')
				.set('Authorization', rootToken)
				.send(data)
				.expect(200)
				.end((err, res) => {
					if (err) return done(err)
					assert.equal('newRoot', res.body.name)
					assert.isDefined(res.body.password)
					done()
				})
		})
	})

})