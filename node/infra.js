
var fs = require('fs');
var yaml = require('js-yaml');


var log,cfg ;
init();
writedata("/huangyg/itw/key/","test","cfg");



// cod

// jt

// dtt



// event
var evetnqueue;

function eventloop(){
	
}

// storage

// type:
// 	log: write\read
// 	cfg: write\read\modify\delete

function writedata(k,v,type){
	switch(type){
		case "log":
			if (log[k] === undefined){
				log[k] = v;
				log.update = new Date().toLocaleString();
				fs.writeFileSync("log.yaml",yaml.safeDump(log));
				console.log("log file wrote:\n",yaml.safeDump(log));
			} else {
				console.log(k,"existed in log file.\n");
			}
			break;			
		case "cfg":
			cfg[k] = v;
			cfg.update = new Date().toLocaleString();
			fs.writeFileSync("cfg.yaml",yaml.safeDump(cfg));
			console.log("cfg file wrote:\n",yaml.safeDump(cfg));
			break;
	}
}

function readdata(k,type) {
	switch(type){
		case "log":
			return log[k];
		case "cfg":
			return cfg[k];
	}
}

function deletedata(k){
	delete cfg[k];
	fs.writeFileSync("cfg.yaml",yaml.safeDump(cfg));
	console.log("cfg file wrote:\n",yaml.safeDump(cfg));
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
	
	if (fs.existsSync("cfg.yaml")) {
		cfg = yaml.safeLoad(fs.readFileSync('cfg.yaml', 'utf8'));
		// check the old version files, and transfer to new version
		for (var key in cfg) {
			//console.log("key:\t"+key);
			if (key === "updateLocal") continue;
			if (key === "update") continue;
			
			}
	}else {
		cfg = new Object();
		cfg.update = new Date().toLocaleString();
		console.log("cfg:\t"+cfg);
		
		fs.writeFileSync("cfg.yaml",yaml.safeDump(cfg));
	};
}


// sync 
function sync(){
	
}
