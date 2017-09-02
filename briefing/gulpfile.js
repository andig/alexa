/* esversion: 6 */

var gulp = require("gulp");
var zip = require("gulp-zip");
var AWS = require('aws-sdk');

const
  lambdafunction = "volkszaehler-briefing",
  s3file = "volkszaehler-flash.zip",
  s3bucket = "volkszaehler-briefing",
  builddir = "dist/",
  buildfile = builddir + s3file;

gulp.task('default', ['build', 'deploy', 'test']);

gulp.task('build', function() {
  return gulp.src(['src/**', '!dist/package.json'])
    .pipe(zip(s3file))
    .pipe(gulp.dest(builddir));
});

gulp.task('deploy', function() {
  const { execSync } = require('child_process');

  execSync("aws s3 cp " + buildfile + " s3://" + s3bucket);
  execSync("aws lambda update-function-code --function-name " + lambdafunction + " --s3-bucket " + s3bucket + " --s3-key " + s3file);
});

gulp.task('test', function() {
  var lambda = new AWS.Lambda();

  var params = {
    FunctionName: lambdafunction,
    InvocationType: 'RequestResponse',
    // LogType: 'Tail',
    // Payload: '{ "key1" : "name" }'
  };

  lambda.getFunction({ FunctionName: lambdafunction }, function(err, data) {
    if (err) 
      console.log("Function" + lambdafunction +  "not found", err);
    else {
      lambda.invoke(params, function(err, data) {
        if (err) console.log(err, err.stack);
        else console.log(data);
      });
    }
  });
});
