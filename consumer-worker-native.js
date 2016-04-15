'use strict'

const rp = require('request-promise')
const Promise = require('bluebird')
const co = require('co')
const fivebeans = require('fivebeans')
const mongodb = require('mongodb')

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
	return (yield rp({
		uri: 'http://challenge.aftership.net:9578/v1/beanstalkd',
		headers: {
			'User-Agent': 'Request-Promise',
			'aftership-api-key': apiKey || 'a6403a2b-af21-47c5-aab5-a2420d20bbec'
		},
		json: true,
		method: 'POST'
	})).data
}

/**
 * Return a generator function getting rate data
 *
 * @function
 * @param {string} from - Currency convert from
 * @param {string} to - Currency convert to
 */
const getDataAsync = function*(from, to) {
	return (yield rp({
		uri: 'https://api.fixer.io/latest',
		qs: {base: from, symbols: to},
		headers: {'User-Agent': 'Request-Promise'},
		json: true
	})).rates[to].toFixed(2).toString()
}

//main routine using co module
co(function*() {
	const tubes = [ 'yitomok' ]
	const db_uri = 'mongodb://backend-lv3:backend-lv3@ds058548.mlab.com:58548/backend-lv3'
	const beanstalk = yield getHostInfo()

	const res = yield [ connectAsync(beanstalk.host, beanstalk.port), mongodb.MongoClient.connect(db_uri, { promiseLibrary: Promise }) ]
	const client = res[0]
	const db = res[1]
	yield client.watchAsync(tubes)

	for(let quit = false; !quit;) {
		//fetch job from tube
		const data = yield client.reserveAsync()
		const jobId = Number(data[0])
		const req = JSON.parse(data[1])
		if (req.stop) {
			quit = true
			yield client.destroyAsync(jobId)
			continue
		}

		//fetch rate from provider
		const action = {
			conditions: {refId: jobId, from: req.from, to: req.to},
			delay: 60
		}
		let rate = yield db.collection('rates').findOne(action.conditions)
		if (!rate) {
			rate = action.conditions
			rate.success = 0
			rate.failure = 0
			rate.rates = []
		}
		try {
			rate.rates.push(yield {value: getDataAsync(req.from, req.to), created_at: new Date()})
			rate.success += 1
		} catch (err) {
			rate.rates.push({value: '-1', created_at: new Date()})
			rate.failure += 1
			action.delay = 3
		} finally {
			//save to mongodb
			yield db.collection('rates').updateOne(action.conditions, rate, {upsert: true})
			//process the job 10 times, if failed 3 times, bury the job
			if (rate.success < 10 && rate.failure < 3) {
				yield client.releaseAsync(jobId, 0, action.delay)
			} else {
				yield rate.failure < 3 ? client.destroyAsync(jobId) : client.buryAsync(jobId, 0)
			}
		}
	}

	//cleanup stuff
	yield client.ignoreAsync(tubes)
	yield [ db.close(), client.quitAsync() ]
}).catch(err => { console.error(err) })
