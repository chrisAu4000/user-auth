const { assert } = require('chai')
const { readFile, writeFile} = require('../src/app/file-system')
const path = require('path')
const fs = require('fs')

describe('Filesystem IO', () => {
	const filePath = path.join(__dirname, 'resources', 'file-system', 'test-file.json')
	before((done) => {
		fs.mkdir(path.join(__dirname, 'resources', 'file-system'), (err) => {
			if (err) return done(err)
			const data = {somestuff: 'test'}
			fs.writeFile(filePath, data, (err) => {
				if (err) return done(err)
				done()
			})
		})
	})
	after((done) => {
		fs.unlink(filePath, (err) => {
			fs.rmdir(path.join(__dirname, 'resources', 'file-system'), (err) => {
				if (err) return done(err)
				done()
			})
		})
	})
	describe('readFile', () => {
		const existingPath = path.join(__dirname, 'resources', 'file-system', 'test-file.json')
		const notExistingPath = path.join(__dirname, 'resources', 'file-system', 'not-exist.json')
		it('should be function', () => {
			assert.isFunction(readFile)
		})
		it('should return an Async', () => {
			assert.equal(readFile().type(), 'Async')
		})
		it('should return a Buffer', (done) => {
			readFile(existingPath)
				.fork(
					err => done(err),
					res => {
						assert.isTrue(Buffer.isBuffer(res))
						done()
					}
				)
		})
		it('should return a String', (done) => {
			readFile(existingPath, 'utf8')
				.fork(
					err => done(err),
					res => {
						assert.isString(res)
						done()
					}
				)
		})
		it('should return an error if the file does not exist', (done) => {
			readFile(notExistingPath, 'utf8')
				.fork(
					err => done(),
					res => assert.fail(res, undefined)
				)
		})
	})
	describe('writeFile', () => {
		const filePath = path.join(__dirname, 'resources', 'file-system', 'not-exists.txt')
		after((done) => {
			fs.access(filePath, err => {
				if (err) return done()
				fs.unlink(filePath, err => {
					if (err) return done(err)
					done()
				})
			})
		})
		it('should be a function', () => {
			assert.isFunction(writeFile)
		})
		it('should return an Async', () => {
			assert.equal(writeFile('path', 'data').type(), 'Async')
		})
		it('should write a file', (done) => {
			writeFile(filePath, 'some data')
				.fork(
					err => done(err),
					res => done()
				)
		})
		it('should return input-data after writing a file', (done) => {
			writeFile(filePath, 'some data')
				.fork(
					err => done(err),
					res => {
						assert.equal(res, 'some data')
						done()
					}
				)
		})
		it('should return an error if the target-directory does not exist', (done) => {
			writeFile(path.join(filePath, 'some-not-existing-dir'), 'some data')
				.fork(
					err => done(),
					res => assert.fail(res, undefined)
				)
		})
	})
})