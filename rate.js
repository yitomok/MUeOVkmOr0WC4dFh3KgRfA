'use strict'

module.exports = function(m) {
	const mongoose = m || require('mongoose')

	const rateSchema = new mongoose.Schema({
		refId: Number,
		from: String,
		to: String,
		created_at: {type: Date, default: Date.now},
		success: {type: Number, default: 0},
		failure: {type: Number, default: 0},
		rates: [String]
	})

	return mongoose.model('Rate', rateSchema)
}
