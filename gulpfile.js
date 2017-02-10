var gulp = require("gulp");

const
	buildfile = "volkszaehler.zip",
	bucket = "volkszaehler";

gulp.task('default', ['build', 'deploy']);

gulp.task('build', function() {
	var fs = require("fs"),
		archiver = require("archiver");

	var fileOutput = fs.createWriteStream(buildfile);

	fileOutput.on('close', function () {
	    console.log(archive.pointer() + ' total bytes');
	});

	var archive = archiver('zip');

	archive.pipe(fileOutput);
	archive.directory('src', '');

	archive.on('error', function(err) {
	    throw err;
	});

	archive.finalize();
});

gulp.task('deploy', function() {
	var spawn = require('child_process').spawnSync;

	function exec(cmd) {
		console.log(cmd);

		var para = cmd.split(" "),
			res = spawn(para.shift(), para);

		if (res.stderr.toString()) 
			console.error(res.stderr.toString());
		// console.log(res.stdout.toString());
	}

	exec("aws s3 cp " + buildfile + " s3://" + bucket);
	exec("aws lambda update-function-code --function-name volkszaehler --s3-bucket " + bucket + " --s3-key " + buildfile);
});
