##Infra
学门联合产品部基础设施项目

###需求概况
Infra为共同体部署者提供统一的软件模块，由所有共同体的成员共享，包括以下需求：
####协作网络 
1. 创建共同体
	1. createCOD(url,listener,author,name,callback)
		* url: 部署代码的存放地址
		* lisetener：cod的事件处理函数列表。一个对象，key是事件名称，value是处理函数名。函数必须是统一形式，根据事件不同。
		* author：作者（部署者）的ID。
		* name：COD的名称
		* callback：创建结束后的回调函数。参数是COD文件前缀。

2. 查询共同体的角色清单，这些共同体是部署者注册成功的；
	1. getCODlist()
		* 无参数
		* 返回一个字符串数组，内容是COD名称
2. 选择角色查看协议，调整参数并签署；
	1. getCODObj(CODName)
		* CODName：COD的名称
		* 返回COD对象，读取其中的角色清单，和对应的用户协议。
		* 根据用户操作产生数字签名的契约。
	2. 读取COM对象的角色清单，选取对象
3. 根据角色接收工单；
4. 根据工单提交工作结果；
5. 根据工作结果获得利益。

####信任网络 DTT：Distributed Trust Table
1. 发布一个产品；
2. 发布针对对象（产品、成员）的属性；
3. 针对对象属性提交评价，这些评价信息沿着信任关系传递；
4. 促成交易的评价者可以获得回报；
5. 发布广告；
6. 针对有影响力的评价者提供优惠价格。

####联合提货权 JT：Joint Token
1. 创建账号；
	1. createNor(name,id,email,passphrase,callback)（普通账号：主要由成员使用，2048位openpgp密钥对）
		* name：户名
		* id：账号ID
		* email：联系email
		* passphrase：私钥口令
		* callback：回调函数
	2. createAuto(url,listener,author,name,callback)（自动帐号：根据事件触发对外转账）
		* url：自动账户代码地址
		* listener：事件处理函数对象，key=事件名称，value=处理函数名称。
		* author：作者（部署者）签名。
		* name：户名
		* callback：回调函数

	3. 根账号：创建一种新的提货权，根据事件触发发行、销毁；
2. 建立账号列表
	1. readKey()返回key对象
		* key[fingerprint | id] = obj
        * owner: userid | cod
        * keyprefix ：可选
        * norfilename
        * balance
3. 导入密钥对，从本路径下的sec、pub文件导入nor账号并提交。
	1. importNor()
4. 更新余额，包括各种账号类别。
	1. updatebalance(callback)
		* callback：回调函数
5. 发行，仅供测试使用。
	1. Issue()
6. 普通账号转账；
	1. transfer(payerid,payeeid,amount,passphrase,callback){
		* payerid：付款人
		* payeeid：收款人
		* amount：金额
		* passphrase：付款人私钥口令
		* callback：回调函数
7. 自动账户转账，记录在local文件夹
	1. CODtransfer(payerid,payeeid,amount,callback)
		* payerid：付款COD ID
		* payeeid：收款人
		* amount：金额
		* callback：回调函数
3. 发布预售计划；
4. 申请预购，同时确定提货|兑现；
5. 申请贷款；
6. 针对贷款、预购的投资回报提交意见。
7. 针对投资回报意见获得回报。
8. 兑换成外部货币。
9. 申请外部货币直接支付网关。

以上三套基础设施，共享下面的分布式底层功能：
####分布式存储
1. 提交工作记录，使它自动同步到其他成员的本地文件系统；
2. 同步工作计划，即把其他人提交的工作记录同步到本地文件系统；

####分布式事件驱动机制
1. 提交事件处理函数；
2. 原生提供以下事件激发：
	1. 时间：每小时产生一个时间；
	2. 接收工作记录：新工作记录同步到本地后，按照时间顺序激发接收时间。
3. 在重启软件（或操作系统）后仍然能恢复已有的[事件：处理函数]映射关系。

为了确保分布式底层功能有效运行，需要一套机制：  
1. 能够从零成员启动；
2. 任何阶段劫持成本高于收益；
3. 根据上一点原则，逐步升级分布式机制。

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

###type
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

* signtype： 数字签名类型
	* 缺省：没有签名
	* 0: no sign | 没有签名
	* 1: openpgp detach
	* 2: openpgp clear
- keytype: 密钥类型。
	- 1:rsa
	- 2:openpgp
- codetype: 源代码类型。
	- 1:js
	- 2:lua