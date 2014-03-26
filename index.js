'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var prettyBytes = require('pretty-bytes');
var chalk = require('chalk');

module.exports = function (options) {
	options = options || {};

	var totalSize = 0;
	var fileCount = 0;

	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			this.push(file);
			return cb();
		}

		if (file.isStream()) {
			this.emit('error', new gutil.PluginError('gulp-size', 'Streaming not supported'));
			return cb();
		}

		var size = file.contents.length;
		totalSize += size;

		if (options.showFiles === true) {
			gutil.log('gulp-size: ' + chalk.blue(file.relative) + ' ' + prettyBytes(size));
		}

		fileCount++;
		this.push(file);
		cb();
	}, function (cb) {
		if (fileCount === 1 && options.showFiles === true) {
			return cb();
		}

		gutil.log('gulp-size: ' + chalk.green('total ') + prettyBytes(totalSize));
		cb();
	});
};
