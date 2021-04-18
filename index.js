'use strict';
const fancyLog = require('fancy-log');
const PluginError = require('plugin-error');
const through = require('through2');
const chalk = require('chalk');
const prettyBytes = require('pretty-bytes');
const StreamCounter = require('stream-counter');
const gzipSize = require('gzip-size');
const brotliSize = require('brotli-size');

module.exports = options => {
	options = {
		pretty: true,
		showTotal: true,
		uncompressed: !options || options.uncompressed || !(options.gzip || options.brotli),
		...options
	};

	let fileCount = 0;
	const totalSize = {};

	function log(what, sizes) {
		let {title} = options;
		title = title ? chalk.cyan(title) + ' ' : '';
		const desc = {uncompressed: '', gzip: ' (gzipped)', brotli: (' (brotli)')};
		const strings = Object.entries(sizes).map(([k, v]) => {
			const size = options.pretty ? prettyBytes(v) : (v + ' B');
			return chalk.magenta(size) + chalk.gray(desc[k]);
		});

		fancyLog(title + what + ' ' + strings.join(chalk.magenta(', ')));
	}

	function addPropWise(a, b) {
		// eslint-disable-next-line guard-for-in
		for (const k in b) {
			a[k] = (a[k] + b[k]) || b[k];
		}

		return a;
	}

	function hasSize(sizes) {
		return Object.values(sizes).some(a => a > 0);
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

		const finish = (error, size) => {
			if (error) {
				callback(new PluginError('gulp-size', error));
				return;
			}

			addPropWise(totalSize, size);

			if (options.showFiles === true && hasSize(size)) {
				log(chalk.blue(file.relative), size);
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
				// Shoehorning, because one size fits all
				calc.push(new Promise(resolve => resolve(file.contents.length)));
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
				finish(null, await Promise.all(calc).then(res => {
					// Name each result
					return res.reduce((acc, cur, idx) => ({...acc, [names[idx]]: cur}), {});
				}));
			} catch (error) {
				finish(error);
			}
		})();
	}, function (callback) {
		this.size = totalSize[Object.keys(totalSize)[0]];
		this.prettySize = prettyBytes(this.size);
		if (!(fileCount === 1 && options.showFiles) && hasSize(totalSize) && fileCount > 0 && options.showTotal) {
			log(chalk.green('all files'), totalSize);
		}

		callback();
	});
};
