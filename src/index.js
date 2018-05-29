/*jshint esversion: 6 */
/* global exports,console,process */
'use strict';

var middleware = 'https://volkszaehler.io/middleware.php/';
// var middleware = 'http://localhost/vz/htdocs/middleware.php/';

var defaults = {
	context: 'data',
	queryOptions: {
		from: 'today',
		to: 'now'
	},
	queryYearToDate: {
		from: 'first day of january this year',
		to: 'now',
		group: 'day'
	},
	value: "consumption",
	divider: 1e3,
	unit: "kWh",
	verb: "heute ist",
	precision: 1
};

var channels = {
	// simple channels
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
		verb: "heute",
		callback: autarkie,
	},

	// complex channels
	prognoseBezug: {
		uuid: "bezug",
		context: "prognosis",
		queryOptions: {
			period: 'year',
			group: 'day'
		},
		callback: prognose,
	},
	prognoseErzeugung: {
		uuid: "erzeugung",
		context: "prognosis",
		queryOptions: {
			period: 'year',
			group: 'day'
		},
		callback: prognose,
	},
	jahresverbrauch: {
		uuid: "bezug",
		title: "Jahresbezug",
		// verb: "dieses Jahr ist",
		verb: "", 
		queryOptions: defaults.queryYearToDate,
		precision: 0,
		forecast: "prognoseBezug",
		callback: withForecast
	},
	jahreserzeugung: {
		uuid: "erzeugung",
		title: "Jahreserzeugung",
		verb: "", // "dieses Jahr ist",
		queryOptions: defaults.queryYearToDate,
		precision: 0,
		forecast: "prognoseErzeugung",
		callback: withForecast
	},
	gasverbrauch: {
		// uuid: "virtualconsumption",
		uuid: "2a6e7fc0-c3aa-11e6-bd21-6392a0e6741f",
		title: "Gasverbrauch",
		verb: "dieses Jahr ist",
		queryOptions: defaults.queryYearToDate,
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
				reject(new Error(`[httpGet] failed with ${response.statusCode} loading ${url}`));
			}
			// temporary data holder
			const body = [];
			// on every content chunk, push it to the data array
			response.on('data', (chunk) => body.push(chunk));
			// we are done, resolve promise with those joined chunks
			response.on('end', () => resolve(body.join('')));
		});
		// handle connection errors of the request
		request.on('error', (err) => {
			reject(`[httpGet] failed loading ${url}. ${err}`);
		});
	});
}

function fetchData(channel) {
	var options = channel.queryOptions || defaults.queryOptions;
	var queryString = Object.keys(options).map(function(key) {
		return key + "=" + encodeURIComponent(options[key]);
	}).join("&");

	var context = channel.context || defaults.context;
	var uri = middleware + context + "/" + channel.uuid + '.json?' + queryString;

	return httpGet(uri).then(function(res) {
		channel.json = JSON.parse(res);
		return channel;
	});
}

function transform(channel, index, array, plain) {
	var json = channel.json;
	console.log(`[transform] <${channel.uuid}>`);
	console.log(JSON.stringify(json));

	// special case
	if (channel.callback && plain !== true) {
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
		valueOrDefault(channel, "verb"),
		value,
		valueOrDefault(channel, "unit"),
	].join(" ") + ".";

	console.log(output);
	return output;
}

function autarkie(channel) {
	var quota = 100 * (1 - channels.bezug.json.data.consumption / + channel.json.data.consumption);
	quota = +quota.toFixed(0);
	
	var output = `Autarkiequote ${channel.verb} ${quota}%.`;
	console.log(output);
	return output;
}

function prognose(channel) {
	var trend, factor = 100 * (channel.json.prognosis.factor - 1);
	if (factor < 0) {
		trend = "unter";
		factor = -factor;
	}
	else if (factor >= 0) {
		trend = "über";
	}

	factor = +factor.toFixed(0);
	
	channel.result = `Das ist ${factor}% ${trend} Vorjahr.`;
	console.log(channel.result);

	// no output
	return '';
}

function withForecast(channel) {
	// prevent endless recursion
	var output = transform(channel, null, null, true);
	var forecast = channels[channel.forecast];
	return output + " " + forecast.result;
}

exports.handler = (event, context, callback) => {
	if (cachedResult) {
		console.log('[handler] using cache');
		callback(null, cachedResult);
	}
/*
	var type = process.env.BRIEFING_TYPE || 'DAY';

	// data selection
	channels = type == 'DAY' ? dataToday : dataYear;
*/
	// collect all data
	var promises = Object.keys(channels).map(function(channelKey) {
		var channel = channels[channelKey];
		return fetchData(channel);
	});

	Promise.all(promises).then(function() {
		var res = Object.keys(channels).map(function(channelKey) {
			return channels[channelKey];
		}).map(transform);

		var content = {
		  "uid": "urn:uuid:1335c695-cfb8-4ebb-abbd-80da344effoo",
		  "updateDate": new Date().toISOString(),
		  "titleText": "Volkszaehler Briefing",
		  "mainText": res.join(" ").replace(/ +/g, " "),
		};
		// console.log(content);

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
		console.error(error);
		callback(new Error(error));
	});
};

var cachedResult;

/**
 * AWS Cache-warming and debug output
 */
exports.handler(null, null, function(error, result) {
	console.log('[warmup]');
	if (error) {
		process.exit(1);
	}
	
	cachedResult = result;
	console.log(result);
});
