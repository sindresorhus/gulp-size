import fancyLog from 'fancy-log';
import chalk from 'chalk';
import prettyBytes from 'pretty-bytes';
import {gzipSize} from 'gzip-size';
import brotliSize from 'brotli-size';
import {gulpPlugin} from 'gulp-plugin-extras';

const hasSize = sizes => [...sizes.values()].some(size => size > 0);

export default function gulpSize(options = {}) {
	options = {
		pretty: true,
		showTotal: true,
		uncompressed: options.uncompressed || !(options.gzip || options.brotli),
		...options,
	};

	let fileCount = 0;
	const totalSize = new Map();

	const description = new Map([
		['uncompressed', ''],
		['gzip', ' (gzipped)'],
		['brotli', ' (brotli)'],
	]);

	const log = (what, sizes) => {
		let {title} = options;
		title = title ? chalk.cyan(title) + ' ' : '';
		const sizeStrings = [...sizes].map(([key, size]) => {
			size = options.pretty ? prettyBytes(size) : (size + ' B');
			return chalk.magenta(size) + chalk.gray(description.get(key));
		});

		fancyLog(title + what + ' ' + sizeStrings.join(chalk.magenta(', ')));
	};

	return gulpPlugin('gulp-size', async file => {
		const selectedSizes = new Map();

		if (options.uncompressed) {
			selectedSizes.set('uncompressed', file.contents.length);
		}

		if (options.gzip) {
			selectedSizes.set('gzip', gzipSize(file.contents));
		}

		if (options.brotli) {
			selectedSizes.set('brotli', brotliSize.default(file.contents));
		}

		let sizes = await Promise.all([...selectedSizes].map(async ([key, size]) => [key, await size]));
		sizes = new Map(sizes);

		for (const [key, size] of sizes) {
			totalSize.set(key, size + (totalSize.get(key) ?? 0));
		}

		if (options.showFiles === true && hasSize(sizes)) {
			log(chalk.blue(file.relative), sizes);
		}

		fileCount++;

		return file;
	}, {
		async * onFinish(stream) { // eslint-disable-line require-yield
			stream.size = totalSize.values().next().value ?? 0;
			stream.prettySize = prettyBytes(stream.size);

			if (!(fileCount === 1 && options.showFiles) && hasSize(totalSize) && fileCount > 0 && options.showTotal) {
				log(chalk.green('all files'), totalSize);
			}
		},
	});
}
