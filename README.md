##Infra
学门联合产品部基础设施项目

###概况
Infra为共同体部署者提供统一的软件模块，由所有共同体的成员共享。

###客户端开发


###服务端部署


###去中心化
Infra项目从有中心方案启动，每当新方案的去中心化程度更高、且劫持成本高于收益时，由学门联合产品部（JPU）实施升级。具体步骤如下：

1. 任何成员可以对commit提交comment；
2. JPU汇总思路，整理为各种新方案并公布在本git库，具体路径：（第一个方案公布时确定）。
3. 针对具体去中心方案的劫持方案，任何成员可以在本git库提交issue。
4. 针对具体劫持方案的成本和收益，任何成员可以在issue下发表comment。
5. 由JPU判定：某个去中心方案的所有劫持方案，均符合“劫持成本高于收益”。

###各阶段方案
1. 有中心：中心服务器供各方共享数据，尽量不处理业务逻辑。
2. 弱中心：
	* qiniu：数据保存在专业数据服务器上，中心服务器只管理访问权限。
3. git
4. 无中心
	* dht
	* blockchina

###文件夹结构
<pre>
.
├── deployer.pubkey
├── config.yaml
├── put
|   ├── index.yaml
|   ├── [cod.]tag.author.[id.]xxx
|   ├── [cod.]tag.author.[id.]xxx
|   └── [cod.]tag.author.[id.]xxx
├── post
|   ├── index.yaml
|   ├── [cod.]tag.author.id.xxx
|   ├── [cod.]tag.author.id.xxx
|   └── [cod.]tag.author.id.xxx
├── local
|   ├── index.yaml
|   ├── [cod.]tag.id.xxx
|   ├── [cod.]tag.id.xxx
|   └── [cod.]tag.id.xxx
└── listener
    ├── index.yaml
    ├── [cod.]tag.js
    ├── [cod.]tag.js
    └── [cod.]tag.js
</pre>
1. 文件格式：
	1. cod：共同体部署标识。
	2. author：提交者标识。
	3. tag：种类标识。
	4. id：put下任意自取，post下是自动取[cod.tag]或[tag.author]范围内唯一的自增数。
	5. xxx：文件后缀，通常时yaml。
2. put文件夹：可以增、改。暂时不能删，可以设置失效标志。失效后不可重启。
	1. 只能由原author修改。
3. post文件夹：只增不删不改。
4. listener文件夹：处理事件的代码。

###http API
1. POST | PUT ： 
	1. 入口：http://url:port/xxx
	2. 其中xxx是文件后缀
2. GET：
	1. 入口：http://url:port/post/cod.tag.author.xxx
	2. 其中xxx是文件后缀

###文件内容.yaml
* cod
* tag
* author
* id：PUT时可以指定
* data： 数据（含数字签名）
* signtype： 数字签名类型
* createat：创建时间unixtime
* remark: 备注

###提交规则
1. 全局部署者的公钥与部署包一同发布，存放在根目录下\deployer.pubkey。
2. 接受全局部署者签名的全局成员memberid.person.yaml。
3. 接受全局部署者签名的cod部署者cod.deployer.person.yaml。
4. 接受cod部署者签名的cod成员cod.memberid.person.yaml。
5. 接受testnet中表现良好的成员，具体规则待定。
6. 其它数据，由合法author签名即可接受。
