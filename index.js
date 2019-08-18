'use strict';
const fancyLog = require('fancy-log');
const PluginError = require('plugin-error');
const through = require('through2');
const chalk = require('chalk');
const prettyBytes = require('pretty-bytes');
const StreamCounter = require('stream-counter');
const gzipSize = require('gzip-size');

module.exports = options => {
	options = {
		pretty: true,
		showTotal: true,
		...options
	};

	let totalSize = 0;
	let fileCount = 0;

	function log(what, size) {
		let {title} = options;
		title = title ? chalk.cyan(title) + ' ' : '';
		size = options.pretty ? prettyBytes(size) : (size + ' B');
		fancyLog(title + what + ' ' + chalk.magenta(size) + (options.gzip ? chalk.gray(' (gzipped)') : ''));
	}

	return through.obj((file, encoding, callback) => {
		if (file.isNull()) {
			callback(null, file);
			return;
		}

		const finish = (error, size) => {
			if (error) {
				callback(new PluginError('gulp-size', error));
				return;
			}

			totalSize += size;

			if (options.showFiles === true && size > 0) {
				log(chalk.blue(file.relative), size);
			}

			fileCount++;
			callback(null, file);
		};

		if (file.isStream()) {
			if (options.gzip) {
				file.contents.pipe(gzipSize.stream())
					.on('error', finish)
					.on('end', function () {
						finish(null, this.gzipSize);
					});
			} else {
				file.contents.pipe(new StreamCounter())
					.on('error', finish)
					.on('finish', function () {
						finish(null, this.bytes);
					});
			}

			return;
		}

		if (options.gzip) {
			(async () => {
				try {
					finish(null, await gzipSize(file.contents));
				} catch (error) {
					finish(error);
				}
			})();
		} else {
			finish(null, file.contents.length);
		}
	}, function (callback) {
		this.size = totalSize;
		this.prettySize = prettyBytes(totalSize);

		if (!(fileCount === 1 && options.showFiles) && totalSize > 0 && fileCount > 0 && options.showTotal) {
			log(chalk.green('all files'), totalSize);
		}

		callback();
	});
};
