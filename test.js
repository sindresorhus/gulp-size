'use strict';
var assert = require('assert');
var gutil = require('gulp-util');
var size = require('./index');
var out = process.stdout.write.bind(process.stdout);

it('should limit the size of a module', function (cb) {
	var stream = size();

	process.stdout.write = function (str) {
		out(str);

		if (/1\.23 kB/.test(str)) {
			assert(true);
			process.stdout.write = out;
			cb();
		}
	};

	stream.write(new gutil.File({
		path: __dirname + '/fixture.js',
		contents: new Buffer(1234)
	}));

	stream.end();
});
