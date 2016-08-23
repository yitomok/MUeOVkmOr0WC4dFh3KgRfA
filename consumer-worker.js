'use strict'

const Promise = require('bluebird')
const co = require('co')
const fivebeans = require('fivebeans')
const mongoose = require('mongoose')
mongoose.Promise = Promise
const rp = Promise.promisifyAll(require('request'))
const Rate = require('./rate')(mongoose)

/**
 * Return a generator function connecting to a beanstalkd instance
 *
 * @function
 * @param {string} host - hostname or IP address
 * @param {number} port - port
 */
const connectAsync = (host, port) => new Promise((resolve, reject) => {
	const client = new fivebeans.client(host, port)
	Promise.promisifyAll(client, { multiArgs: true })

	client.on('connect', () => resolve(client))
		.on('error', err => reject(err))
		.connect()
})

/**
 * Return a generator function getting beanstalkd location
 *
 * @function
 * @param {string} apiKey - API Key to grant access
 */
const getHostInfo = function*(apiKey) {
	return (yield rp.postAsync('http://challenge.aftership.net:9578/v1/beanstalkd', {
		headers: { 'aftership-api-key': apiKey || 'a6403a2b-af21-47c5-aab5-a2420d20bbec' },
		json: true
	})).body.data
}

/**
 * Return a generator function getting rate data
 *
 * @function
 * @param {string} from - Currency convert from
 * @param {string} to - Currency convert to
 */
const getDataAsync = function*(from, to) {
	return (yield rp.getAsync('https://api.fixer.io/latest', {
		qs: {base: from, symbols: to},
		json: true
	})).body.rates[to].toFixed(2).toString()
}

//main routine using co module
co(function*() {
	const tubes = [ 'yitomok' ]
	const db_uri = 'mongodb://backend-lv3:backend-lv3@ds058548.mlab.com:58548/backend-lv3'
	const beanstalk = yield getHostInfo()

	const client = yield connectAsync(beanstalk.host, beanstalk.port)
	mongoose.connect(db_uri)
	yield client.watchAsync(tubes)

	for(let quit = false; !quit;) {
		//fetch job from tube
		const data = yield client.reserveAsync()
		const req = JSON.parse(data[1])
		if (req.stop) {
			quit = true
			yield client.destroyAsync(data[0])
			continue
		}

		//fetch rate from provider
		const action = {
			conditions: {refId: data[0], from: req.from, to: req.to},
			delay: 60
		}
		try {
			action.update = yield {$inc: {success: 1}, $push: {rates: {value: getDataAsync(req.from, req.to)}}}
		} catch (err) {
			action.update = {$inc: {failure: 1}, $push: {rates: {value: '-1'}}}
			action.delay = 3
		} finally {
			//save to mongodb
			const rateObj = yield Rate.findOneAndUpdate(action.conditions, action.update, {upsert: true, setDefaultsOnInsert: true, new: true}).exec()
			//process the job 10 times, if failed 3 times, bury the job
			if (rateObj.success < 10 && rateObj.failure < 3) {
				yield client.releaseAsync(data[0], 0, action.delay)
			} else {
				yield rateObj.failure < 3 ? client.destroyAsync(data[0]) : client.buryAsync(data[0], 0)
			}
		}
	}

	//cleanup stuff
	yield client.ignoreAsync(tubes)
	mongoose.disconnect()
	yield client.quitAsync()
}).catch(err => { console.error(err) })
