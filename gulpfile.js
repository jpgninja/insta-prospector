var gulp = require('gulp');
var express = require('express');
var lr = require('tiny-lr')();
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var less = require('gulp-less');
var minify = require('gulp-minify');
var minifycss = require('gulp-minify-css');
var transform = require('vinyl-transform');
var less = require('gulp-less');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var babel = require('gulp-babel');
var stripDebug = require('gulp-strip-debug');
var sourcemaps = require('gulp-sourcemaps');
var cssnano = require('gulp-cssnano');
var clean = require('gulp-clean');

var APP_ENVIRONMENT = 'DEV';
// var APP_ENVIRONMENT = 'PROD';

/**
 * Project Variables
 */
var project = 'prospector';

var paths = {
  src: {
    scripts: {
      project: ['src/js/*.js', 'src/js/**/*.js'],
      background: ['src/js/background/*.js', 'src/js/background/**/*.js'],
      vendor: [
        'node_modules/jquery/dist/jquery.js'
      ]
    },
    images: {
      project: ['src/images/*', 'src/images/**/*']
    },
    styles: {
      project: ['src/sass/**/*.scss'],
      vendor: []
    },
    files: {
      path: [
        'src/**',
        '!src/{js,js/**}',
        '!src/{sass,sass/**}',
      ]
    }
  },
  dest: {
    styles: {
      path: 'dist/css/',
      project: project+'.css',
      vendor: 'vendor.css'
    },
    images: {
      project: 'dist/images'
    },
    scripts: {
      path: 'dist/js/',
      project: project,
      background: 'background',
      vendor: 'vendor'
    },
    files: {
      path: 'dist'
    }
  }
};


/**
 * Gulp Tasks
 */
gulp.task('default', () => {

  startStaticServer();
  startLivereload();

  // Watch files an apply tasks based on the type
  gulp.watch(paths.src.styles.project, ['project_styles']);

  gulp.watch(paths.src.scripts.project, ['project_scripts']);
  gulp.watch(paths.src.scripts.background, ['background_scripts']);

  gulp.watch(paths.src.files.path, ['move']);

  // Once processed the tasks by file let's reload the server
  gulp.watch(paths.src.styles.project, notifyLivereload);
  gulp.watch(paths.src.scripts.project, notifyLivereload);
  gulp.watch(paths.src.files.path, notifyLivereload);

});



/**
 *  STYLES
 */

gulp.task('project_styles', () => {
  return gulp.src(paths.src.styles.project)
    .pipe(concat(project+'.scss'))
    .pipe(sass().on('error', sass.logError))
    .pipe(rename({suffix: '.min'}))
    .pipe(cssnano())
    .pipe(gulp.dest(paths.dest.styles.path));
});

gulp.task('vendor_styles', () => {
  return gulp.src(paths.src.styles.vendor)
    .pipe(concat(paths.dest.styles.vendor))
    .pipe(gulp.dest(paths.dest.styles.path))
    .pipe(rename({suffix: '.min'}))
    .pipe(cssnano())
    .pipe(gulp.dest(paths.dest.styles.path));
});


/**
 *  SCRIPTS
 */

gulp.task('project_scripts', () => {
  return gulp.src(paths.src.scripts.project)
    .pipe(sourcemaps.init())
    .pipe(babel({ presets: ['es2015'] }))
    .pipe(concat(paths.dest.scripts.project+'.js'))
    .pipe(gulp.dest(paths.dest.scripts.path))
    .pipe(rename(paths.dest.scripts.project+'.min.js'))
    .pipe(uglify().on('error', function(e){ console.log('error!', e) }))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(paths.dest.scripts.path));
});

gulp.task('background_scripts', () => {
  return gulp.src(paths.src.scripts.background)
    .pipe(sourcemaps.init())
    .pipe(concat(paths.dest.scripts.background+'.js'))
    .pipe(gulp.dest(paths.dest.scripts.path))
    .pipe(rename(paths.dest.scripts.background+'.min.js'))
    .pipe(uglify())
    .on('error', function(e){ console.log('error!', e) })
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(paths.dest.scripts.path));
});

gulp.task('vendor_scripts', () => {
  return gulp.src(paths.src.scripts.vendor)
    .pipe(sourcemaps.init())
    .pipe(concat(paths.dest.scripts.vendor+'.js'))
    .pipe(gulp.dest(paths.dest.scripts.path))
    .pipe(rename(paths.dest.scripts.vendor+'.min.js'))
    .pipe(uglify())
    .on('error', function(e){
      console.log('error!', e)
    })
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(paths.dest.scripts.path));
});


/**
 * PHP
 */

gulp.task('clean', () => {
  return gulp.src(['dist/*'], {read:false})
  .pipe(clean());
});

gulp.task('move', () => {
  gulp.src('src/manifest.json')
    .pipe(gulp.dest('dist'));

  return gulp.src(paths.src.files.path)
    .pipe(gulp.dest(paths.dest.files.path));
});


/**
 * Distribution worker
 */
let distTasks = [
  'move',
  'background_scripts',
  'vendor_scripts',
  'vendor_styles',
  'project_scripts',
  'project_styles'
];
gulp.task('dist', distTasks);


/**
 * Starts a static startStaticServer
 * @return {void}
 */
function startStaticServer () {
  var app = express();
  app.use(require('connect-livereload')());
  app.use(express.static(__dirname));
  app.listen(4000);
}

function startLivereload () {
  lr.listen(35729);
}

function notifyLivereload (event) {
  var files = require('path').relative(__dirname, event.path);
  lr.changed({
    'body' : {
      files: [files]
    }
  });
}
