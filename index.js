'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var chalk = require('chalk');
var prettyBytes = require('pretty-bytes');
var gzipSize = require('gzip-size');
var merge = require('merge');

function log(colors, title, what, size, gzip) {
	title = title ? ('\'' + chalk[colors.title](title) + '\' ') : '';
	gutil.log(title + what + ' ' + chalk[colors.size](prettyBytes(size)) +
		(gzip ? chalk[colors.gzip](' (gzipped)') : ''));
}

gulpSize.colors = {
	singleFile : "blue",
	allFiles : "green",
	size : "magenta",
	title : "cyan",
	gzip :  "gray"
};

function gulpSize(options) {
	options = options || {};
	options.colors = merge(gulpSize.colors, options.colors);

	// fail fast
	Object.keys(options.colors).forEach(function(val) {
		if (typeof chalk[options.colors[val]] !== 'function') {
			throw new gutil.PluginError('gulp-size', '"'+options.colors[val] + '" is not a valid color in the chalk library (used in colors.' + val +')');
		}
	});

	var totalSize = 0;
	var fileCount = 0;

	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			cb(null, file);
			return;
		}

		if (file.isStream()) {
			cb(new gutil.PluginError('gulp-size', 'Streaming not supported'));
			return;
		}

		var finish = function (err, size) {
			totalSize += size;

			if (options.showFiles === true && size > 0) {
				log(options.colors, options.title, chalk[options.colors.singleFile](file.relative), size, options.gzip);
			}

			fileCount++;
			cb(null, file);
		};

		if (options.gzip) {
			gzipSize(file.contents, finish);
		} else {
			finish(null, file.contents.length);
		}
	}, function (cb) {
		this.size = totalSize;
		this.prettySize = prettyBytes(totalSize);

		if (!(fileCount === 1 && options.showFiles) && totalSize > 0 && fileCount > 0) {
			log(options.colors, options.title, chalk[options.colors.allFiles]('all files'), totalSize, options.gzip);
		}

		cb();
	});
}


module.exports = gulpSize;