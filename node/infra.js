
var fs = require('fs');
var yaml = require('js-yaml');


var log,cfg ;
init();
writedata("/huangyg/itw/admin/","test","log")
// cod

// jt

// dtt



// event
function doevent(){
	
}

// storage

// type:
// 	log: write\read
// 	cfg: write\read\modify\delete

function writedata(k,v,type){
	switch(type){
		case "log":
			log[k] = v;
			fs.writeFile("log.yaml",yaml.safeDump(log),function(err){
					console.log("log file wrote.\n");
				});
			break;
	}
	
}

function readdata(k) {
	
}

function deletedata(k){
	
}


function init(){
	if (fs.existsSync("log.yaml")) {
		log = yaml.safeLoad(fs.readFileSync('log.yaml', 'utf8'));
		// check the old version files, and transfer to new version
		for (var key in log) {
			//console.log("key:\t"+key);
			if (key === "updateLocal") continue;
			if (key === "update") continue;
			
			}
	}else {
		log = new Object();
		log.update = new Date().toLocaleString();
		console.log("log:\t"+log);
		
		fs.writeFileSync("log.yaml",yaml.safeDump(log));
	};
}

