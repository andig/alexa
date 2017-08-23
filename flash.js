/*jshint esversion: 6 */
'use strict';

var middleware = 'https://volkszaehler.io/middleware.php/data/';

var defaults = {
	queryOptions: {
		from: 'today',
		to: 'now'
	},
	value: "consumption",
	divider: 1e3,
	unit: "kWh",
	verb: "heute ist",
	precision: 1
};

var channels = {
	temp: {
		uuid: "outsidetemp",
		title: "Außentemperatur",
		verb: "jetzt ist",
		queryOptions: {
			from: 'now',
		},
		value: "last",
		divider: 1,
		unit: "°C"
	},
	bezug: {
		uuid: "bezug",
		title: "Bezug",
	},
	erzeugung: {
		uuid: "erzeugung",
		title: "PV Erzeugung",
	},
	autarkie: {
		uuid: "gesamt",
		callback: autarkie,
		display: false
	},
	jahresverbrauch: {
		uuid: "bezug",
		title: "Strombezug",
		verb: "dieses Jahr ist",
		queryOptions: {
			from: 'first day of january this year',
			to: 'now',
			group: 'day'
		},
		precision: 0
	},
	gasverbrauch: {
		// uuid: "virtualconsumption",
		uuid: "2a6e7fc0-c3aa-11e6-bd21-6392a0e6741f",
		title: "Gasverbrauch",
		verb: "dieses Jahr ist",
		queryOptions: {
			from: 'first day of january this year',
			to: 'now',
			group: 'day'
		},
		precision: 0
	}
};

function valueOrDefault(channel, key) {
	if (channel[key] === undefined) {
		return defaults[key];
	}
	return channel[key];
}

function httpGet(url) {
	// return new pending promise
	return new Promise((resolve, reject) => {
		// select http or https module, depending on reqested url
		const lib = url.startsWith('https') ? require('https') : require('http');
		const request = lib.get(url, (response) => {
			// handle http errors
			if (response.statusCode < 200 || response.statusCode > 299) {
				reject(new Error('Failed to load page, status code: ' + response.statusCode));
			}
			// temporary data holder
			const body = [];
			// on every content chunk, push it to the data array
			response.on('data', (chunk) => body.push(chunk));
			// we are done, resolve promise with those joined chunks
			response.on('end', () => resolve(body.join('')));
		});
		// handle connection errors of the request
		request.on('error', (err) => reject(err));
	});
}

function fetchData(channel) {
	var options = channel.queryOptions || defaults.queryOptions;
	var queryString = Object.keys(options).map(function(key) {
		return key + "=" + options[key];
	}).join("&");

	var uri = middleware + channel.uuid + '.json?' + queryString;
	return httpGet(uri).then(function(res) {
		channel.json = JSON.parse(res);
		return channel;
	});
}

function transform(channel) {
	var json = channel.json;
	// console.log("<" + channel.uuid + ">: " + JSON.stringify(json));

	// special case
	if (channel.callback) {
		return channel.callback(channel);
	}

	var value, valueType = channel.value || defaults.value;
	switch (valueType) {
		case "consumption": 
			value = json.data.consumption;
			break;
		case "last": 
			value = json.data.tuples[json.data.tuples.length-1][1];
			break;
	}

	value = value / (channel.divider || defaults.divider);
	value = +value.toFixed(valueOrDefault(channel, "precision"));
	value = value.toString().replace(/\./, ",");

	var output = [
		channel.title,
		channel.verb || defaults.verb,
		value,
		channel.unit || defaults.unit
	].join(" ").replace("  ", " ") + ".";

	console.log(output);
	return output;
}

function autarkie(channel) {
	var quota = 100 * (1 - channels.bezug.json.data.consumption / + channels.autarkie.json.data.consumption);
	quota = +quota.toFixed(0);
	
	var output = `Autarkiequote ${quota}%.`;
	console.log(output);
	return output;
}

exports.handler = (event, context, callback) => {
	// collect all data
	var promises = Object.keys(channels).map(function(channelKey) {
		var channel = channels[channelKey];
		return fetchData(channel);
	});

	Promise.all(promises).then(function(channels) {
		// console.log(channels);
		var res = channels.map(transform);

		var content = {
		  "uid": "urn:uuid:1335c695-cfb8-4ebb-abbd-80da344effoo",
		  "updateDate": new Date().toISOString(),
		  "titleText": "Volkszaehler Briefing",
		  "mainText": res.join(" "),
		};
		console.log(content);

		var response = {
			statusCode: 200,
			body: JSON.stringify(content),
			headers: {
				'Content-Type': 'application/json; charset=utf-8',
				'Access-Control-Allow-Origin' : '*'
			}
		};

		callback(null, response);
	}, function(error) {
		console.log("Error: " + error);
		callback(new Error(error));
	});
};

exports.handler(null,null,console.log);