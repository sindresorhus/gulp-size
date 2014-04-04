'use strict';
var chalk = require('chalk');
var gutil = require('gulp-util');
var gzipSync = require('zlib-browserify').gzipSync;
var prettyBytes = require('pretty-bytes');
var through = require('through2');

module.exports = function (options) {
	options = options || {};

	var totalSize = 0;
	var fileCount = 0;
	var title = options.title ? options.title + ' ' : '';

	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			this.push(file);
			return cb();
		}

		if (file.isStream()) {
			this.emit('error', new gutil.PluginError('gulp-size', 'Streaming not supported'));
			return cb();
		}

		var size = options.gzip
			? gzipSync(file.contents).length
			: file.contents.length;

		totalSize += size;

		if (options.showFiles === true) {
			writeLog(title, chalk.blue(file.relative), size, options.gzip);
		}

		fileCount++;
		this.push(file);
		cb();
	}, function (cb) {
		if (fileCount === 1 && options.showFiles === true) {
			return cb();
		}

		writeLog(title, chalk.green('total'), totalSize, options.gzip);
		cb();
	});
};

function writeLog(title, what, size, gzip) {
	gutil.log('gulp-size: ' + title + what + ' ' + prettyBytes(size) + ' ' +
		(gzip ? 'gzipped' : ''));
};