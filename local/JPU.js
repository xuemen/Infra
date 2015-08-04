var infra = require('./Infra');

var fs = require('fs');
var readline = require('readline');
var yaml = require('js-yaml');

var config = yaml.safeLoad(fs.readFileSync('config.yaml', 'utf8'));


process.on('uncaughtException', function(err) {
	var log = new Object();
	log.err = err;
	log.exports = infra ;
	log.config = config ;
	var filename = "error"+new Date().getTime() +".log";
	fs.writeFileSync(filename,yaml.safeDump(log));
	console.log('\n\n============================================================\n出现错误！请把这个文件发给huangyg@xuemen.com\n============================================================\n\n',filename);
	rl.prompt(true);
});

process.stdin.setEncoding('utf8');
process.stdout.setEncoding('utf8');
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    // tab 自动完成
    completer: function(line) {
        var completions = 'help createnormal createauto createcod importnor transfer sync issue listaccount'.split(' ')
        var hits = completions.filter(function(c) { return c.indexOf(line) == 0 })
        return [hits.length ? hits : completions, line]
    },
    terminal: true
});

// 等待输入
rl.on('line', function (cmd) {
    switch(cmd.trim()){
        case 'help':
            help();
            break;
        case 'createnormal':
            createNor();
            break;
        case 'createauto':
            createAuto();
            break;
        case 'createcod':
            createCOD();
            break;
        case 'importnor':
			infra.importNor();
            break;
		case 'transfer':
            askandtransfer();
            break;
        case 'sync':
            infra.postsync();
            break;
        case 'issue':
            infra.Issue();
            break;
        case 'listaccount':
			console.log("账户详细信息：\n",infra.key);
			console.log("事件表：\n",infra.emitter);
		default:
            console.log(cmd.trim());
    }
    rl.prompt(true);
});

// Ctrl + c
rl.on('SIGINT', function() {
    rl.question('Sure to exit ? ', function(answer) {
        if (answer.match(/^y(es)?$/i)) {
            rl.pause();
        }else {
            rl.prompt(true);
        }
    });
});
 
// Ctrl + d
rl.on('close', function() {
    console.log('欢迎再次使用 JPU 客户端!');
    process.exit(0);
});

// 设置命令提示符
rl.setPrompt('JPU> ');
// 给我提示
help();
rl.prompt(true);




function help() {
	console.log("help:\t\t显示帮助");
	console.log("createnormal:\t创建普通账号");
	console.log("createauto:\t创建自动账号");
	console.log("createcod:\t创建COD");
	console.log("importnor:\t导入普通账号");
	console.log("transfer:\t转账");
	console.log("listaccount:\t查看所有账户");
	console.log("sync:\t\t同步数据");
	console.log("issue:\t\t发行");
	console.log("ctrl-c:\t\t退出");
}

function createCOD(){
	var url,listener,author,name;

	rl.question("请输入代码URL：\n", function(answer) {
		url = answer;
		listener = new Object();
		listener["transfer"] = "transfer" ;
		listener["nor"] = "nor" ;
		listener["auto"] = "auto" ;
		listener["deploy"] = "deploy" ;
		
		rl.question("COD名称：\n", function(answer) {
			name = answer;
			rl.question("创建者：\n", function(answer) {
				author = answer;
				//rl.close();

				infra.createCOD(url,listener,author,name,function(retstr){
					console.log(retstr," 已创建.")
				});
			});
		});
	});
}

function createNor(){
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
					//rl.close();

					infra.createNor(name,id,email,passphrase,function(retstr){
						console.log(retstr," 已创建.");
					});

				});
			});
		});
	});
}

function createAuto(){
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
				//rl.close();

				infra.createAuto(url,listener,author,name,function(retstr){
					console.log(retstr," 已创建.")
				});
			});
		});
	});
}

function askandtransfer(){
	var key = infra.key;

	console.log("可选的付款人:")
	for (var id in key) {
		if (key[id].hasOwnProperty("keyprefix")) {
			console.log("账号：\t"+id+"\n户主：\t"+key[id].owner+"\n余额：\t"+key[id].balance+"\n");
		}
	}
	console.log("其它账户:")
	for (var id in key) {
		if (!key[id].hasOwnProperty("keyprefix")) {
			console.log("账号：\t"+id);
		}
	}
	
	// choice one as payer
	var payer,payee,amount,passphrase;

	rl.question("\n请输入付款人账号(可以输入前几个字母，但要避开“其它账户”)：\n", function(answer) {
		for (var id in key) {
			if (id.indexOf(answer) == 0){
				payer = id;
			}
		}
		if(payer == undefined){
			console.log('没有这个账号。');
			return;
		}
		console.log('付款人完整账号：',payer);
		
		console.log("\n\n可选的收款人:")
		for (var id in key) {
			console.log("账号：\t"+id+"\n户主：\t"+key[id].owner+"\n余额：\t"+key[id].balance+"\n");
		}
		rl.question("\n请输入收款人账号(可以输入前几个字母)：\n", function(answer) {
			for (var id in key) {
				if (id.indexOf(answer) == 0){
					payee = id;
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
					
					if(key[payer].balance < amount) {
						console.log("余额不足。");
						return;
					};

					rl.question("请输入付款人私钥口令：\n", function(answer) {
						passphrase = answer;
						//rl.close();
						
						infra.transfer(payer,payee,amount,passphrase);
					});
				}
			});
		});
	});
}