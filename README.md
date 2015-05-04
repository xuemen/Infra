##Infra
基础设施项目由协作网络、信任网络、联合提货权三部分组成。

###去中心
1. 在劫持成本高于收益时，Infra项目将启动去中心工作。在此之前，由学门联合产品部负责制定弱中心方案，度过项目启动初期。
2. 去中心方案将提前制定并公布在本git库，具体路径：（第一个方案公布时确定）。
3. 针对具体去中心方案的劫持方案，任何成员可以在本git库提交issue。
4. 针对具体劫持方案的成本和收益，任何成员可以在issue下发表comment。
5. 由学门联合产品部判定：某个去中心方案的所有劫持方案，均符合“劫持成本高于收益”。

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
├── cfg
|   ├── index.yaml
|   ├── [cod.]tag.author.[id.]xxx
|   ├── [cod.]tag.author.[id.]xxx
|   └── [cod.]tag.author.[id.]xxx
└── log
    ├── index.yaml
    ├── [cod.]tag.author.[id.]xxx
    ├── [cod.]tag.author.[id.]xxx
    └── [cod.]tag.author.[id.]xxx
</pre>
1. cod：共同体部署标识。
2. author：提交者标识。
3. tag：种类标识。
4. id：唯一编号，通常是流水号。
5. xxx：文件后缀，通常时yaml。

###提交规则
1. 个人cfg文件：
	1. 部署者签名直接接受。
	2. 先提交到testnet，根据testnet行为提取到正式cfg路径。
2. 其它数据，由author签名即可接受。