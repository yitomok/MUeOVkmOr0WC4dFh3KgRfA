'use strict'

const https = require('https')
const Promise = require('bluebird')
const co = require('co')
const fivebeans = require('fivebeans')
const mongodb = require('mongodb')

/**
 * Return a Promise connecting to a beanstalkd instance
 *
 * @function
 * @param {string} host - hostname or IP address
 * @param {number} port - port
 */
const connectAsync = (host, port) => new Promise((resolve, reject) => {
	let client = new fivebeans.client(host, port)
	Promise.promisifyAll(client, { multiArgs: true })

	client.on('connect', () => resolve(client))
		.on('error', err => reject(err))
		.connect()
})

/**
 * Return a Promise getting rate data
 *
 * @function
 * @param {object} payload - A payload from beanstalkd
 */
const getDataAsync = payload => new Promise((resolve, reject) => {
	const app_id = '32c0deeb3a8f431c953dfd317c0005a0'
	const options = {
		hostname: 'openexchangerates.org',
		port: 443,
		// Free API only support USD -> others :(
		// path: '/api/latest.json?app_id=' + app_id + '&base=' + from + '&symbols=' + to,
		path: '/api/latest.json?app_id=' + app_id,
		method: 'GET'
	}

	const req = https.request(options, res => {
		let data = ''
		res.on('data', d => { data += d })
		res.on('end', () => resolve(JSON.parse(data).rates[payload.to]))
	})
	req.end()
	req.on('error', err => reject(err))
})

//main routine using co module
co(function*() {
	const tubes = [ 'yitomok' ]
	const db_uri = 'mongodb://backend-lv3:backend-lv3@ds058548.mongolab.com:58548/backend-lv3'

	const res = yield [ connectAsync('localhost', 11300), mongodb.MongoClient.connect(db_uri, { promiseLibrary: Promise }) ]
	const client = res[0]
	const db = res[1]
	yield [ client.useAsync(tubes), client.watchAsync(tubes) ]

	for(;;) {
		//fetch job from tube
		const data = yield client.reserveAsync()
		console.log([ 'job', data[0], 'payload is', data[1] ].join(' '))
		let req = JSON.parse(data[1])
		if (!req.hasOwnProperty('succ')) {
			req.succ = 0
			req.fail = 0
		}

		//fetch rate from provider
		let delay = 60
		let rate = -1
		try {
			rate = yield getDataAsync(req)
			console.log([ 'job', data[0], 'rate is', rate ].join(' '))
			req.succ += 1
		} catch (err) {
			console.error(err)
			req.fail += 1
			delay = 3
		}

		//save to mongodb
		yield db.collection('rates').insertOne({
			'from': req.from,
			'to': req.to,
			'created_at': new Date(),
			'rate': rate.toFixed(2).toString()
		})

		//if fail < 3, destroy job, reput new job to tube, else bury the job
		yield req.fail < 3 ? client.destroyAsync(data[0]) : client.buryAsync(data[0], 0)
		if (req.succ < 10 && req.fail < 3)
			yield client.putAsync(0, delay, 120, JSON.stringify(req))
	}

	//cleanup stuff
	yield [ client.quitAsync(), db.close() ]
}).catch(err => { console.error(err) })
