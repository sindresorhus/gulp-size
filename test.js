'use strict';
var assert = require('assert');
var gutil = require('gulp-util');
var size = require('./');

it('should show the size of files in the stream', function (cb) {
	var out = process.stdout.write.bind(process.stdout);
	var stream = size({showFiles: true, title: 'test'});

	process.stdout.write = function (str) {
		out(str);

		if (/0 B/.test(str)) {
			assert(false, 'should not show files of size 0 B');
		}

		if (/fixture2\.js/.test(str)) {
			assert(true);
			process.stdout.write = out;
			cb();
		}
	};

	stream.write(new gutil.File({
		path: __dirname + '/fixture.js',
		contents: new Buffer(0)
	}));

	stream.write(new gutil.File({
		path: __dirname + '/fixture2.js',
		contents: new Buffer(1234)
	}));

	stream.write(new gutil.File({
		path: __dirname + '/fixture3.js',
		contents: new Buffer(1234)
	}));

	stream.end();
});

it('should not show total when `showFiles` is enabled and only one file', function (cb) {
	var out = process.stdout.write.bind(process.stdout);
	var stream = size({showFiles: true});
	var totalDetected = false;

	process.stdout.write = function (str) {
		out(str);

		if (/total/.test(str)) {
			totalDetected = true;
		}
	};

	stream.on('data', function () {});

	stream.on('end', function () {
		process.stdout.write = out;
		assert(!totalDetected);
		cb();
	});

	stream.write(new gutil.File({
		path: __dirname + '/fixture.js',
		contents: new Buffer(1234)
	}));

	stream.end();
});

it('should have `gzip` option', function (cb) {
	var out = process.stdout.write.bind(process.stdout);
	var stream = size({gzip: true});

	process.stdout.write = function (str) {
		out(str);

		if (/gzipped/.test(str)) {
			assert(true);
			process.stdout.write = out;
			cb();
		}
	};

	stream.write(new gutil.File({
		path: __dirname + '/fixture.js',
		contents: new Buffer('unicorn world')
	}));

	stream.end();
});
