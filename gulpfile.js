'use strict';
var gulp = require('gulp');
var sass = require('gulp-sass');
sass.compiler = require('node-sass');

var paths = {
    styles: {
        src: 'app/server/views/scss/**/*.scss',
        dest: 'app/public/css'
    }
};

function style() {
    return gulp
        .src(paths.styles.src)
        .pipe(sass())
        .on("error", sass.logError)
        .pipe(gulp.dest(paths.styles.dest))
}

function watch() {
    gulp.watch(paths.styles.src, style);
}

exports.watch = watch;
exports.style = style;

var build = gulp.parallel(style);
var gwatch = gulp.parallel(style, watch);
gulp.task('build', build);
gulp.task('default', gwatch);
