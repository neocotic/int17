module.exports = function(grunt) {

  'use strict';

  grunt.initConfig({
      pkg:      grunt.file.readJSON('package.json')
    , docco:    {
        all: {
            dest: 'docs'
          , src:  ['lib/**/*.js']
        }
      }
    , jshint:   {
          all:      ['Gruntfile.js', 'lib/**/*.js', 'test/**/*.js']
        , options:  {
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
      }
    , nodeunit: {
        all: ['test/**/*.js', '!test/browser/*']
      }
    , qunit:    {
        all: ['test/browser/**/*.html']
      }
    , uglify:   {
          all:     '<%= jshint.all %>'
        , options: {
            banner: '/*! <%= pkg.name %> v<%= pkg.version %> | (c) ' +
            '<%= grunt.template.today("yyyy") %> <%= pkg.author.name %> */'
          }
      }
    , watch:    {
          files: ['<%= jshint.all %>']
        , tasks: ['default']
      }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-docco');

  grunt.registerTask('browser', ['qunit']);
  grunt.registerTask('build',   ['docco',  'uglify']);
  grunt.registerTask('default', ['test',   'build']);
  grunt.registerTask('test',    ['jshint', 'nodeunit']);

};
