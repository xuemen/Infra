var fs = require('fs');
var yaml = require('js-yaml');
var http = require('http');
var https = require('https');
var async = require('async');
var openpgp = require('openpgp');
var events = require('events');

var emitter = new events.EventEmitter();
var config = yaml.safeLoad(fs.readFileSync('config.yaml', 'utf8'));
exports.emitter = emitter ;
exports.config = config ;

exports.getCODlist = getCODlist ;
exports.getCODObj = getCODObj ;

exports.createNor = createNor ;
exports.updatebalance = updatebalance ;
exports.transfer = transfer ;

exports.postsync = postsync ;
exports.putsync = putsync ;


function getCODlist(){
	
}

function getCODObj(){
	
}

// Joint Token
var balance ;
var secuserinfo ;
var pubuserinfo ;
var secfile ;
var pubfile ;

postsync();

function createNor(name,id,email,passphrase,callback){
	var UserId = name + " (" + id + ") <" + email + ">" ;
	
	var publicKey,privateKey;
	var opt = {numBits: 2048, userId: UserId, passphrase: passphrase};

	console.log("正在创建密钥对，需要几十秒时间，请稍候。。。");

	openpgp.generateKeyPair(opt).then(function(key) {
		
		var data = new Object();
		
		data.id = key.key.primaryKey.fingerprint;
		data.keytype = 2;
		data.pubkey = key.publicKeyArmored;
		data.createtime =  new Date().getTime();//Date.parse(key.key.primaryKey.created);
		data.remark = "Normal Account";
		
		//doc = yaml.safeDump(data);
		var authorseckey = openpgp.key.readArmored(key.privateKeyArmored).keys[0];
		
		var item = new Object();
		
		//item.cod = "";
		item.tag = "nor";
		item.author = id;
		item.data = data;
		item.sigtype = 0;
		
		sent(item,'POST',function (retstr){
			fs.writeFileSync(retstr+".pub",key.publicKeyArmored);
			fs.writeFileSync(retstr+".sec",key.privateKeyArmored);
			
			callback(retstr);
		});
	});
}

function listkey(b) {
	balance = b;
	secuserinfo = new Object();
	pubuserinfo = new Object();
	
	var files = fs.readdirSync(".");
	// list the private key
	files.forEach(function(item) {
		if (item.substr(item.length-4,4) === '.sec'){
			var seckey = openpgp.key.readArmored(fs.readFileSync(item,'utf8')).keys[0];
			secuserinfo[seckey.primaryKey.fingerprint] = seckey.users[0].userId.userid;
			secfile[seckey.primaryKey.fingerprint] = item;
		}
	});
	
	files = fs.readdirSync("post/");
	// list the public key
	files.forEach(function(item) {
		if(item.substr(0,4) == "nor."){
			var nor = yaml.safeLoad(fs.readFileSync("post/"+item,'utf8'));
			var pubkey = openpgp.key.readArmored(nor.data.pubkey).keys[0];
			pubuserinfo[pubkey.primaryKey.fingerprint] = pubkey.users[0].userId.userid;
			pubfile[pubkey.primaryKey.fingerprint] = "post/"+item;
	}else if((item.substr(item.indexOf(".")+1,5) == "auto.") || (item.substr(0,5) == "auto.")){
			var auto = yaml.safeLoad(fs.readFileSync("post/"+item,'utf8'));
			pubuserinfo[auto.data.id] = auto.cod;
			pubfile[auto.data.id] = "post/"+item;
		}
	});
	
	console.log("可选的付款人:")
	for (var key in secuserinfo) {
		console.log("账号：\t"+key+"\n户主：\t"+secuserinfo[key]+"\n余额：\t"+b[key]+"\n");
	}
	
	console.log("可选的收款人:")
	for (var key in pubuserinfo) {
		console.log("账号：\t"+key+"\n户主：\t"+pubuserinfo[key]+"\n余额：\t"+b[key]+"\n");
	}
	
	askandtransfer();
}

// update balance
emitter.on("postupdate",updatebalance)

function updatebalance(callback) {
	balance = new Object();
	secuserinfo = new Object();
	pubuserinfo = new Object();
	secfile = new Object();
	pubfile = new Object();

	var files = fs.readdirSync(".");
	// list the private key
	files.forEach(function(item) {
		if (item.substr(item.length-4,4) === '.sec'){
			var seckey = openpgp.key.readArmored(fs.readFileSync(item,'utf8')).keys[0];
			secuserinfo[seckey.primaryKey.fingerprint] = seckey.users[0].userId.userid;
			secfile[seckey.primaryKey.fingerprint] = item;
		}
	});

	files = fs.readdirSync("post/");

	files.forEach(function(item) {
		if(item.substr(0,4) == "nor."){
			var nor = yaml.safeLoad(fs.readFileSync("post/"+item,'utf8'));
			var pubkey = openpgp.key.readArmored(nor.data.pubkey).keys[0];
			pubuserinfo[pubkey.primaryKey.fingerprint] = pubkey.users[0].userId.userid;
			pubfile[pubkey.primaryKey.fingerprint] = "post/"+item;
			existORcreate(balance,pubkey.primaryKey.fingerprint);
		}else if((item.substr(item.indexOf(".")+1,5) == "auto.") || (item.substr(0,5) == "auto.")){
			var auto = yaml.safeLoad(fs.readFileSync("post/"+item,'utf8'));
			pubuserinfo[auto.data.id] = auto.cod;
			pubfile[auto.data.id] = "post/"+item;
			existORcreate(balance,auto.data.id);
		}
		if (item.substr(0,9) == "transfer."){
			var obj = yaml.safeLoad(fs.readFileSync("post/"+item, 'utf8'));
			var log = yaml.safeLoad(obj.log);
			var data = yaml.safeLoad(log.data);
			
			var input = data.input;
			var output = data.output;
			
			var id = input.id;
			var amount = input.amount;
			existORcreate(balance,id);
			balance[id] = balance[id] - amount;
			
			id = output.id;
			amount = output.amount;
			existORcreate(id);
			balance[id] = balance[id] + amount;
		}
	});
	exports.secfile = secfile;
	exports.pubfile = pubfile;
	exports.secuserinfo = secuserinfo;
	exports.pubuserinfo = pubuserinfo;
	exports.balance = balance;
	//console.log("new balance: \n",balance);
	if (typeof(callback) != "undefined") {
		callback(balance);
	}
}

function transfer(payerid,payeeid,amount,passphrase){
	if(amount > balance[payerid]){
		console.log("overdraw");
		return;
	}
	
	var payersecfile = secfile[payerid];
	//var payerpubfile = payerid + ".pub";
	var payerseckey = openpgp.key.readArmored(fs.readFileSync(payersecfile,'utf8')).keys[0];
	//var payerpubkey = openpgp.key.readArmored(fs.readFileSync(payerpubfile,'utf8')).keys[0];
	
	var payeepubfile = pubfile[payeeid];
	var nor = yaml.safeLoad(fs.readFileSync(payeepubfile,'utf8'));
	var payeepubkey = openpgp.key.readArmored(nor.data.pubkey).keys[0];
	
	var data = new Object();
	var input = new Object();
	var output = new Object();
	data.jtid = '1c636fec7bdfdcd6bb0a3fe049e160d354fe9806';	// just for debug
	input.id = payerseckey.primaryKey.fingerprint;
	input.amount = amount;
	data.input = input;
	output.id = payeepubkey.primaryKey.fingerprint;
	output.amount = amount;
	data.output = output;
	data.total = amount;
	data.time =  new Date().getTime();//new Date().toLocaleString();
	data.remark = "transfer sample";
	console.log(data);
	
	var datastr = yaml.safeDump(data);
	var item = new Object();
	item.type = 3;
	item.data = datastr;
	item.hashtype = 1;
	item.hash = new Hashes.SHA512().b64(datastr);
	
	if(payerseckey.decrypt(passphrase)){
		openpgp.signClearMessage(payerseckey,datastr).then(function(pgpMessage){
			// success
			console.log(pgpMessage);
			item.sigtype = 2;
			item.sig = pgpMessage;
			doc = yaml.safeDump(item);
			
			var authorseckey = payerseckey;
			var postbody = new Object();
			
			postbody.tag = "transfer";
			postbody.author = payerid;
			postbody.log = doc;
			openpgp.signClearMessage(authorseckey,doc).then(function(pgpMessage){
				// success
				
				postbody.sig = pgpMessage;
				postbody = yaml.safeDump(postbody);
				
				console.log(postbody);
				console.log(postbody.length);
				//fs.writeFileSync("postbody.yaml",postbody)
				
				var options = {
				  hostname: config.server.url,
				  port: config.server.port,
				  method: 'POST',
				  headers: {
					'Content-Type': 'application/x-yaml'
				  }
				};
				
				console.log("sending transfer to server...")
				var req = http.request(options, function(res) {
				  console.log('STATUS: ' + res.statusCode);
				  console.log('HEADERS: ' + JSON.stringify(res.headers));
				  res.setEncoding('utf8');
				  res.on('data', function (chunk) {
					console.log('BODY: ' + chunk);
				  });
				});

				req.write(postbody);
				req.end();
				
			}).catch(function(error) {
				// failure
				console.log("签名失败！"+error);
			});		
		}).catch(function(error) {
			// failure
			console.log("签名失败！"+error);
		});		
	}
}


// distribute storage
var localPostIdx = yaml.safeLoad(fs.readFileSync('post/index.yaml', 'utf8'));
var localPutIdx = yaml.safeLoad(fs.readFileSync('put/index.yaml', 'utf8'));
var globalPostIdx ,globalPutIdx;
var postfileArray = new Array() ;
var putfileArray = new Array() ;

function sent(item,method,callback){
	var itemyaml = yaml.safeDump(item);
	var options = {
	  hostname: config.server.url,
	  port: config.server.port,
	  method: 'POST',
	  headers: {
		'Content-Type': 'application/x-yaml'
	  }
	};
	
	console.log("sending account to server...\n");

	var req = http.request(options, function(res) {
	  console.log('STATUS: ' + res.statusCode);
	  console.log('HEADERS: ' + JSON.stringify(res.headers));
	  res.setEncoding('utf8');

	  res.on('data', function (chunk) {
		console.log('BODY: ' + chunk);
		callback(chunk);
	  });
	});
	
	req.write(itemyaml);
	req.end();
}

function putsync(finish) {
	if (typeof(finish) != "undefined") {
		finish();
	}
}

function postsync(finish) {
	var addr = "http://"+config.server.url+":"+config.server.port+'/post/index.yaml';
	var req = http.get(addr, function(res) {
		res.setEncoding('utf8');
		res.on('data', function (chunk) {
			globalPostIdx = yaml.safeLoad(chunk);
			for (var key in globalPostIdx) {
				//console.log("key:\t"+key);
				if (key == "update") continue;
				if (!localPostIdx.hasOwnProperty(key)) {
					localPostIdx[key] = 0;
				}
				//console.log(localPostIdx[key]);
				//console.log(globalPostIdx[key]);
				if (localPostIdx[key] < globalPostIdx[key]){
					for (var id = localPostIdx[key]+1;id <= globalPostIdx[key];id++) {
						//console.log("key:\t"+key+"\tid:\t"+id);
						
						postfileArray.push(key+"."+id.toString()+".yaml") ;
					}
					localPostIdx[key] = globalPostIdx[key];
				}
			}
			
			//console.log(postfileArray);
			
			var createtime = new Object();
			
			async.each(postfileArray, function (item, callback) {
				var fileaddr = "http://"+config.server.url+":"+config.server.port+'/post/'+item;
				var filename = "post/"+item;
				var req = http.get(fileaddr, function(res) {
					res.setEncoding('utf8');
					res.on('data', function (chunk) {
						fs.writeFileSync(filename,chunk);
						console.log("post: "+filename+" saved.");
						
						// parse the yaml and get the createat field
						// write into a object: [createat]filename
						var itemdata = yaml.safeLoad(chunk);
						createtime[itemdata.createat] = item ;
						
						callback();
					});
				}).on('error', function(e) {
					console.log('problem with request: ' + e.message);
				});
			}, function (err) {
				if( err ) {
					console.log('post:A file failed to save');
				} else {
					// sort the object and emit event one by one
					var sortedcreatetime = sortObject(createtime);
					for (var time in sortedcreatetime) {
						var item = sortedcreatetime[time];
						emitter.emit("postfile",item);
					}
					localPostIdx.update = new Date().toLocaleString();
					fs.writeFileSync("post/index.yaml",yaml.safeDump(localPostIdx));
					
					if (Object.keys(createtime).length > 0) {
						console.log("event postupdate, callback: ",finish);
						emitter.emit("postupdate",finish);
					}else if (typeof(finish) != "undefined") {
						finish("non post file update");
					}
				}
			});
		});
	}).on('error', function(e) {
	  console.log('problem with request: ' + e.message);
	});
}



// distribute event driver
emitter.on("postfile",function(item){
	console.log("event postfile, item: ",item);
	if((item.substr(item.indexOf(".")+1,5) == "auto.") || (item.substr(0,5) == "auto.")){
		var auto = yaml.safeLoad(fs.readFileSync("post/"+item, 'utf8'));
		var autofilename = item.substr(0,item.lastIndexOf(".")) + ".js" ;
		
		console.log("new auto account: download "+auto.data.codeurl+" and saved as "+autofilename);
		var autoget = https.get(auto.data.codeurl,function(res) {
			res.setEncoding('utf8');
			res.on('data', function (chunk) {
				fs.writeFileSync(autofilename,chunk);
				
				var a = require("./"+autofilename);
				for (var event in auto.data.listener){
					var lf = auto.data.listener[event] ;
					//console.log("a."+lf);
					emitter.on(event,eval("a."+lf));
					console.log(emitter);
				}
			});
		});
	}
})



//utility

function sortObject(o) {
    var sorted = {},
    key, a = [];

    for (key in o) {
        if (o.hasOwnProperty(key)) {
            a.push(key);
        }
    }

    a.sort();

    for (key = 0; key < a.length; key++) {
        sorted[a[key]] = o[a[key]];
    }
    return sorted;
}


function existORcreate(obj,id) {
	//console.log(id);
	if (!obj.hasOwnProperty(id)) {
		obj[id] = 0;
	}
}