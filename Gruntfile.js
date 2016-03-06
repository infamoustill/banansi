module.exports = function(grunt) {
    var generateBakeFiles = function (platform) {
        var result = {};

        grunt.file.expand({ filter: 'isFile'}, ['src/*.html']).forEach(function(path) {
            var
              regexp = /__!([^.]*)/,
              fileName = path.replace('src/', '');

            if (!fileName.match(regexp) || fileName.match(regexp)[1] == platform) {
                result['dist/<%= platform %>/' + fileName.replace('__!' + platform, '')] = path;
            }
        });

        return result;
    };

    grunt.initConfig({
        copy: {
            main: {
                files: [
                    // includes files within path
                    {expand: false, src: ['src/css/<%= platform %>.css'], dest: 'dist/<%= platform %>/css/styles.css', filter: 'isFile'},
                    {expand: false, src: ['src/css/<%= platform %>.css.map'], dest: 'dist/<%= platform %>/css/styles.css.map', filter: 'isFile'},
                    {expand: true, cwd: 'src/images/', src: ['<%= platform %>/**/*'], dest: 'dist/<%= platform %>/images/'},
                    {expand: true, cwd: 'src/images/', src: ['common/**/*'], dest: 'dist/<%= platform %>/images/'},
                    {expand: true, cwd: 'src/fonts/', src: ['<%= platform %>/*'], dest: 'dist/<%= platform %>/fonts/', filter: 'isFile'},
                    {expand: true, cwd: 'src/fonts/', src: ['common/*'], dest: 'dist/<%= platform %>/fonts/', filter: 'isFile'},
                  //scripts
                    {expand: true, cwd: 'src/js/libs/jquery/dist/', src: ['jquery.min.js'], dest: 'dist/<%= platform %>/js/libs/', filter: 'isFile'},
                    {expand: true, cwd: 'src/js/libs/swiper/dist/js', src: ['swiper.min.js'], dest: 'dist/<%= platform %>/js/libs/', filter: 'isFile'},
                    {expand: true, cwd: 'src/js/libs/jquery.inputmask/dist/inputmask', src: ['jquery.inputmask.min.js'], dest: 'dist/<%= platform %>/js/libs/', filter: 'isFile'},
                    {expand: true, cwd: 'src/js/libs/jquery.bem/', src: ['jquery.bem.js'], dest: 'dist/<%= platform %>/js/libs/', filter: 'isFile'},
                    {expand: true, cwd: 'src/js', src: ['main.js'], dest: 'dist/<%= platform %>/js/', filter: 'isFile'},
                ],
            },
        },
        htmlbuild: {
            dist: {
                src: 'dist/<%= platform %>/*.html',
                dest: 'dist/<%= platform %>/',
                options: {
                    styles: {
                        bundle: [
                            'dist/<%= platform %>/css/styles.css'
                        ]
                    },
                    scripts: {
                        bundle: [
                            'dist/<%= platform %>/js/libs/jquery.min.js',
                            'dist/<%= platform %>/js/libs/*.js',
                            'dist/<%= platform %>/js/libs/!jquery.min.js',
                            'dist/<%= platform %>/js/main.js',
                        ]
                    }
                }
            }
        }
    });
    grunt.loadNpmTasks('grunt-html-build');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-bake');

    grunt.registerTask('build-ios', '', function () {
        var bake = {
            dist: {
                files: generateBakeFiles('ios')
            }
        };

        grunt.task.run('copy');
        grunt.config.set('platform', 'ios');
        grunt.config.set('bake', bake);
        grunt.task.run('bake');
        grunt.task.run('htmlbuild');
    });
    grunt.registerTask('build-android', '', function () {
        var bake = {
            dist: {
                files: generateBakeFiles('android')
            }
        };

        grunt.task.run('copy');
        grunt.config.set('platform', 'android');
        grunt.config.set('bake', bake);
        grunt.task.run('bake');
        grunt.task.run('htmlbuild');
    });

    grunt.registerTask('default', ['build-ios', 'build-android']);
};