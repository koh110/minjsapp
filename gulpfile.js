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
const APP_ROOT = `${path.resolve(__dirname)}/app`;

// 設定
const config = {
  dist: {
    directory: `${APP_ROOT}/dist`
  },
  server: {
    port: 8282
  },
  js: {
    files: [
      `${APP_ROOT}/js/**/*.js`
    ],
    vendor: {
      output: {
        filename: 'vendor.js'
      },
      files: [
        'node_modules/jquery/dist/jquery.min.js'
      ]
    }
  },
  webpack: {
    entry: `${APP_ROOT}/js/app.js`,
    devtool: '#source-map',
    output: {
      path: `${APP_ROOT}/dist`,
      filename: 'app.js'
    },
    externals: {
      document: 'document',
      jquery: '$'
    },
    resolve: {
      root: `${APP_ROOT}/js`,
      extensions: ['', '.js']
    },
    module: {
      loaders: [
        {
          test: /\.js$/,
          loader: 'babel-loader',
          query: {
            presets: ['es2015']
          }
        }
      ]
    }
  },
  style: {
    output: {
      buildDirectory: `${path.resolve(__dirname)}/tmp`,
      filename: 'style.css'
    },
    css: {
      files: [
        `${APP_ROOT}/styles/css/*.css`
      ],
      buildName: 'concat.css'
    },
    sass: {
      entry: `${APP_ROOT}/styles/sass/entry.scss`,
      files: [
        `${APP_ROOT}/styles/sass/*.scss`
      ],
      buildName: 'build.css'
    },
    autoprefixer: {
      browsers: [
        'last 1 versions',
        'ie >= 10',
        'safari >= 8',
        'ios >= 8',
        'android >= 4'
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
  browserSync({
    port: config.server.port,
    server: {
      baseDir: APP_ROOT,
      index: 'index.html'
    }
  });
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
  .pipe(gulp.dest(config.dist.directory));
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
  const conf = config.webpack;
  webpackBuild(conf, cb);
});
gulp.task('watch-webpack', ['lint'], (cb) => {
  const conf = Object.assign(config.webpack, { watch: true });
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
// npmで入れたフロントエンドライブラリのconcat処理
gulp.task('vendor', () => {
  return gulp.src(config.js.vendor.files)
    .pipe(plumber({
      errorHandler: (error) => {
        notify('vendor', error);
      }
    }))
    .pipe(concat(config.js.vendor.output.filename))
    .pipe(plumber.stop())
    .pipe(gulp.dest(config.dist.directory));
});

// jsとcssのビルド処理
gulp.task('build', ['vendor', 'webpack', 'styles']);

gulp.task('watch', ['watch-webpack', 'watch-styles'], () => {
  // html, js, cssの成果物どれかに変更があったらサーバをリロード
  gulp.watch([
    `${APP_ROOT}/index.html`,
    `${config.webpack.output.path}/${config.webpack.output.filename}`,
    `${config.dist.directory}/${config.style.output.filename}`
  ], ['reloadServer']);
});

gulp.task('default', ['build', 'watch', 'server']);
