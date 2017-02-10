var fs = require("fs");
var archiver = require("archiver");

var fileName = 'alexa.zip';
var fileOutput = fs.createWriteStream(fileName);

fileOutput.on('close', function () {
    console.log(archive.pointer() + ' total bytes');
});

var archive = archiver('zip');

archive.pipe(fileOutput);
// archive.glob("src/**/*");
archive.directory('src', '');

archive.on('error', function(err) {
    throw err;
});

archive.finalize();
