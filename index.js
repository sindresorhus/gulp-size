'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var filesize = require('filesize');

module.exports = function (options) {
	options = options || {};

	var totalSize = 0;

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
			gutil.log('gulp-size: ' + gutil.colors.blue(file.relative) + ' ' + filesize(size));
		}

		this.push(file);
		cb();
	}, function (cb) {
		gutil.log('gulp-size: ' + gutil.colors.green('total ') + filesize(totalSize));
		cb();
	});
};
