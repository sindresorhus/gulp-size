'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var prettyBytes = require('pretty-bytes');
var chalk = require('chalk');
var gulp = require('gulp');

module.exports = function (options) {
	options = options || {};

	var totalSize = 0;
	var fileCount = 0;
	var taskName;

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

		taskName = Object.keys(gulp.tasks).filter(function (el) {
			return gulp.tasks[el].running === true;
		})[0];

		if (options.showFiles === true) {
			gutil.log('gulp-size: \'' + chalk.cyan(taskName) + '\' ' + chalk.blue(file.relative) + ' ' + prettyBytes(size));
		}

		fileCount++;
		this.push(file);
		cb();
	}, function (cb) {
		if (fileCount === 1 && options.showFiles === true) {
			return cb();
		}

		gutil.log('gulp-size: \'' + chalk.cyan(taskName) + '\' ' + chalk.green('total ') + prettyBytes(totalSize));
		cb();
	});
};
