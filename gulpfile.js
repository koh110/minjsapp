'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var browserSync =require('browser-sync');
var notifier = require('node-notifier');

var config = {
  server : {
    port: 8282
  },
  js: {
    output: {
      directory: './app',
      fileName: 'app.js'
    },
    files: [
      './app/js/*.js'
    ]
  },
  css: {
    output: {
      directory: './app',
      fileName: 'style.css'
    },
    files: [
      './app/css/*.css'
    ],
    prefixer: [
      'last 1 versions',
      'ie >= 10',
      'safari >= 8',
      'ios >= 8',
      'android >= 4'
    ]
  }
};

var notify = function(taskName, error) {
  var title = '[task]' + taskName + ' ' + error.plugin;
  var errorMsg = 'error: ' + error.message;
  console.error(title + '\n' + errorMsg);
  notifier.notify({
    title: title,
    message: errorMsg,
    time: 3000
  });
};

gulp.task('server', function() {
  browserSync({
    port: config.server.port,
    server: {
      baseDir: './app/',
      index  : 'index.html'
    }
  });
});

gulp.task('reloadServer', function () {
  browserSync.reload();
});

gulp.task('css', function() {
  return gulp.src(config.css.files)
    .pipe($.plumber({
      errorHandler: function(error) {
        notify('css', error);
      }
    }))
    .pipe($.concat(config.css.output.fileName))
    .pipe($.pleeease({
      autoprefixer: {
        browsers: config.css.prefixer
      },
      minifier: false
    }))
    .pipe($.plumber.stop())
    .pipe(gulp.dest(config.css.output.directory));
});

gulp.task('js', ['lint'], function() {
  return gulp.src(config.js.files)
    .pipe($.plumber({
      errorHandler: function(error) {
        notify('js', error);
      }
    }))
    .pipe($.babel())
    .pipe($.concat(config.js.output.fileName))
    .pipe($.plumber.stop())
    .pipe(gulp.dest(config.js.output.directory));
});

gulp.task('lint', function() {
  return gulp.src(config.js.files)
    .pipe($.plumber({
      errorHandler: function(error) {
        notify('lint', error);
      }
    }))
    .pipe($.eslint())
    .pipe($.eslint.format())
    .pipe($.eslint.failOnError())
    .pipe($.plumber.stop());
});

gulp.task('build', ['js', 'css'], function() {});

gulp.task('watch', function() {
  gulp.watch('app/index.html', ['reloadServer']);
  gulp.watch(config.js.files, ['js', 'reloadServer']);
  gulp.watch(config.css.files, ['css', 'reloadServer']);
});

gulp.task('default', ['watch', 'server']);
