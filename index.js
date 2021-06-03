'use strict';
const fancyLog = require('fancy-log');
const PluginError = require('plugin-error');
const through = require('through2');
const chalk = require('chalk');
const prettyBytes = require('pretty-bytes');
const StreamCounter = require('stream-counter');
const gzipSize = require('gzip-size');
const brotliSize = require('brotli-size');

function hasSize(sizes) {
	return [...sizes.values()].some(size => size > 0);
}

function promisify(stream, property, event = 'end') {
	return new Promise((resolve, reject) => {
		stream.on(event, () => resolve(stream[property]))
			.on('error', error => reject(error));
	});
}

module.exports = (options = {}) => {
	options = {
		pretty: true,
		showTotal: true,
		uncompressed: options.uncompressed || !(options.gzip || options.brotli),
		...options
	};

	let fileCount = 0;
	const totalSize = new Map();

	const description = new Map([
		['uncompressed', ''],
		['gzip', ' (gzipped)'],
		['brotli', ' (brotli)']
	]);

	function log(what, sizes) {
		let {title} = options;
		title = title ? chalk.cyan(title) + ' ' : '';
		const sizeStrings = [...sizes].map(([key, size]) => {
			size = options.pretty ? prettyBytes(size) : (size + ' B');
			return chalk.magenta(size) + chalk.gray(description.get(key));
		});

		fancyLog(title + what + ' ' + sizeStrings.join(chalk.magenta(', ')));
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

			for (const [key, size] of sizes) {
				totalSize.set(key, size + (totalSize.get(key) || 0));
			}

			if (options.showFiles === true && hasSize(sizes)) {
				log(chalk.blue(file.relative), sizes);
			}

			fileCount++;
			callback(null, file);
		};

		const selectedSizes = new Map();
		if (file.isStream()) {
			if (options.uncompressed) {
				selectedSizes.set('uncompressed', promisify(file.contents.pipe(new StreamCounter()), 'bytes', 'finish'));
			}

			if (options.gzip) {
				selectedSizes.set('gzip', promisify(file.contents.pipe(gzipSize.stream()), 'gzipSize'));
			}

			if (options.brotli) {
				selectedSizes.set('brotli', promisify(file.contents.pipe(brotliSize.stream()), 'brotliSize'));
			}
		}

		if (file.isBuffer()) {
			if (options.uncompressed) {
				selectedSizes.set('uncompressed', file.contents.length);
			}

			if (options.gzip) {
				selectedSizes.set('gzip', gzipSize(file.contents));
			}

			if (options.brotli) {
				selectedSizes.set('brotli', brotliSize.default(file.contents));
			}
		}

		(async () => {
			try {
				// We want to keep the names
				const sizes = await Promise.all([...selectedSizes].map(async ([key, size]) => [key, await size]));

				finish(null, new Map(sizes));
			} catch (error) {
				finish(error);
			}
		})();
	}, function (callback) {
		this.size = totalSize.values().next().value || 0;
		this.prettySize = prettyBytes(this.size);

		if (!(fileCount === 1 && options.showFiles) && hasSize(totalSize) && fileCount > 0 && options.showTotal) {
			log(chalk.green('all files'), totalSize);
		}

		callback();
	});
};
