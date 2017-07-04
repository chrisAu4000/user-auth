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

const { 
	correctRootLogin, 
	incorrectPasswordLogin,
	unknownUsernameLogin,
	noPasswordLogin,
	noUsernameLogin,
	emptyLogin,
} = require('./controller/user/login-test')
const {
	insertAdmin,
	insertUser
} = require('./controller/user/insert-user-test')
const {
	removeRootUser,
	removeAdminUser,
	removeUser,
} = require('./controller/user/remove-user-test')
const {
	updateRootUser,
} = require('./controller/user/update-user-test')
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
			correctRootLogin(appToTest, done);
		})
		it('should return access denied', (done) => {
			incorrectPasswordLogin(appToTest, done)
		})
		it('should return not found', (done) => {
			unknownUsernameLogin(appToTest, done)
		})
		it('should return bad request', (done) => {
			noPasswordLogin(appToTest, done)
		})
		it('should return bad request', (done) => {
			noUsernameLogin(appToTest, done)
		})
		it('should return bad request', (done) => {
			emptyLogin(appToTest, done)
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
			insertAdmin(appToTest, rootToken, done)
		})
		it('create an standard-user', (done) => {
			insertUser(appToTest, rootToken, done)
		})
		it('not remove the root-user', (done) => {
			removeRootUser(appToTest, rootToken, done)
		})
		it('remove an admin-user', (done) => {
			removeAdminUser(appToTest, rootToken, done)
		})
		it('remove an standard-user', (done) => {
			removeUser(appToTest, rootToken, done)
		})
		it('update my own name', (done) => {
			updateRootUser(appToTest, rootToken, done)
		})
	})

})