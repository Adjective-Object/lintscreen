'use strict';

module.exports = function (grunt) {

  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);

  // Time how long tasks take. Can help when optimizing build times
  require('time-grunt')(grunt);

  grunt.loadNpmTasks('grunt-continue');

  // Files which should be linted
  var javaScripts = [
    'Gruntfile.js',
    'app.js',
    'client.js',
    'server.js',
    'start-server.js',
    '{actions,components,configs,constants,services,stores}/**/*.js'
  ];

  grunt.initConfig({
    eslint: {
      stylish: {
        src: javaScripts,
        options: {
          format: require('eslint-stylish-config')
        }
      },
      fix: {
        src: javaScripts,
        options: {
          format: './utils/eslintQuickfixFormatter'
        }
      }
    }
  });

  grunt.registerTask('default', [
    'clean',
    'copy:main',
    'sass:dev',
    'concat:dev',
    'autoprefixer',
    'concurrent:dev'
  ]);

  grunt.registerTask('test', [
    // TODO: run tests
  ]);

  grunt.registerTask('lint', [
    // just because it's faster than typing eslint
    'eslint:stylish'
  ]);


  grunt.registerTask('fixlint', [
    // a quick fix for trailing spaces, EOF newlines, and semicolons in broken
    // files
    'continue:on',
    'eslint:fix',
    'continue:off'
  ]);
};
