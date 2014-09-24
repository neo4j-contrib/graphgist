"use strict"

module.exports = (grunt) ->
    
    # Load grunt tasks automatically
    require("load-grunt-tasks") grunt

    config = 
        app: "app"
        site: "site"

    grunt.initConfig
        config: config
        
        watch:
          livereload:
            options:
              livereload: "<%= connect.options.livereload %>"
            files: ["<%= config.app %>/index.html" 
                    "<%= config.app %>/gists/**"
                    "<%= config.app %>/images/**"
                    "<%= config.app %>/scripts/**"
                    "<%= config.app %>/styles/**"
                  ]

        "gh-pages":
          options:
            base: "site"
            # branch: "foobar" # defaults to "gh-pages", uncomment to test deployment on branch "foobar"
          src: ["**"]
        
        uglify:
            options:
                mangle: false
        
        useminPrepare:
            html:
                src: "<%= config.app %>/index.html"
                options:
                    dest: "<%= config.site %>"
        
        usemin:
            html: ["<%= config.site %>/{,*/,*/*/}*.html"]
        
        copy:
          dist:
            files: [
              {
                expand: true
                dot: true
                cwd: "<%= config.app %>"
                dest: "<%= config.site %>"
                src: [
                    # misc
                    "*.{ico,png,txt}"
                    ".htaccess"
                    "images/{,*/}*.webp"
                    "*.html"
                    "styles/fonts/{,*/}*.*"

                    # this file is used at this location by another file
                    "styles/neod3.css"

                    # manually copy ga and social scripts
                    "scripts/social.js"
                    "scripts/ga.js"
                    # skip bower components!
                    "!vendor"
                    ]
                  },
                  {
                    expand: true
                    dot: true
                    cwd: "<%= config.app %>/vendor/font-awesome/font"
                    dest: "<%= config.site %>/font"
                    src: ["**"]
                  },
                  { 
                    expand: true
                    dot: true
                    cwd: "<%= config.app %>/vendor/bootstrap/docs/assets/img"
                    dest: "<%= config.site %>/img"
                    src: ["glyphicons-halflings*"]
                  }
                ]
        
        imagemin:
          dist:
            files: [
              expand: true
              cwd: "<%= config.app %>/images"
              src: "{,*/}*.{gif,jpeg,jpg,png}"
              dest: "<%= config.site %>/images"
            ]
        
        svgmin:
          dist:
            files: [
              expand: true
              cwd: "<%= config.app %>/images"
              src: "{,*/}*.svg"
              dest: "<%= config.site %>/images"
            ]
        
        htmlmin:
          dist:
            options:
              collapseBooleanAttributes: true
              collapseWhitespace: true
              removeAttributeQuotes: true
              removeCommentsFromCDATA: true
              removeEmptyAttributes: true
              removeOptionalTags: true
              removeRedundantAttributes: true
              useShortDoctype: true
            files: [
              expand: true
              cwd: "<%= config.site %>"
              src: "*.html"
              dest: "<%= config.site %>"
            ]
        
        clean:
            site:
                files: [
                  dot: true
                  src: [".tmp", "<%= config.site %>/*", "!<%= config.site %>/.git*"]
                ]
            server: ".tmp"
        
        concurrent:
            dist: [
                "imagemin"
                "svgmin"
            ]
    
        connect:
          options:
            port: 9000
            hostname: "localhost"
            livereload: 35729

          livereload:
            options:
              open: true
              base: [ "<%= config.app %>"]

          dist:
            options:
              open: true
              base: "<%= config.site %>"

    grunt.registerTask "build", [
        "clean:site"
        "useminPrepare"
        "concurrent:dist"
        # "autoprefixer"
        "concat"
        "cssmin"
        "uglify"
        "copy:dist"
        "usemin"
        "htmlmin"
    ]
    seriousFlag = grunt.option('seriously')
    grunt.registerTask "release", ->
      if seriousFlag
        [
          "build"
          "gh-pages"
        ]
      else
        grunt.log.error("""
                        This task will deploy to gh-pages!
                        Add the 'seriously' flag if you are
                        seriously, serious.
                        `grunt release --seriously`
                        """)
        []
    
    grunt.registerTask "serve", (target) ->
      if target is "dist"
        return grunt.task.run([
          "build"
          "connect:dist:keepalive"
        ])
      grunt.task.run [
        "clean:server"
        "connect:livereload"
        "watch"
      ]
