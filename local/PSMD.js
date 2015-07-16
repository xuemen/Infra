var infra = require('./infra');

var fs = require('fs');
var readline = require('readline');
var yaml = require('js-yaml');

var config = yaml.safeLoad(fs.readFileSync('config.yaml', 'utf8'));


//infra.postsync(askandtransfer);
infra.postsync(main);
//createAuto();
//askandtransfer();


function main (){
	console.log("1 创建普通账户\n2 创建自动账户\n3 转账\n4 同步数据\n5 创建COD\n 6 退出");
	var answer = readSyn();
	console.log("answer=",answer);
	switch (parseInt(answer)) {
		case 1: createNor();
		break;
		case 2:createAuto();
		break;
		case 3:askandtransfer();
		break;
		case 4:infra.postsync();
		break;
		case 5:createCOD();
		break;
		case 6:return;
		break;
		default:
		break;
		
	}

}

exports.postfile = postfile ;
exports.postupdate = postupdate ;

function postfile(item) {
	console.log("enter PSMD deploy postfile:\t",item);
	var thisHash = getthisHash();
	if (item.substr(0,9) == "transfer."){
			var obj = yaml.safeLoad(fs.readFileSync("post/"+item, 'utf8'));
			var log = yaml.safeLoad(obj.log);
			var data = yaml.safeLoad(log.data);
			
			var input = data.input;
			var output = data.output;
			
			var id = output.id;
			if (id == thisHash) {
				var amount = output.amount;
				infra.CODtransfer(thisHash,'f82478ea56a214d867522cdbcd52c7b5b323f939',amount*0.02);
			}
		}
}

function getthisHash(){
	var filename = process.argv[1];
	console.log("filename:\t",filename)
	var data = fs.readFileSync(filename);
	var datahash = new Hashes.SHA512().b64(data.toString())
	
	return datahash;
}

function postupdate() {
	console.log("enter PSMD deploy postupdate");
}


function createCOD(){
	process.stdin.setEncoding('utf8');
	process.stdout.setEncoding('utf8');
	var rl = readline.createInterface({
	  input: process.stdin,
	  output: process.stdout
	});

	var url,listener,author,name;

	rl.question("请输入代码URL：\n", function(answer) {
		url = answer;
		listener = new Object();
		listener["postfile"] = "postfile" ;
		listener["postupdate"] = "postupdate" ;
		
		rl.question("COD名称：\n", function(answer) {
			name = answer;
			rl.question("创建者：\n", function(answer) {
				author = answer;
				rl.close();

				infra.createCOD(url,listener,author,name,function(retstr){
					console.log(retstr," 已创建.")
				});
			});
		});
	});
}

function readSyn() {  
   process.stdin.pause();  
   var response = fs.readSync(process.stdin.fd, 1000, 0, "utf8");  
   process.stdin.resume();  
   return response[0].trim();  
}  


function log(b){
	console.log("PSMD log:\n",b);
};

function createNor(){
	process.stdin.setEncoding('utf8');
	process.stdout.setEncoding('utf8');
	var rl = readline.createInterface({
	  input: process.stdin,
	  output: process.stdout
	});

	var name,id,email,passphrase;

	rl.question("请输入姓名：\n", function(answer) {
		name = answer;
		rl.question("请输入id(英文和字母组成)：\n", function(answer) {
			id = answer;
			rl.question("请输入Email地址：\n", function(answer) {
				email = answer;
				rl.question("请输入私钥保护口令(以后经常使用，请务必记住，但不能告诉任何人。)：\n", function(answer) {
					passphrase = answer;
					rl.close();

					infra.createNor(name,id,email,passphrase,function(retstr){
						console.log(retstr," 已创建.");
					});

				});
			});
		});
	});
}


function createAuto(){
	process.stdin.setEncoding('utf8');
	process.stdout.setEncoding('utf8');
	var rl = readline.createInterface({
	  input: process.stdin,
	  output: process.stdout
	});

	var url,listener,author,name;

	rl.question("请输入代码URL：\n", function(answer) {
		url = answer;
		listener = new Object();
		listener["postfile"] = "postfile" ;
		listener["postupdate"] = "postupdate" ;
		
		rl.question("账号户名：\n", function(answer) {
			name = answer;
			rl.question("创建者：\n", function(answer) {
				author = answer;
				rl.close();

				infra.createAuto(url,listener,author,name,function(retstr){
					console.log(retstr," 已创建.")
				});
			});
		});
	});
}

function askandtransfer(){
	var secuserinfo = infra.secuserinfo;
	var pubuserinfo = infra.pubuserinfo;
	var balance = infra.balance;

	console.log("可选的付款人:")
	for (var key in secuserinfo) {
		console.log("账号：\t"+key+"\n户主：\t"+secuserinfo[key]+"\n余额：\t"+balance[key]+"\n");
	}
	
	
	process.stdin.setEncoding('utf8');
	process.stdout.setEncoding('utf8');
	var rl = readline.createInterface({
	  input: process.stdin,
	  output: process.stdout
	});
	// choice one as payer
	var payer,payee,amount,passphrase;

	rl.question("\n\n请输入付款人账号(可以输入前几个字母)：\n", function(answer) {
		for (var fingerprint in secuserinfo) {
			if (fingerprint.indexOf(answer) == 0){
				payer = fingerprint;
			}
		}
		if(payer == undefined){
			console.log('没有这个账号。');
			return;
		}
		console.log('付款人完整账号：',payer);
		
		console.log("可选的收款人:")
		for (var key in pubuserinfo) {
			console.log("账号：\t"+key+"\n户主：\t"+pubuserinfo[key]+"\n余额：\t"+balance[key]+"\n");
		}
		rl.question("请输入收款人ID(可以输入前几个字母)：\n", function(answer) {
			for (var fingerprint in pubuserinfo) {
				if (fingerprint.indexOf(answer) == 0){
					payee = fingerprint;
				}
			}
			if(payee == undefined){
				console.log('没有这个账号。');
				return;
			}
			console.log('收款人完整账号：',payee);

			rl.question("请输入付款金额：\n", function(answer) {
				var input = Number(answer);
				if (isNaN(input)) {
					console.log("金额不对呀");
				} else {
					amount = input;
					
					if(balance[payer] < amount) {
						console.log("余额不足。");
						//return;
						process.exit()
					};

					rl.question("请输入付款人私钥口令：\n", function(answer) {
						passphrase = answer;
						rl.close();
						
						infra.transfer(payer,payee,amount,passphrase);
					});
				}
			});
		});
	});
}