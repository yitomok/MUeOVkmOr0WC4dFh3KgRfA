'use strict'

var fivebeans = require('fivebeans')
var https = require('https')
var mongodb = require('mongodb')
var promise = require('bluebird')
promise.promisifyAll(mongodb)

var getData = function(client, payload) {
	var app_id = '32c0deeb3a8f431c953dfd317c0005a0'
	var options = {
		hostname: 'openexchangerates.org',
		port: 443,
		// Free API only support USD -> others :(
		// path: '/api/latest.json?app_id=' + app_id + '&base=' + from + '&symbols=' + to,
		path: '/api/latest.json?app_id=' + app_id,
		method: 'GET'
	}

	var object = JSON.parse(payload)
	var succ = 0
	var fail = 0
	if (object.hasOwnProperty('succ'))
		succ = object.succ
	if (object.hasOwnProperty('fail'))
		fail = object.fail
	var req = https.request(options, function(res) {
		var data = ''
		res.on('data', function(d) {
			data += d
		})
		res.on('end', function() {
			var rate = JSON.parse(data).rates[object.to].toFixed(2)
			console.log('rate is ' + rate)
			var doc = { 'from': object.from, 'to': object.to, 'created_at': new Date(), 'rate': rate }
			dbInsert(doc)

			var delay = 0
			if (res.statusCode == 200) {
				object.succ = ++succ
				delay = 60
			} else {
				object.fail = ++fail
				delay = 3
			}

			console.log('object is ' + JSON.stringify(object))
			if (succ < 10 && fail < 3)
				client.put(0, delay, 600, JSON.stringify(object), function(err, jobid) {})
		})
	})
	req.end()

	req.on('error', function(err) {
		console.error(err)
	})
}

var db_uri = 'mongodb://yitomok:yitomok@ds038888.mongolab.com:38888/backend-lv3'

var dbInsert = function(payload) {
	var cli = mongodb.MongoClient
	cli.connectAsync(db_uri).then(function(db) {
		return db.collection('usd2hkd').insertOneAsync(payload)
		.finally(function() {
			return db.closeAsync()
		})
	}).catch(function(err) {
		console.error(err)
	})
}

var client = new fivebeans.client('challenge.aftership.net', 11300)
client.on('connect', function() {
	var reserve = function() {
		client.reserve(function(err, jobid, payload) {
			console.log('job ' + jobid + ' payload is ' + payload)
			getData(client, payload)
			client.destroy(jobid, function(err) {
				console.log('destroyed job ' + jobid)
				reserve()
			})
		})
	}

	client.use('yitomok', function(err, tubename) {})
	client.watch('yitomok', function(err, numwatched) { reserve() })
}).connect()
