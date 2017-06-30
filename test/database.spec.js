const mongoose = require('mongoose');
const Mockgoose = require('mockgoose').Mockgoose;
const mockgoose = new Mockgoose(mongoose);
const config = require('../config')

// before(() => mockgoose
// 	.prepareStorage()
// 	.then(() => mongoose.connect(config.db_url)))

// after(() => mongoose.connection.close())

// describe('Database', () => {
// 	it('should establish a connection', (done) => {
// 		done()
// 	})
// })