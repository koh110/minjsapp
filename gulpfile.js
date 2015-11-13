'use strict';

const gulp = require('gulp');
const $ = require('gulp-load-plugins')();
const mainBowerFiles = require('main-bower-files');
const browserSync =require('browser-sync');
const notifier = require('node-notifier');
const runSequence = require('run-sequence');

// 設定
const config = {
  server : {
    port: 8282
  },
  html: {
    injectTarget: './app/index.html'
  },
  js: {
    output: {
      directory: './app/dist',
      fileName: 'app.js'
    },
    files: [
      './app/js/*.js'
    ]
  },
  css: {
    output: {
      directory: './app/dist',
      fileName: 'style.css'
    },
    files: [
      './app/styles/*.css'
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

// エラー時のnotify表示
const notify = (taskName, error) => {
  const title = '[task]' + taskName + ' ' + error.plugin;
  const errorMsg = 'error: ' + error.message;
  console.error(title + '\n' + errorMsg);
  notifier.notify({
    title: title,
    message: errorMsg,
    time: 3000
  });
};

// サーバ起動
gulp.task('server', () => {
  browserSync({
    port: config.server.port,
    server: {
      baseDir: './app/',
      index  : 'index.html'
    }
  });
});

// サーバ再起動
gulp.task('reloadServer', () => {
  browserSync.reload();
});

// css系処理
// css連結 -> autoprefixer
gulp.task('css', () => {
  return gulp.src(config.css.files)
    .pipe($.plumber({
      errorHandler: (error) => {
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

// js系処理
// es6からes5への変換 -> js連結
gulp.task('js', ['lint'], () => {
  return gulp.src(config.js.files)
    .pipe($.plumber({
      errorHandler: (error) => {
        notify('js', error);
      }
    }))
    .pipe($.babel())
    .pipe($.concat(config.js.output.fileName))
    .pipe($.plumber.stop())
    .pipe(gulp.dest(config.js.output.directory));
});

// jsのlint処理
gulp.task('lint', () => {
  return gulp.src(config.js.files)
    .pipe($.plumber({
      errorHandler: (error) => {
        notify('lint', error);
      }
    }))
    .pipe($.eslint())
    .pipe($.eslint.format())
    .pipe($.eslint.failOnError())
    .pipe($.plumber.stop());
});

// bowerで取得したファイルをindex.htmlに挿入
gulp.task('inject', () => {
  return gulp.src(config.html.injectTarget)
    .pipe($.inject(gulp.src(mainBowerFiles()), {
      name: 'inject',
      relative: true
    }))
    .pipe(gulp.dest('./app'));
});

// jsとcssのビルド処理
gulp.task('build', ['js', 'inject', 'css'], () => {});

gulp.task('watch', () => {
  gulp.watch('./app/index.html', () => {
    runSequence('inject', 'reloadServer');
  });
  gulp.watch(config.js.files, () => {
    runSequence('js', 'reloadServer');
  });
  gulp.watch(config.css.files, () => {
    runSequence('css', 'reloadServer');
  });
});

gulp.task('default', ['build', 'watch', 'server']);
