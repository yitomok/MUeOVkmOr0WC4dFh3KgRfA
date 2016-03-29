'use strict'

module.exports = function(m) {
	const mongoose = m || require('mongoose')

	const ratesSchema = new mongoose.Schema({
		value: String,
		created_at: {type: Date, default: Date.now}
	}, {_id: false})

	const rateSchema = new mongoose.Schema({
		refId: Number,
		from: String,
		to: String,
		success: {type: Number, default: 0},
		failure: {type: Number, default: 0},
		rates: [ratesSchema]
	})

	return mongoose.model('Rate', rateSchema)
}
