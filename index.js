'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var chalk = require('chalk');
var prettyBytes = require('pretty-bytes');
var gzipSize = require('gzip-size');

module.exports = function (options) {
	options = options || {};
	options.pretty = options.pretty || options.pretty === undefined;

	var totalSize = 0;
	var fileCount = 0;

	function log(what, size) {
		var title = options.title;
		title = title ? ('\'' + chalk.cyan(title) + '\' ') : '';
		size = options.pretty ? prettyBytes(size) : (size + ' B');
		gutil.log(title + what + ' ' + chalk.magenta(size) + (options.gzip ? chalk.gray(' (gzipped)') : ''));
	}

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
				log(chalk.blue(file.relative), size);
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
			log(chalk.green('all files'), totalSize);
		}

		cb();
	});
};
