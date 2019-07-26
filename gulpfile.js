'use strict';
let gulp = require('gulp'),
    plumber = require('gulp-plumber'),
    rename = require('gulp-rename');
let autoprefixer = require('gulp-autoprefixer');
let uglify = require('gulp-uglify-es').default;
let imagemin = require('gulp-imagemin'),
    cache = require('gulp-cache');
let minifycss = require('gulp-clean-css');
let sass = require('gulp-sass');
let browserSync = require('browser-sync');
sass.compiler = require('node-sass');

const paths = {
    styles: {
        src: 'app/server/views/scss/**/*.scss',
        dest: 'app/public/css'
    },
    scripts: {
        src: 'app/src/js/**/*.js',
        dest: 'app/public/js'
    },
    images: {
        src: 'app/src/img/**/*',
        dest: 'app/public/img'
    },
    handlebars: {
        src: 'app/server/views/**/*'
    }

};

async function style() {
    return gulp
        .src(paths.styles.src, {since: gulp.lastRun(style)})
        .pipe(plumber({
            errorHandler: function (error) {
                console.log(error.message);
                this.emit('end');
            }}))
        .pipe(sass())
        .pipe(autoprefixer())
        .pipe(gulp.dest(paths.styles.dest))
        .pipe(rename({suffix: '.min'}))
        .pipe(minifycss())
        .pipe(gulp.dest(paths.styles.dest))
        .pipe(browserSync.reload({stream:true}))


}

async function scripts() {
    return gulp.src(paths.scripts.src, {since: gulp.lastRun(scripts)})
        .pipe(plumber({
            errorHandler: function (error) {
                console.log(error.message);
                this.emit('end');
            }}))
        .pipe(gulp.dest(paths.scripts.dest))
        .pipe(rename({suffix: '.min'}))
        .pipe(uglify())
        .on('error', function (err) { console.log(err.toString()); })
        .pipe(gulp.dest(paths.scripts.dest))

}

async function images(){
    gulp.src(paths.images.src, {since: gulp.lastRun(images)})
        .pipe(imagemin())
        .pipe(gulp.dest(paths.images.dest))
}
gulp.task('scripts', scripts);
gulp.task('styles', style);
gulp.task('images', images);


gulp.task('browser-sync', async function() {
    browserSync({
        proxy: 'localhost:8080',
        reloadDelay: 500,
        reloadDebounce: 2000,
        notify: false
    });
});

gulp.task('bs-reload', async function () {
    browserSync.reload();
});

gulp.task('build', gulp.series(['scripts', 'styles', 'images']));

gulp.task('default', gulp.series(['build', 'browser-sync'], function(){
    gulp.watch(paths.styles.src).on('change', gulp.series(['styles', 'bs-reload']));
    gulp.watch(paths.scripts.src).on('change', gulp.series(['scripts', 'bs-reload']));
    gulp.watch([paths.handlebars.src]).on('change',  gulp.parallel(['bs-reload']));
}));

exports.build = gulp.task('build');
exports.default = gulp.task('default');
