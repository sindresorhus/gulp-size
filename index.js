'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var prettyBytes = require('pretty-bytes');
var gzipSize = require('gzip-size');

function log(title, what, size, gzip) {
	title = title ? ('\'' + gutil.colors.cyan(title) + '\' ') : '';
	gutil.log(title + what + ' ' + gutil.colors.magenta(prettyBytes(size)) +
		(gzip ? gutil.colors.gray(' (gzipped)') : ''));
}

module.exports = function (options) {
	options = options || {};

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
				log(options.title, gutil.colors.blue(file.relative), size, options.gzip);
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
		if (fileCount === 1 && options.showFiles === true && totalSize > 0) {
			cb();
			return;
		}

		log(options.title, gutil.colors.green('all files'), totalSize, options.gzip);
		cb();
	});
};
