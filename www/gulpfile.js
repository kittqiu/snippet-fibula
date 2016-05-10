var
    _ = require('lodash'),
    fs = require('fs'),
    less = require('gulp-less'),
    jslint = require('gulp-jslint'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    minifyCSS = require('gulp-minify-css'),
    gulp = require('gulp'),
    babel = require('gulp-babel');

var theme = 'default';

function getJavaScriptFiles(file) {
    var
        re = /^.*\<script\s+src\=\"(.*)\"\>.*$/,
        data = fs.readFileSync(file, { encoding: 'utf-8' }),
        begin = data.indexOf('<!-- BEGIN JAVASCRIPT COMPRESS -->'),
        end = data.indexOf('<!-- END JAVASCRIPT COMPRESS -->'),
        lines;
    if (begin === (-1) || end === (-1) || begin > end) {
        throw 'Error: special comment not found!';
    }
    lines = data.substring(begin, end).split('\n');
    lines = _.map(lines, function (line) {
        var m = re.exec(line);
        if (m) {
            return m[1].replace(/\{\{\s*\_\_theme\_\_\s*\}\}/, theme);
        }
        return null;
    });
    lines = _.filter(lines, function (line) {
        return line !== null;
    });
    return _.map(lines, function (line) {
        return '.' + line;
    });
}

//console.log(getJavaScriptFiles('./view/theme/' + theme + '/_base.html'));

gulp.task('jslint', function () {
    return gulp.src([
        './controllers/*.js',
        './models/*.js',
        './search/*.js',
        './*.js'
    ]).pipe(jslint({
        node: true,
        nomen: true,
        sloppy: true,
        plusplus: true,
        unparam: true,
        stupid: true
    }));
});

gulp.task('uglify', function () {
    var jsfiles = getJavaScriptFiles('./view/_base.html');
    return gulp.src(jsfiles)
        .pipe(concat('all.js'))
        .pipe(uglify())
        .pipe(gulp.dest('./static/js'));
});

gulp.task('less', function () {
    return gulp.src(['./static/css/theme/default.less'])
        .pipe(less())
        .pipe(gulp.dest('./static/css/theme'));
});

gulp.task('babel_project', function() {
    return gulp.src('./view/project/p/component/src/*.jsx')
            .pipe(babel({
                presets: ['es2015','react']
            }))
            .pipe(uglify())
            .pipe(gulp.dest('./view/project/p/component/build'))
    }
);
gulp.task('babel_task', function() {
    return gulp.src('./view/project/task/component/src/*.jsx')
            .pipe(babel({
                presets: ['es2015','react']
            }))
            .pipe(uglify())
            .pipe(gulp.dest('./view/project/task/component/build'))
    }
);
gulp.task('babel_structure', function() {
    return gulp.src('./view/team/structure/component/src/*.jsx')
            .pipe(babel({
                presets: ['es2015','react']
            }))
            .pipe(uglify())
            .pipe(gulp.dest('./view/team/structure/component/build'))
    }
);

gulp.task('babel_manage', function() {
    return gulp.src('./view/manage/component/src/*.jsx')
            .pipe(babel({
                presets: ['es2015','react']
            }))
            .pipe(uglify())
            .pipe(gulp.dest('./view/manage/component/build'))
    }
);

gulp.task('babel_system', function() {
    return gulp.src('./view/system/component/src/*.jsx')
            .pipe(babel({
                presets: ['es2015','react']
            }))
            .pipe(uglify())
            .pipe(gulp.dest('./view/system/component/build'))
    }
);

gulp.task('default', ['less']);
gulp.task('babel', ['babel_project','babel_task', 'babel_structure', 'babel_manage', 'babel_system'])
