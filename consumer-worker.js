'use strict'

var https = require('https')
var Promise = require('bluebird')
var co = require('co')
var fivebeans = require('fivebeans')
var mongodb = require('mongodb')

function connectAsync(host, port) {
	return new Promise((resolve, reject) => {
		var client = new fivebeans.client(host, port)
		Promise.promisifyAll(client, { multiArgs: true })
		client.on('connect', () => resolve(client))
			.on('error', err => reject(err))
			.connect()
	})
}

function getDataAsync(payload) {
	return new Promise((resolve, reject) => {
		var app_id = '32c0deeb3a8f431c953dfd317c0005a0'
		var options = {
			hostname: 'openexchangerates.org',
			port: 443,
			// Free API only support USD -> others :(
			// path: '/api/latest.json?app_id=' + app_id + '&base=' + from + '&symbols=' + to,
			path: '/api/latest.json?app_id=' + app_id,
			method: 'GET'
		}
		var req = https.request(options, res => {
			var data = ''
			res.on('data', d => { data += d })
			res.on('end', () => resolve(JSON.parse(data).rates[payload.to]))
		})
		req.end()
		req.on('error', err => reject(err))
	})
}

co(function*() {
	var tubes = ['yitomok']
	var db_uri = 'mongodb://localhost/backend-lv3'
	var res = yield [ connectAsync('localhost', 11300), mongodb.MongoClient.connect(db_uri, { promiseLibrary: Promise }) ]
	var client = res[0]
	var db = res[1]
	yield [ client.useAsync(tubes), client.watchAsync(tubes) ]
for(;;){
	//fetch job
	var data = yield client.reserveAsync()
	console.log('job ' + data[0] + ' payload is ' + data[1])
	var req = JSON.parse(data[1])
	if (!req.hasOwnProperty('succ')) {
		req.succ = 0
		req.fail = 0
	}
	//fetch rate data
	try {
		var rate = yield getDataAsync(req)
		console.log('rate is ' + rate)
		req.succ += 1
		var delay = 60
	} catch (err) {
		console.error(err)
		req.fail += 1
		var delay = 3
	}
	//save to mongodb
	yield db.collection('rates').insertOne({
		'from': req.from,
		'to': req.to,
		'created_at': new Date(),
		'rate': rate.toFixed(2).toString()
	})
	yield client.destroyAsync(data[0])
	if (req.succ < 10 && req.fail < 3)
		yield client.putAsync(0, delay, 120, JSON.stringify(req))
}
	yield [ client.quitAsync(), db.close() ]
}).catch(err => { console.error(err) })
