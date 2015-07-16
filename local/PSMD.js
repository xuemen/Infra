var infra = require('./infra');

var fs = require('fs');
var readline = require('readline');
var yaml = require('js-yaml');

var config = yaml.safeLoad(fs.readFileSync('config.yaml', 'utf8'));

//infra.postsync(log);
//infra.emitter.emit("postsync",log);

infra.updatebalance(askandtransfer);


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
		console.log('付款人完整ID：',payer);
		
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
						console.log(retstr," 已创建.")
					});

				});
			});
		});
	});
}