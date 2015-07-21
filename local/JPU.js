var infra = require('./Infra');

var fs = require('fs');
var readline = require('readline');
var yaml = require('js-yaml');

var config = yaml.safeLoad(fs.readFileSync('config.yaml', 'utf8'));


//infra.postsync(askandtransfer);
infra.postsync(main);
//createAuto();
//askandtransfer();

function main () {
	process.stdin.setEncoding('utf8');
	process.stdout.setEncoding('utf8');
	var rl = readline.createInterface({
	  input: process.stdin,
	  output: process.stdout
	});

	var secuserinfo = infra.secuserinfo;
	var pubuserinfo = infra.pubuserinfo;
	var balance = infra.balance;

	console.log("本地账户:")
	for (var key in secuserinfo) {
		console.log("账号：\t"+key+"\n户主：\t"+secuserinfo[key]+"\n余额：\t"+balance[key]+"\n");
	}

	rl.question("\n请输入指令：\n1 创建普通账户\n2 创建自动账户\n3 转账\n4 同步数据\n5 创建COD\n9 发行\n0 退出\n", function(answer) {
		console.log("answer=",answer);
		rl.close();
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
			case 9: infra.Issue();
			break;
			case 0:return;
			break;
			default:
			break;
			
		}
	});
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
			if(answer.indexOf(" ") > -1){
				console.log("id中不能含有空格");
				process.exit(0);
			}
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
			if(answer.indexOf(" ") > -1){
				console.log("账号户名中不能含有空格");
				process.exit(0);
			}
			name = answer;
			rl.question("创建者：\n", function(answer) {
				if(answer.indexOf(" ") > -1){
					console.log("创建者名称中不能含有空格");
					process.exit(0);
				}
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

	rl.question("\n请输入付款人账号(可以输入前几个字母)：\n", function(answer) {
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
		
		console.log("\n\n可选的收款人:")
		for (var key in pubuserinfo) {
			console.log("账号：\t"+key+"\n户主：\t"+pubuserinfo[key]+"\n余额：\t"+balance[key]+"\n");
		}
		rl.question("\n请输入收款人账号(可以输入前几个字母)：\n", function(answer) {
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

			rl.question("\n\n请输入付款金额：\n", function(answer) {
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