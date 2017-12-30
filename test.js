'use strict';
const path = require('path');
const assert = require('assert');
const Vinyl = require('vinyl');
const through = require('through2');
const size = require('.');

it('should show the size of files in the stream', cb => {
	const out = process.stdout.write.bind(process.stdout);
	const stream = size({showFiles: true, title: 'test'});

	process.stdout.write = str => {
		out(str);

		if (/0 B/.test(str)) {
			assert(false, 'should not show files of size 0 B');
		}

		if (/fixture2\.js/.test(str)) {
			assert(true);
			process.stdout.write = out;
			cb();
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

it('should not show total when `showFiles` is enabled and only one file', cb => {
	const out = process.stdout.write.bind(process.stdout);
	const stream = size({showFiles: true});
	let totalDetected = false;

	process.stdout.write = str => {
		out(str);

		if (/total/.test(str)) {
			totalDetected = true;
		}
	};

	stream.on('data', () => {});

	stream.on('end', () => {
		process.stdout.write = out;
		assert(!totalDetected);
		cb();
	});

	stream.write(new Vinyl({
		path: path.join(__dirname, 'fixture.js'),
		contents: Buffer.alloc(1234)
	}));

	stream.end();
});

it('should have `gzip` option', cb => {
	const out = process.stdout.write.bind(process.stdout);
	const stream = size({gzip: true});

	process.stdout.write = str => {
		out(str);

		if (/gzipped/.test(str)) {
			assert(true);
			process.stdout.write = out;
			cb();
		}
	};

	stream.write(new Vinyl({
		path: path.join(__dirname, 'fixture.js'),
		contents: Buffer.from('unicorn world')
	}));

	stream.end();
});

it('should not show prettified size when `pretty` option is false', cb => {
	const out = process.stdout.write.bind(process.stdout);
	const stream = size({pretty: false});

	process.stdout.write = str => {
		out(str);

		if (/1234 B/.test(str)) {
			assert(true);
			process.stdout.write = out;
			cb();
		}
	};

	stream.write(new Vinyl({
		path: path.join(__dirname, 'fixture.js'),
		contents: Buffer.alloc(1234)
	}));

	stream.end();
});

it('should expose the total size', cb => {
	const stream = size();

	stream.on('finish', () => {
		assert.strictEqual(stream.size, 13);
		assert.strictEqual(stream.prettySize, '13 B');
		cb();
	});

	stream.write(new Vinyl({
		path: path.join(__dirname, 'fixture.js'),
		contents: Buffer.from('unicorn world')
	}));

	stream.end();
});

it('should handle stream contents', cb => {
	const contents = through();
	const stream = size();

	stream.on('finish', () => {
		assert.strictEqual(stream.size, 100);
		assert.strictEqual(stream.prettySize, '100 B');
		cb();
	});

	stream.write(new Vinyl({
		path: path.join(__dirname, 'fixture.js'),
		contents
	}));

	contents.end(Buffer.alloc(100));

	stream.end();
});

it('should handle stream contents with `gzip` option', cb => {
	const contents = through();
	const stream = size({gzip: true});

	stream.on('finish', () => {
		assert.strictEqual(stream.size, 33);
		assert.strictEqual(stream.prettySize, '33 B');
		cb();
	});

	stream.write(new Vinyl({
		path: path.join(__dirname, 'fixture.js'),
		contents
	}));

	contents.end(Buffer.from('unicorn world'));

	stream.end();
});
