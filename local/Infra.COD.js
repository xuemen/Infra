var https = require('https');
var fs = require('fs');
var events = require('events');
var emitter = new events.EventEmitter();
var yaml = require('js-yaml');

var indexurl = "https://raw.githubusercontent.com/xuemen/Infra/master/server/COD.yaml";
var cod ;
https.get(indexurl,function (response){
	response.on('data',function(data){
		cod = yaml.safeLoad(data);
	});
});

console.log(cod);

for (var i in cod) {
	console.log(cod[i]);
	event = cod[i].event;
	for (var id in event) {
		console.log(id+event[id]);
	}
}
/*
var ticket = require('./ticket')

emitter.on("ticket1",eval("ticket.t1"));
emitter.on("ticket2",ticket.t2);
emitter.emit("ticket1");

/*
https.get("https://raw.githubusercontent.com/hyg/js.sample/master/learnyounode/6.module.js",function (response){
	response.on('data',function(data){
		//console.log(data.toString());
		fs.writeFile("a.js",data,function(err){
			var a = require("./a.js");
			a("C:/Users/huangyg/Desktop","pdf",function callback(err, data){
				if (err) throw err;
				
				for(var i=0;i<data.length;i++){
					console.log(data[i].toString())
				}
			});
		});
	});
	
});
*/