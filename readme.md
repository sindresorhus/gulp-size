# gulp-size [![Build Status](https://travis-ci.org/sindresorhus/gulp-size.svg?branch=master)](https://travis-ci.org/sindresorhus/gulp-size)

> Display the size of your project

<img src="screenshot.png" width="341">

Logs out the total size of files in the stream and optionally the individual file-sizes.


## Install

```
$ npm install --save-dev gulp-size
```


## Usage

```js
var gulp = require('gulp');
var size = require('gulp-size');

gulp.task('default', function () {
	return gulp.src('fixture.js')
		.pipe(size())
		.pipe(gulp.dest('dist'));
});
```


## API

### size(options)

#### options

##### showFiles

Type: `boolean`  
Default: `false`

Displays the size of every file instead of just the total size.

##### gzip

Type: `boolean`  
Default: `false`

Displays the gzipped size instead.

##### title

Type: `string`  
Default: ''

Give it a title so it's possible to distinguish the output of multiple instances logging at once.

### options.colors

#### singleFile

Type: `string`
Example: `'blue'` (default)

Chalk based color coding for single file names

#### allFiles

Type: `allFiles`
Example: `'green'` (default)

Chalk based color coding for file summaries

#### size

Type: `string`
Example: `'magenta'` (default)

Chalk based color coding for file sizes

#### title

Type: `string`
Example: `'cyan'` (default)

Chalk based color coding for custom titles

#### gzip

Type: `string`
Example: `'gray'` (default)

Chalk based color coding for gzip suffix


### size.size

Type: `number`  
Example: `12423000`

The total size of all files in bytes.

### size.prettySize

Type: `string`  
Example: `'14 kB'`

Prettified version of `.size`.

Useful for eg. reporting the total project size with [`gulp-notify`](https://github.com/mikaelbr/gulp-notify):

```js
var gulp = require('gulp');
var size = require('gulp-size');
var notify = require('gulp-notify');

gulp.task('default', function () {
	var s = size();
	return gulp.src('fixture.js')
		.pipe(s)
		.pipe(gulp.dest('dist'))
		.pipe(notify({
			onLast: true,
			message: function () {
				return 'Total size ' + s.prettySize;
			}
		}));
});
```

### size.colors

Aforementioned colors can be set globally by modifying `size.colors`. Local configuration takes precedence over global configuration.

```js
var gulp = require('gulp');
var size = require('gulp-size');

size.colors.singleFile = 'cyan';

gulp.task('default', function() {

	return gulp.src('main.js')
		.pipe(size( { title: 'MAIN FILE', colors : { title : 'red' } } ))
		.pipe(gulp.dest('public'));

});
```


## License

MIT © [Sindre Sorhus](http://sindresorhus.com)
