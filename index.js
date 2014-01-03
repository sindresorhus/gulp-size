'use strict';
var gutil = require('gulp-util');
var map = require('map-stream');
var filesize = require('filesize');

module.exports = function (options) {
	options = options || {};
	options.showFiles === undefined ? false : options.showFiles;

	var totalSize = 0;

	var stream = map(function (file, cb) {
		if (file.isNull()) {
			return cb(null, file);
		}

		var size = file.contents.length;
		totalSize += size;

		if (options.showFiles) {
			gutil.log('gulp-size: ' + gutil.colors.blue(file.relative) + ' ' + filesize(size));
		}

		cb(null, file);
	});

	stream.on('end', function () {
		gutil.log('gulp-size: ' + gutil.colors.green('total ') + filesize(totalSize));
	});

	return stream;
};
