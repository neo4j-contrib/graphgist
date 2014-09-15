"use strict"

module.exports = (grunt) ->
    
    # Load grunt tasks automatically
    require("load-grunt-tasks") grunt

    config = 
        app: "app"
        site: "site"

    grunt.initConfig

        config: config
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
                    expand: true
                    dot: true
                    cwd: "<%= config.app %>"
                    dest: "<%= config.site %>"
                    src: [
                        "styles/*" # remove after proper css build is established
                        "*.{ico,png,txt}"
                        ".htaccess"
                        "images/{,*/}*.webp"
                        "*.html"
                        "styles/fonts/{,*/}*.*"
                        "scripts/social.js"
                        "scripts/ga.js"
                        "!vendor"
                        ] 
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

    grunt.registerTask "build", [
        "clean:site"
        "useminPrepare"
        "concurrent:dist"
        # "autoprefixer"
        "concat"
        # "cssmin"
        "uglify"
        "copy:dist"
        "usemin"
        "htmlmin"
    ]