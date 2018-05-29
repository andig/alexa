/* esversion: 6 */

var gulp = require("gulp");
var zip = require("gulp-zip");
var AWS = require('aws-sdk');
const { execSync } = require('child_process');

AWS.config.region = "eu-central-1";

const
  lambdafunction = "volkszaehler-briefing",
  s3file = "volkszaehler-briefing.zip",
  s3bucket = "volkszaehler-briefing",
  builddir = "dist/",
  buildfile = builddir + s3file;

gulp.task('default', ['test', 'build', 'deploy', 'validate']);

gulp.task('test', function() {
  execSync("node src/index.js");
});

gulp.task('build', function() {
  return gulp.src(['src/**', '!dist/package.json'])
    .pipe(zip(s3file))
    .pipe(gulp.dest(builddir));
});

// gulp.task('deploy', function() {
//   execSync("aws s3 cp " + buildfile + " s3://" + s3bucket);
//   execSync("aws lambda update-function-code --function-name " + lambdafunction + " --s3-bucket " + s3bucket + " --s3-key " + s3file);
// });

gulp.task('deploy', ['upload-to-s3', 'update-lambda']);

gulp.task('upload-to-s3', function () {
  // execSync("aws s3 cp " + buildfile + " s3://" + s3bucket);

  var s3 = new AWS.S3();
  var fs = require('fs');

  fs.readFile(buildfile, function(err, data) {
    if (err)
      console.log(err);
    else {
      var params = {
        Bucket: s3bucket,
        Key: s3file,
        Body: data
      };

      s3.putObject(params, function(err, data) {
        if (err) console.log('Object upload unsuccessful!');
      });
    }
  });
});

gulp.task('update-lambda', function () {
  // execSync("aws lambda update-function-code --function-name " + lambdafunction + " --s3-bucket " + s3bucket + " --s3-key " + s3file);

  var lambda = new AWS.Lambda();
  var params = {
    FunctionName: lambdafunction,
    S3Bucket: s3bucket,
    S3Key: s3file
  };

  lambda.updateFunctionCode(params, function(err, data) {
    if (err) console.error(err);
  });
});

gulp.task('validate', function() {
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
        if (err) 
          console.log(err, err.stack);
        else {
          var json = JSON.parse(data.Payload);
          json = JSON.parse(json.body);
          console.log(json.mainText);
        }
      });
    }
  });
});
