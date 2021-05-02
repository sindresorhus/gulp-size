'use strict';
const path = require('path');
const assert = require('assert');
const Vinyl = require('vinyl');
const through = require('through2');
const size = require('./index.js');

it('should show the size of files in the stream', callback => {
	const out = process.stdout.write.bind(process.stdout);
	const stream = size({showFiles: true, title: 'test'});

	process.stdout.write = string => {
		out(string);

		if (/0 B/.test(string)) {
			assert(false, 'should not show files of size 0 B');
		}

		if (/fixture2\.js/.test(string)) {
			assert(true);
			process.stdout.write = out;
			callback();
		}
	};

	stream.write(new Vinyl({
		path: path.join(__dirname, 'fixture.js'),
		contents: Buffer.alloc(0)
	}));

	stream.write(new Vinyl({
		path: path.join(__dirname, 'fixture2.js'),
		contents: Buffer.alloc(1234)
	}));

	stream.write(new Vinyl({
		path: path.join(__dirname, 'fixture3.js'),
		contents: Buffer.alloc(1234)
	}));

	stream.end();
});

it('should not show total when `showFiles` is enabled and only one file', callback => {
	const out = process.stdout.write.bind(process.stdout);
	const stream = size({showFiles: true});
	let totalDetected = false;

	process.stdout.write = string => {
		out(string);

		if (/total/.test(string)) {
			totalDetected = true;
		}
	};

	stream.on('data', () => {});

	stream.on('end', () => {
		process.stdout.write = out;
		assert(!totalDetected);
		callback();
	});

	stream.write(new Vinyl({
		path: path.join(__dirname, 'fixture.js'),
		contents: Buffer.alloc(1234)
	}));

	stream.end();
});

it('should have `gzip` option', callback => {
	const out = process.stdout.write.bind(process.stdout);
	const stream = size({gzip: true});

	process.stdout.write = string => {
		out(string);

		if (/gzipped/.test(string)) {
			assert(true);
			process.stdout.write = out;
			callback();
		}
	};

	stream.write(new Vinyl({
		path: path.join(__dirname, 'fixture.js'),
		contents: Buffer.from('unicorn world')
	}));

	stream.end();
});

it('should have `brotli` option', callback => {
	const out = process.stdout.write.bind(process.stdout);
	const stream = size({brotli: true});

	process.stdout.write = string => {
		out(string);

		if (/brotli/.test(string)) {
			assert(true);
			process.stdout.write = out;
			callback();
		}
	};

	stream.write(new Vinyl({
		path: path.join(__dirname, 'fixture.js'),
		contents: Buffer.from('unicorn world')
	}));

	stream.end();
});

it('should show `uncompressed`, `gzip` and `brotli` size', callback => {
	const out = process.stdout.write.bind(process.stdout);
	const stream = size({uncompressed: true, gzip: true, brotli: true});

	process.stdout.write = string => {
		out(string);

		// Name of compressions protocols and three numbers
		if (/gzipped.*brotli/.test(string) && /(?:.*\b\d+){3}/.test(string)) {
			assert(true);
			process.stdout.write = out;
			callback();
		}
	};

	stream.write(new Vinyl({
		path: path.join(__dirname, 'fixture.js'),
		contents: Buffer.from('unicorn world')
	}));

	stream.end();
});

it('should not show prettified size when `pretty` option is false', callback => {
	const out = process.stdout.write.bind(process.stdout);
	const stream = size({pretty: false});

	process.stdout.write = string => {
		out(string);

		if (/1234 B/.test(string)) {
			assert(true);
			process.stdout.write = out;
			callback();
		}
	};

	stream.write(new Vinyl({
		path: path.join(__dirname, 'fixture.js'),
		contents: Buffer.alloc(1234)
	}));

	stream.end();
});

it('should expose the total size', callback => {
	const stream = size();

	stream.on('finish', () => {
		assert.strictEqual(stream.size, 13);
		assert.strictEqual(stream.prettySize, '13 B');
		callback();
	});

	stream.write(new Vinyl({
		path: path.join(__dirname, 'fixture.js'),
		contents: Buffer.from('unicorn world')
	}));

	stream.end();
});

it('should handle stream contents', callback => {
	const contents = through();
	const stream = size();

	stream.on('finish', () => {
		assert.strictEqual(stream.size, 100);
		assert.strictEqual(stream.prettySize, '100 B');
		callback();
	});

	stream.write(new Vinyl({
		path: path.join(__dirname, 'fixture.js'),
		contents
	}));

	contents.end(Buffer.alloc(100));

	stream.end();
});

it('should handle stream contents with `gzip` option', callback => {
	const contents = through();
	const stream = size({gzip: true});

	stream.on('finish', () => {
		assert.strictEqual(stream.size, 33);
		assert.strictEqual(stream.prettySize, '33 B');
		callback();
	});

	stream.write(new Vinyl({
		path: path.join(__dirname, 'fixture.js'),
		contents
	}));

	contents.end(Buffer.from('unicorn world'));

	stream.end();
});

it('should handle stream contents with `brotli` option', callback => {
	const contents = through();
	const stream = size({brotli: true});

	stream.on('finish', () => {
		assert.strictEqual(stream.size, 17);
		assert.strictEqual(stream.prettySize, '17 B');
		callback();
	});

	stream.write(new Vinyl({
		path: path.join(__dirname, 'fixture.js'),
		contents
	}));

	contents.end(Buffer.from('unicorn world'));

	stream.end();
});
