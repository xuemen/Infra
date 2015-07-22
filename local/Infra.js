var fs = require('fs');
var events = require('events');
var http = require('http');
var https = require('https');
var path = require("path");

var yaml = require('js-yaml');
var async = require('async');
var openpgp = require('openpgp');
var Hashes = require('jshashes');


var emitter = new events.EventEmitter();
var config = yaml.safeLoad(fs.readFileSync('config.yaml', 'utf8'));
exports.emitter = emitter ;
exports.config = config ;

exports.getCODlist = getCODlist ;
exports.getCODObj = getCODObj ;
exports.createCOD = createCOD ;

exports.createNor = createNor ;
exports.createAuto = createAuto ;
exports.updatebalance = updatebalance ;
exports.transfer = transfer ;
exports.CODtransfer = CODtransfer ;
exports.Issue = Issue ;

exports.postsync = postsync ;
exports.putsync = putsync ;
exports.sent = sent ;


exports.eventinit = eventinit ;

exports.getthisHash = getthisHash ;

// coop net
function getCODlist(){
	
}

function getCODObj(){
	
}

function createCOD(url,listener,author,name,callback){
	https.get(url,function (response){
		response.on('data',function(js){
			console.log(js.toString());
			
			var data = new Object();
			data.name = name;
			data.id = GetHash(js.toString(),-1);
			data.codetype = 1;
			data.codeurl = url;
			data.listener = listener;
			data.createtime = new Date().getTime();
			data.remark = name+".deploy";
			
			var item = new Object();
	
			item.cod = name;
			item.tag = "deploy";
			item.author = author;
			item.data = data;
			item.sigtype = 0;

			sent(item,'POST',function (retstr){
				if (typeof(callback) != "undefined") {
					callback(retstr);
				}
			});
		});
		
	});
}
// Joint Token
var balance ;
var secuserinfo ;
var pubuserinfo ;
var secfile ;
var pubfile ;

updatebalance();
//postsync();

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
			
			if (typeof(callback) != "undefined") {
				callback(balance);
			}
		});
	});
}

function createAuto(url,listener,author,name,callback){
	https.get(url,function (res){
		var js = ""; 
		res.setEncoding('utf8');

		res.on('data', function(data){
		  js += data ;
		});
		res.on('end', function(){
			console.log(js.toString());
			
			var data = new Object();
			data.id = GetHash(js.toString(),-1);
			data.codetype = 1;
			data.codeurl = url;
			data.listener = listener;
			data.createtime = new Date().getTime();
			data.remark = name+".auto";
			
			var item = new Object();
	
			item.cod = name;
			item.tag = "auto";
			item.author = author;
			item.data = data;
			item.sigtype = 0;

			sent(item,'POST',function (retstr){
				if (typeof(callback) != "undefined") {
					callback(retstr);
				}
			});
		});
		
	});
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
	});
	
	//files = fs.readdirSync("post/");
	files.forEach(function(item) {
		if (item.substr(0,9) == "transfer."){
			var obj = yaml.safeLoad(fs.readFileSync("post/"+item, 'utf8'));
			//console.log("\npostfile event item:\n",item);
			//console.log("\npostfile event obj.sigtype:\n",obj.sigtype);
			var data ;
			if(obj.log != undefined){
				var log = yaml.safeLoad(obj.log);
				data = yaml.safeLoad(log.data);
			}else if (obj.sigtype === 0){
				data = obj.data;
			}else {
				data = obj.data;
				//console.log("postfile event data:\n",data);
				var msg = openpgp.cleartext.readArmored(data);
				//console.log("postfile event msg:\n",msg);
				//console.log("postfile event msg text:\n",msg.text);
				//console.log("postfile event msg getText:\n",msg.getText());
				
				var author = obj.author ;
				//console.log("author",author);
				//console.log("pubfile author",pubfile[author]);
				var nor = yaml.safeLoad(fs.readFileSync(pubfile[author],'utf8'));
				var pubkeys = openpgp.key.readArmored(nor.data.pubkey).keys;
				var pubkey = pubkeys[0];
				//console.log("pubkey author pubkeys\n",pubkeys);
				//console.log("pubkey author pubkey\n]",pubkey);
				var result = msg.verify(pubkeys);
				//console.log("verify result",result);
				//console.log("verify result.keyid",result[0].keyid);
				//console.log("verify result.valid",result[0].valid);

				data = yaml.safeLoad(msg.text);
			}
			
			if(data.hasOwnProperty("input")) {
				var input = data.input;
				var id = input.id;
				var amount = input.amount;
				existORcreate(balance,id);
				balance[id] = balance[id] - amount;
			}
			
			if(data.hasOwnProperty("output")) {
				var output = data.output;
				id = output.id;
				amount = output.amount;
				existORcreate(id);
				balance[id] = balance[id] + amount;
			}
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

function Issue() {
	var data = new Object();
	var input = new Object();
	var output = new Object();
	data.jtid = '1c636fec7bdfdcd6bb0a3fe049e160d354fe9806';	// just for debug
	//input.id = payerid;
	//input.amount = amount;
	//data.input = input;
	output.id = "d4daa038556e2fc2b01f55036f4ff2d2e8c2fc78";
	output.amount = 8192;
	data.output = output;
	data.total = 8192;
	data.time =  new Date().getTime();//new Date().toLocaleString();
	data.remark = "issue sample";
	console.log(data);
	
	var datastr = yaml.safeDump(data);
	var item = new Object();
	item.type = 1;
	item.data = datastr;
	item.hashtype = -1;
	item.hash = GetHash(datastr,-1);
	item.sigtype = 0;

	doc = yaml.safeDump(item);
	
	//var authorseckey = payerseckey;
	var postbody = new Object();
	
	postbody.tag = "transfer";
	postbody.author = "JT";
	postbody.log = doc;
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
}

function CODtransfer(payerid,payeeid,amount,callback){
	if(amount > balance[payerid]){
		console.log("overdraw");
		return;
	}
	
	var data = new Object();
	var input = new Object();
	var output = new Object();
	data.jtid = '1c636fec7bdfdcd6bb0a3fe049e160d354fe9806';	// just for debug
	input.id = payerid;
	input.amount = amount;
	data.input = input;
	output.id = payeeid;
	output.amount = amount;
	data.output = output;
	data.total = amount;
	data.time =  new Date().getTime();//new Date().toLocaleString();
	data.remark = "cod transfer sample";
	console.log(data);
	
	var datastr = yaml.safeDump(data);
	var item = new Object();
	item.tag = "transfer";
	item.author = payerid;
	item.sigtype = 0;
	item.data = data;
	
	sent(item,'POST',callback);
}

function transfer(payerid,payeeid,amount,passphrase,callback){
	if(amount > balance[payerid]){
		console.log("overdraw");
		return;
	}
	
	var payersecfile = secfile[payerid];
	//var payerpubfile = payerid + ".pub";
	var payerseckey = openpgp.key.readArmored(fs.readFileSync(payersecfile,'utf8')).keys[0];
	//var payerpubkey = openpgp.key.readArmored(fs.readFileSync(payerpubfile,'utf8')).keys[0];
	
	var payeepubfile = pubfile[payeeid];
	console.log("transfer payeeid:",payeeid)
	//console.log("transfer pubfile:",pubfile)
	//console.log("transfer payeepubfile:",payeepubfile)
	var nor = yaml.safeLoad(fs.readFileSync(payeepubfile,'utf8'));
	//var payeepubkey = openpgp.key.readArmored(nor.data.pubkey).keys[0];
	
	var data = new Object();
	var input = new Object();
	var output = new Object();
	data.jtid = '1c636fec7bdfdcd6bb0a3fe049e160d354fe9806';	// just for debug
	data.type = 3;
	input.id = payerseckey.primaryKey.fingerprint;
	input.amount = amount;
	data.input = input;
	output.id = payeeid.toString();
	output.amount = amount;
	data.output = output;
	data.total = amount;
	data.time =  new Date().getTime();//new Date().toLocaleString();
	data.remark = "transfer sample";
	console.log(data);
	
	var datastr = yaml.safeDump(data);
	var item = new Object();
	item.tag = "transfer";
	item.author = payerid;
	item.sigtype = 2;
	//item.hash = new Hashes.SHA512().b64(datastr);
	
	if(payerseckey.decrypt(passphrase)){
		//var sig = openpgp.sign(payerseckey,data);
		//console.log("infra.transfer:",sig);
		//console.log("infra.transfer:",data);
		openpgp.signClearMessage(payerseckey,datastr).then(function(pgpMessage){
			// success
			console.log(pgpMessage);
			item.data = pgpMessage;
			
			sent(item,'POST',callback);
		}).catch(function(error) {
			// failure
			console.log("签名失败！"+error);
		});
	}
}

// distribute storage
var localPostIdx,localPutIdx;
localindexinit();

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
	
	console.log("sending account to server...\n",options);

	var req = http.request(options, function(res) {
	  console.log('STATUS: ' + res.statusCode);
	  console.log('HEADERS: ' + JSON.stringify(res.headers));
	  res.setEncoding('utf8');

	  res.on('data', function (chunk) {
		console.log('BODY: ' + chunk);
		if (typeof(callback) != "undefined") {
			callback(chunk);
		}
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
	postfileArray = new Array() ;
	var addr = "http://"+config.server.url+":"+config.server.port+'/post/index.yaml';
	var req = http.get(addr, function(res) {
		var postindex = ""; 
		res.setEncoding('utf8');
		
		res.on('data', function(data){
		  postindex += data ;
		});
		res.on('end', function(){
			globalPostIdx = yaml.safeLoad(postindex);
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
						console.log("key:\t"+key+"\tid:\t"+id);
						
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
					var chunk = ""; 
					res.setEncoding('utf8');
					
					res.on('data', function(data){
					  chunk += data ;
					});
					res.on('end', function(){
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
						console.log("event postupdate,createtime:\n",createtime);
						emitter.emit("postupdate",finish);
					}else if(balance == undefined) {
						console.log("event postupdate, init balance...");
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

eventinit();

emitter.on("postfile",function(item){
	console.log("event postfile, item: ",item);
	if((item.substr(item.indexOf(".")+1,5) == "auto.") || (item.substr(0,5) == "auto.")){
		var auto = yaml.safeLoad(fs.readFileSync("post/"+item, 'utf8'));
		var autofilename = item.substr(0,item.lastIndexOf(".")) + ".js" ;
		
		console.log("new auto account: download "+auto.data.codeurl+" and saved as "+autofilename);
		var autoget = https.get(auto.data.codeurl,function(res) {
			var chunk = ""; 
			res.setEncoding('utf8');

			res.on('data', function(data){
			  chunk += data ;
			});
			res.on('end', function(){
				fs.writeFileSync(autofilename,chunk);
				
				var a = require("./"+autofilename);
				for (var event in auto.data.listener){
					var lf = auto.data.listener[event] ;
					//console.log("a."+lf);
					emitter.on(event,eval("a."+lf));
					//console.log(emitter);
				}
			});
		});
	}
	if((item.substr(item.indexOf(".")+1,7) == "deploy.") || (item.substr(0,7) == "deploy.")){
		var cod = yaml.safeLoad(fs.readFileSync("post/"+item, 'utf8'));
		var codfilename = item.substr(0,item.lastIndexOf(".")) + ".js" ;
		
		console.log("new cod account: download "+cod.data.codeurl+" and saved as "+codfilename);
		var codget = https.get(cod.data.codeurl,function(res) {
			var chunk = ""; 
			res.setEncoding('utf8');

			res.on('data', function(data){
			  chunk += data ;
			});
			res.on('end', function(){
				fs.writeFileSync(codfilename,chunk);
				
				var a = require("./"+codfilename);
				for (var event in cod.data.listener){
					var lf = cod.data.listener[event] ;
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


function getthisHash(filename){
	if (filename == undefined){
		filename = process.argv[1];
	}
	console.log("filename:\t",filename)
	var data = fs.readFileSync(filename);
	var datahash = GetHash(data.toString(),-1)
	
	return datahash;
}

function GetHash(str,type){
	var MD5 = new Hashes.MD5;
	var SHA1 = new Hashes.SHA1;
	var SHA256 =  new Hashes.SHA256;
	var SHA512 = new Hashes.SHA512;
	var RMD160 = new Hashes.RMD160;
/*
* hashtype： 哈希算法类型
	* -1: default, SHA1 hex for now.
	* 1:MD5 hex
	* 2:MD5 b64
	* 3:SHA1 hex
	* 4:SHA1 b64
	* 5:SHA256 hex
	* 6:SHA256 b64
	* 7:SHA512 hex
	* 8:SHA512 b64
	* 9:RIPEMD-160 hex
	* 10:RIPEMD-160 b64
*/
	switch (type) {
		case 1:
		return MD5.hex(str);
		break;
		case 2:
		return MD5.b64(str);
		break;
		case 3:
		return SHA1.hex(str);
		break;
		case 4:
		return SHA1.b64(str);
		break;
		case 5:
		return SHA256.hex(str);
		break;
		case 6:
		return SHA256.b64(str);
		break;
		case 7:
		return SHA512.hex(str);
		break;
		case 8:
		return SHA512.b64(str);
		break;
		case 9:
		return RMD160.hex(str);
		break;
		case 10:
		return RMD160.b64(str);
		break;
		default:
		return SHA1.hex(str);
		break;
	}
}

function eventinit() {
	var files = fs.readdirSync("post/");
	files.forEach(function(item) {
		if((item.substr(item.indexOf(".")+1,5) == "auto.") || (item.substr(0,5) == "auto.")){
			var auto = yaml.safeLoad(fs.readFileSync("post/"+item, 'utf8'));
			var autofilename = item.substr(0,item.lastIndexOf(".")) + ".js" ;
			var a = require("./"+autofilename);
			for (var event in auto.data.listener){
				var lf = auto.data.listener[event] ;
				//console.log("a."+lf);
				emitter.on(event,eval("a."+lf));
				//console.log(emitter);
			}
		}
	});
}

function localindexinit(){
	mkdirsSync("post",0777);
	fs.exists("post/index.yaml", function (exists) {
		if (exists) {
			localPostIdx = yaml.safeLoad(fs.readFileSync('post/index.yaml', 'utf8'));
		}else {
			localPostIdx = new Object();
			localPostIdx.update = new Date().toLocaleString();
			fs.writeFileSync("post/index.yaml",yaml.safeDump(localPostIdx));
		}
	});
	
	mkdirsSync("put",0777);
	fs.exists("put/index.yaml", function (exists) {
		if (exists) {
			localPutIdx = yaml.safeLoad(fs.readFileSync('put/index.yaml', 'utf8'));
		}else {
			localPutIdx = new Object();
			localPutIdx.update = new Date().toLocaleString();
			fs.writeFileSync("put/index.yaml",yaml.safeDump(localPutIdx));
		}
	});
}

//创建多层文件夹 同步
function mkdirsSync(dirpath, mode) { 
    if (!fs.existsSync(dirpath)) {
        var pathtmp;
        dirpath.split(path.sep).forEach(function(dirname) {
            if (pathtmp) {
                pathtmp = path.join(pathtmp, dirname);
            }
            else {
                pathtmp = dirname;
            }
            if (!fs.existsSync(pathtmp)) {
				console.log("create dir:\t",pathtmp)
                if (!fs.mkdirSync(pathtmp, mode)) {
                    return false;
                }
            }
        });
    }
    return true; 
}