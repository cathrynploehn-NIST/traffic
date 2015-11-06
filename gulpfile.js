var gulp = require('gulp'),
	browserify = require('gulp-browserify'),
	concat = require('gulp-concat'),
	connect = require('gulp-connect');

gulp.task('browserify', function() {
    gulp.src('src/js/main.js')
      .pipe(browserify({transform:'reactify'}))
      .pipe(concat('main.js'))
      .pipe(gulp.dest('dist/js'));
});

gulp.task('copy', function() {
    // gulp.src('src/*.html')
    //   .pipe(gulp.dest('dist'));
});

gulp.task('connect', function() {
  connect.server({
    root: 'dist',
    livereload: true
  });
});

gulp.task('default',['browserify', 'copy', 'connect' , 'watch']);

gulp.task('watch', function() {
    gulp.watch('src/**/*.*', ['browserify', 'copy' ]);
});
