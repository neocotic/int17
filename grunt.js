module.exports = function(grunt) {

  'use strict';

  grunt.initConfig({
      pkg:    grunt.file.readJSON('package.json')
    , docco:  {
        files: ['lib/**/*.js']
      }
    , test:   {
        files: ['test/**/*.js']
      }
    , lint:   {
        files: ['grunt.js', 'lib/**/*.js', 'test/**/*.js']
      }
    , watch:  {
          files: '<config:lint.files>'
        , tasks: 'default'
      }
    , jshint: {
          options:  {
              boss:      true
            , browser:   true
            , camelcase: true
            , curly:     false
            , eqeqeq:    true
            , immed:     true
            , latedef:   true
            , laxcomma:  true
            , maxlen:    100
            , newcap:    true
            , noarg:     true
            , node:      true
            , nonew:     true
            , quotmark:  'single'
            , strict:    true
            , undef:     true
            , unused:    true
          }
        , globals: {
            exports: true
          }
      }
  });

  grunt.loadNpmTasks('grunt-docco');

  grunt.registerTask('default', 'lint test docco');

};
