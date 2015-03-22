'use strict';
module.exports = function (grunt) {
  // Load all grunt tasks
  require('load-grunt-tasks')(grunt);
  // Show elapsed time at the end
  require('time-grunt')(grunt);

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed WTFPL */\n',
    // Task configuration.
    clean: {
      files: ['dist', 'demo/dist']
    },

    concat: {
      options: {
        banner: '<%= banner %>',
        stripBanners: true
      },
      dist: {
        src: ['src/<%= pkg.name %>.js'],
        dest: 'dist/jquery.<%= pkg.name %>.js'
      }
    },

    uglify: {
      options: {
        banner: '<%= banner %>'
      },
      dist: {
        src: '<%= concat.dist.dest %>',
        dest: 'dist/jquery.<%= pkg.name %>.min.js'
      }
    },

    qunit: {
      all: {
        options: {
          urls: ['http://localhost:7777/test/<%= pkg.name %>.html']
        }
      }
    },

    browserify: {
      options: {
        debug: true,
        transform: ['reactify'],
        extensions: ['.jsx']
      },
      app: {
        src: [
          'src/j-toker.js',
          'demo/src/scripts/**/*.jsx'
        ],
        dest: 'demo/dist/scripts/main.js',
        options: {
          watch: true
        }
      }
    },

    copy: {
      demo: {
        expand: true,
        src: '**/*.{html,css}',
        dest: 'demo/dist/',
        cwd: 'demo/src/'
      }
    },

    jshint: {
      options: {
        reporter: require('jshint-stylish')
      },
      gruntfile: {
        options: {
          jshintrc: '.jshintrc'
        },
        src: 'Gruntfile.js'
      },
      src: {
        options: {
          jshintrc: 'src/.jshintrc'
        },
        src: ['src/**/*.js']
      },
      test: {
        options: {
          jshintrc: 'test/.jshintrc'
        },
        src: ['test/**/*.js']
      }
    },

    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      src: {
        files: '<%= jshint.src.src %>',
        tasks: ['jshint:src', 'qunit']
      },
      test: {
        files: '<%= jshint.test.src %>',
        tasks: ['jshint:test', 'qunit']
      },
      copyDemo: {
        files: '<%= copy.demo.src %>',
        tasks: ['copy:demo']
      }
    },

    connect: {
      server: {
        options: {
          hostname: '*',
          port: 7777
        }
      }
    }
  });

  // Default task.
  grunt.registerTask('default', ['jshint', 'connect', 'qunit', 'clean', 'concat', 'uglify']);
  grunt.registerTask('server', function () {
    grunt.log.warn('The `server` task has been deprecated. Use `grunt serve` to start a server.');
    grunt.task.run(['serve']);
  });
  grunt.registerTask('serve', ['clean', 'connect', 'copy:demo', 'browserify:app', 'watch']);
  grunt.registerTask('test', ['jshint', 'connect', 'qunit']);
};
