'use strict';
const fancyLog = require('fancy-log');
const PluginError = require('plugin-error');
const through = require('through2');
const chalk = require('chalk');
const prettyBytes = require('pretty-bytes');
const StreamCounter = require('stream-counter');
const gzipSize = require('gzip-size');
const brotliSize = require('brotli-size');

module.exports = (options = {}) => {
	options = {
		pretty: true,
		showTotal: true,
		uncompressed: options.uncompressed || !(options.gzip || options.brotli),
		...options
	};

	let fileCount = 0;
	const totalSize = new Map();
	const desc = {uncompressed: '', gzip: ' (gzipped)', brotli: (' (brotli)')};

	function log(what, sizes) {
		let {title} = options;
		title = title ? chalk.cyan(title) + ' ' : '';
		const sizeStrings = [...sizes].map(([key, size]) => {
			size = options.pretty ? prettyBytes(size) : (size + ' B');
			return chalk.magenta(size) + chalk.gray(desc[key]);
		});

		fancyLog(title + what + ' ' + sizeStrings.join(chalk.magenta(', ')));
	}

	function hasSize(sizes) {
		return [...sizes.values()].some(size => size > 0);
	}

	function promisify(stream, property, event = 'end') {
		return new Promise((resolve, reject) => {
			stream.on(event, () => resolve(stream[property]));
			stream.on('error', error => reject(error));
		});
	}

	return through.obj((file, encoding, callback) => {
		if (file.isNull()) {
			callback(null, file);
			return;
		}

		const finish = (error, sizes) => {
			if (error) {
				callback(new PluginError('gulp-size', error));
				return;
			}

			sizes.forEach((size, key) => totalSize.set(key, size + (totalSize.get(key) || 0)));

			if (options.showFiles === true && hasSize(sizes)) {
				log(chalk.blue(file.relative), sizes);
			}

			fileCount++;
			callback(null, file);
		};

		const calc = [];
		const names = [];

		if (file.isStream()) {
			if (options.uncompressed) {
				calc.push(promisify(file.contents.pipe(new StreamCounter()), 'bytes', 'finish'));
				names.push('uncompressed');
			}

			if (options.gzip) {
				calc.push(promisify(file.contents.pipe(gzipSize.stream()), 'gzipSize'));
				names.push('gzip');
			}

			if (options.brotli) {
				calc.push(promisify(file.contents.pipe(brotliSize.stream()), 'brotliSize'));
				names.push('brotli');
			}
		}

		if (file.isBuffer()) {
			if (options.uncompressed) {
				calc.push(file.contents.length);
				names.push('uncompressed');
			}

			if (options.gzip) {
				calc.push(gzipSize(file.contents));
				names.push('gzip');
			}

			if (options.brotli) {
				calc.push(brotliSize.default(file.contents));
				names.push('brotli');
			}
		}

		(async () => {
			try {
				const res = await Promise.all(calc);
				// Name each result
				const namedResult = new Map();
				for (const [idx, size] of res.entries()) {
					namedResult.set(names[idx], size);
				}

				finish(null, namedResult);
			} catch (error) {
				finish(error);
			}
		})();
	}, function (callback) {
		this.size = totalSize.values().next().value;
		this.prettySize = prettyBytes(this.size);
		if (!(fileCount === 1 && options.showFiles) && hasSize(totalSize) && fileCount > 0 && options.showTotal) {
			log(chalk.green('all files'), totalSize);
		}

		callback();
	});
};
