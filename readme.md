# [gulp](http://gulpjs.com)-size [![Build Status](https://travis-ci.org/sindresorhus/gulp-size.svg?branch=master)](https://travis-ci.org/sindresorhus/gulp-size)

> Display the size of your project

![](screenshot.png)

Logs out the total size of files in the stream and optionally the individual file-sizes.


## Install

```bash
$ npm install --save-dev gulp-size
```


## Usage

```js
var gulp = require('gulp');
var size = require('gulp-size');

gulp.task('default', function () {
	gulp.src('fixture.js')
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


## License

[MIT](http://opensource.org/licenses/MIT) © [Sindre Sorhus](http://sindresorhus.com)
