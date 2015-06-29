var os = require('os');
var child  =  require('child_process');
var fs = require('fs');
var events = require('events');
var emitter = new events.EventEmitter();


exports.t1 = t1;
function t1(stream){
	console.log(getHASH());
	openbrowser("http://www.xuemen.com");
}

exports.t2 = t2;

function t2(stream){
	openbrowser("http://www.baidu.com");
}

function openbrowser(url) {
	switch (os.platform()) {
	case "linux":
		child.exec("xdg-open "+ url);
		break;
	case "win32":
	case "win64":
		//child.spawnSync("rundll32", "url.dll,FileProtocolHandler", url);
		//child.exec("start", url);
		child.exec("start "+url);
		break;
	case "darwin":
		child.exec("open "+ url);
		break;
	default:
		console.log("unsupported platform");
		break;
	};
}

function getHASH(){
	var filename = process.argv[1];
	var data = fs.readFileSync(filename);
	var datahash = new Hashes.SHA512().b64(data.toString())
	
	return datahash;
}