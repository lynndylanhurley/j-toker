'use strict';
module.exports = function (grunt) {
  // Load all grunt tasks
  require('load-grunt-tasks')(grunt);
  // Show elapsed time at the end
  require('time-grunt')(grunt);

  var DEPLOY_TAG = '' + new Date().getTime();

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

    shell: {
      deploy: {
        command: [
          "heroku config:set NODE_ENV=production NPM_CONFIG_PRODUCTION=false --app j-toker-demo",
          "git checkout -b "+DEPLOY_TAG,
          "rm config/default.yml",
          "cp config/production.yml config/default.yml",
          'cp -R demo/dist demo/dist-production',
          'git add -u .',
          'git add .',
          "git commit -am 'commit for "+DEPLOY_TAG+" push'",
          "git push -f production "+DEPLOY_TAG+":master",
          'git checkout master',
          "git branch -D "+DEPLOY_TAG,
          "rm -rf demo/dist-production"
        ].join('&&'),
        execOptions: {
          env: {
            'NODE_ENV': 'production'
          }
        }
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
        expand: false,
        src: 'demo/src/index.html',
        dest: 'demo/dist/index.html'
      },
      reactLogo: {
        expand: false,
        src: 'demo/src/images/react-logo.svg',
        dest: 'demo/dist/images/react-logo.svg'
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

    sass: {
      dist: {
        files: [{
          expand: true,
          cwd: 'demo/src/styles',
          src: ['*.scss'],
          dest: 'demo/dist/styles',
          ext: '.css'
        }],

        options: {
          compass: true,
          includePaths: [
            'node_modules/bootstrap-sass/assets/stylesheets',
            'node_modules/highlight.js/styles'
          ]
        }
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
        tasks: ['copy']
      },
      sass: {
        files: 'demo/src/styles/**/*.scss',
        tasks: ['sass']
      },
      express: {
        files: ['demo/app.js'],
        tasks: ['express:dev']
      }
    },

    connect: {
      server: {
        options: {
          hostname: '*',
          port: 7777
        }
      }
    },

    express: {
      options: {
        port: 7777,
        script: 'demo/app.js'
      },
      dev: {},
      production: {}
    }
  });

  // Default task.
  grunt.registerTask('default', ['jshint', 'connect', 'qunit', 'clean', 'concat', 'uglify']);
  grunt.registerTask('test', ['jshint', 'connect', 'qunit']);
  grunt.registerTask('build', ['clean', 'sass:dist', 'copy', 'browserify:app', 'concat', 'uglify']);
  grunt.registerTask('serve', ['build', 'express:dev', 'watch']);
  grunt.registerTask('deploy', ['build', 'shell:deploy']);
};
