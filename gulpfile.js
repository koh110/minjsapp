var gulp = require('gulp');
var browserSync =require('browser-sync');

gulp.task('browser-sync', function() {
  browserSync({
    server: {
      baseDir: './app/',
      index  : 'index.html'
    }
  });
});

gulp.task('bs-reload', function () {
    browserSync.reload();
});

gulp.task('watch', function(){
  gulp.watch('app/index.html', ['bs-reload']);
  gulp.watch('app/scripts/*.js', ['bs-reload']);
  gulp.watch('app/styles/*.css', ['bs-reload']);
});

gulp.task('default', ['watch', 'browser-sync']);
