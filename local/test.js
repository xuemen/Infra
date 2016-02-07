var readline = require('readline');
var u, p, verifycode;
 
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    // tab 自动完成
    completer: function(line) {
        var completions = 'login logout getFriends getGroups'.split(' ')
        var hits = completions.filter(function(c) { return c.indexOf(line) == 0 })
        return [hits.length ? hits : completions, line]
    },
    terminal: true
});
 
// 设置命令提示符
rl.setPrompt('webqq> ');
// 给我提示
rl.prompt(true);
 
var commands = {
    'login': function(){
        rl.question("Input your QQ number:", function(u) {
            u = u;
            rl.question("Input your QQ password:", function(p) {
                p = p;
                console.log('qq:' + u + ', pass:' + p);
            });
        });
    },
    'logout': function(){
        console.log('logout...');
    },
    'getFriends': function(){
        console.log('getFriends...');
    },
    'getGroups': function(){
        console.log('getGroups...');
    }
};
 
// 等待输入
rl.on('line', function (cmd) {
    switch(cmd.trim()){
        case 'login':
            commands[cmd.trim()]();
            break;
        case 'logout':
            commands[cmd.trim()]();
            break;
        case 'getFriends':
            commands[cmd.trim()]();
            break;
        case 'getGroups':
            commands[cmd.trim()]();
            break;
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
    console.log('欢迎再次使用webqq!');
    process.exit(0);
});
