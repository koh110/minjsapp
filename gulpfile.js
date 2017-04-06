'use strict';

const path = require('path');
const fs = require('fs');
const gulp = require('gulp');
const concat = require('gulp-concat');
const sass = require('node-sass');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const plumber = require('gulp-plumber');
const eslint = require('gulp-eslint');
const webpack = require('webpack');
const browserSync = require('browser-sync');
const notifier = require('node-notifier');

// アプリケーションの配置ディレクトリ
const SRC_PATH = path.resolve(process.env.SRC_PATH);
const DIST_PATH = path.resolve(process.env.DIST_PATH);

// 設定
const config = {
  server: {
    port: 8282,
    server: {
      baseDir: DIST_PATH,
      index: 'index.html'
    }
  },
  js: {
    files: [
      `${SRC_PATH}/js/**/*.js`
    ]
  },
  style: {
    output: {
      buildDirectory: path.resolve(__dirname, 'tmp'),
      filename: 'style.css'
    },
    css: {
      files: [
        `${SRC_PATH}/styles/css/*.css`
      ],
      buildName: 'concat.css'
    },
    sass: {
      entry: `${SRC_PATH}/styles/sass/entry.scss`,
      files: [
        `${SRC_PATH}/styles/sass/*.scss`
      ],
      buildName: 'build.css'
    },
    autoprefixer: {
      browsers: [
        'last 1 versions',
        'ie >= 11',
        'safari >= 9',
        'ios >= 0',
        'android >= 5'
      ]
    }
  }
};

// エラー時のnotify表示
const notify = (taskName, error) => {
  const title = `[task]${taskName} ${error.plugin}`;
  const errorMsg = `error: ${error.message}`;
  /* eslint-disable no-console */
  console.error(`${title}\n${error}`);
  notifier.notify({
    title: title,
    message: errorMsg,
    time: 3000
  });
};

// サーバ起動
gulp.task('server', () => {
  browserSync(config.server);
});

// サーバ再起動
gulp.task('reloadServer', () => {
  browserSync.reload();
});

// css系処理
gulp.task('css', () => {
  return gulp.src(config.style.css.files)
    .pipe(plumber({
      errorHandler: (error) => {
        notify('css', error);
      }
    }))
    .pipe(concat(config.style.css.buildName))
    .pipe(plumber.stop())
    .pipe(gulp.dest(config.style.output.buildDirectory));
});
// sass compile
gulp.task('sass', (cb) => {
  sass.render({
    file: config.style.sass.entry
  }, (err, result) => {
    if (err) {
      notify('sass', err);
      return cb(err);
    }
    fs.writeFile(`${config.style.output.buildDirectory}/${config.style.sass.buildName}`, result.css, (err) => {
      if (err) {
        notify('sass', err);
        return cb(err);
      }
      cb();
    });
  });
});
// css連結 -> autoprefixer
gulp.task('styles', ['css', 'sass'], () => {
  return gulp.src([
    `${config.style.output.buildDirectory}/${config.style.css.buildName}`,
    `${config.style.output.buildDirectory}/${config.style.sass.buildName}`
  ])
  .pipe(plumber({
    errorHandler: (error) => {
      notify('style', error);
    }
  }))
  .pipe(concat(config.style.output.filename))
  .pipe(postcss([autoprefixer(config.style.autoprefixer)]))
  .pipe(plumber.stop())
  .pipe(gulp.dest(DIST_PATH));
});
gulp.task('watch-styles', () => {
  const files = config.style.css.files.concat(config.style.sass.files);
  gulp.watch(files, ['styles']);
});

// js系処理
const webpackBuild = (conf, cb) => {
  webpack(conf, (err) => {
    if (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      throw err;
    }
    if (!cb.called) {
      cb.called = true;
      return cb();
    }
  });
};
gulp.task('webpack', ['lint'], (cb) => {
  const conf = require('./webpack.config');
  webpackBuild(conf, cb);
});
gulp.task('watch-webpack', ['lint'], (cb) => {
  const _conf = require('./webpack.config');
  const conf = Object.assign(_conf, { watch: true });
  webpackBuild(conf, cb);
});

// jsのlint処理
gulp.task('lint', () => {
  return gulp.src(config.js.files)
    .pipe(plumber({
      errorHandler: (error) => {
        notify('lint', error);
      }
    }))
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failOnError())
    .pipe(plumber.stop());
});

gulp.task('html', () => {
  return gulp.src(`${SRC_PATH}/index.html`)
    .pipe(gulp.dest(DIST_PATH));
});
gulp.task('watch-html', ['html']);

// jsとcssのビルド処理
gulp.task('build', ['html', 'webpack', 'styles']);

gulp.task('watch', ['watch-html', 'watch-webpack', 'watch-styles'], () => {
  // html, js, cssの成果物どれかに変更があったらサーバをリロード
  gulp.watch([
    `${SRC_PATH}/index.html`,
    `${DIST_PATH}/*.js`,
    `${DIST_PATH}/*.css`
  ], ['reloadServer']);
});

gulp.task('default', ['build', 'watch', 'server']);
