export const curriculumVersion = 'game-emotion-2.1';
export const weeks = [
  { title: '情绪标签与脑电数据', focus: '效价、唤醒度、32 导接口、伪迹、PSD、先划分再切窗', outcome: '数据字典、标签说明和无试次交叉的数据划分' },
  { title: '情绪识别双基线', focus: 'Welch 频带功率、逻辑回归、PyTorch、EEGNet', outcome: '能解释的特征基线与 EEGNet 训练流程' },
  { title: '可信评估与代码阅读', focus: '个体化、跨玩家、泄漏检查、调用链、失败分析', outcome: '固定协议的评估报告和可跟踪的代码地图' },
  { title: '游戏回放与接手演练', focus: '时间对齐、因果处理、滑窗、平滑、延迟、对照实验', outcome: '模拟在线预测流程与可复现的改动报告' }
];

export const resources = {
  torch: {label:'PyTorch：Learn the Basics',url:'https://docs.pytorch.org/tutorials/beginner/basics/intro.html'},
  mne: {label:'MNE 官方教程',url:'https://mne.tools/stable/auto_tutorials/index.html'},
  deap: {label:'DEAP 官方数据说明与申请',url:'https://www.eecs.qmul.ac.uk/mmv/datasets/deap/'},
  welch: {label:'SciPy：Welch 功率谱',url:'https://docs.scipy.org/doc/scipy/reference/generated/scipy.signal.welch.html'},
  sklearn: {label:'scikit-learn：常见陷阱与数据泄漏',url:'https://scikit-learn.org/stable/common_pitfalls.html'},
  split: {label:'scikit-learn：交叉验证与分组划分',url:'https://scikit-learn.org/stable/modules/cross_validation.html'},
  eegnet: {label:'EEGNet 原始论文',url:'https://doi.org/10.1088/1741-2552/aace8c'},
  brain: {label:'Braindecode 官方源码',url:'https://github.com/braindecode/braindecode'},
  filter: {label:'SciPy：有状态因果滤波 sosfilt',url:'https://docs.scipy.org/doc/scipy/reference/generated/scipy.signal.sosfilt.html'},
  git: {label:'Git：查看代码差异',url:'https://git-scm.com/docs/git-diff'}
};

// 每行：周、标题、任务、最低、标准、扩展、资料键、代码入口、自查问题（分号分隔）。
const rows = [
 [1,'建立可复现环境','建立 EEG 情绪识别环境，记录 Python、PyTorch、MNE、SciPy、scikit-learn、Braindecode 的版本。','记录环境版本和安装命令。','运行最小张量和 MNE RawArray 测试并保存输出；固定已安装版本。','补充依赖锁定文件和一次干净环境复现。','torch,mne','torch.Tensor；mne.create_info；mne.io.RawArray','张量每一维是什么？;MNE 的 EEG 默认单位是什么？;别人怎样复现你的环境？'],
 [1,'定义情绪目标与标签','用效价和唤醒度建立任务定义；DEAP 仅作教学候选，按官方条件申请。尚无数据时用合成信号练接口，不报告识别效果。','解释效价与唤醒度。','写清标签来源、评分范围、分类或回归目标、缺失与中性标签处理。','比较离散情绪与连续评分的取舍。','deap','数据字典：subject_id、trial_id、rating、timestamp','兴奋与紧张有什么相同和不同？;试次评分能否代表每一秒？;游戏失败是否必然意味着沮丧？'],
 [1,'检查 32 导数据接口','记录通道名称、顺序、单位、参考方式、采样率、事件和标签；先核对数据说明再读取。','输出 shape、通道和采样率。','实现接口检查，区分真实数据与合成接口样本。','故意改变通道顺序或单位，检查能否发现。','mne,deap','Raw.info；Raw.ch_names；Raw.get_data','32 导是否意味着固定的32个位置？;微伏和伏怎样换算？;参考方式为什么需要记录？'],
 [1,'建立信号质量检查','查看波形和 PSD，识别坏导、工频、眨眼、咬牙及运动伪迹；不要盲目套用固定滤波范围。','画一段波形和功率谱。','记录异常通道、幅值和频谱，并解释预处理选择。','比较两种合理处理方案对信号的影响。','mne,welch','Raw.plot；Raw.compute_psd；scipy.signal.welch','肌电会怎样影响情绪模型？;滤波能否消除所有伪迹？;坏导怎样影响空间卷积？'],
 [1,'先划分试次再生成窗口','先按原始试次或被试分组划分，再在各集合内部切窗。预先固定训练、验证和测试索引。','写出划分规则。','检查各集合 trial_id 无交集；保存窗口到原始试次的映射。','验证跨被试划分的 subject_id 也无交集。','split,sklearn','GroupShuffleSplit；GroupKFold；窗口索引生成器','重叠窗口能分到训练与测试两边吗？;标准化在哪个集合拟合？;如何证明两个集合没有共同试次？'],
 [1,'缓冲：预处理与标签对齐','补齐前置任务，并记录窗口起止时间、试次标签和处理顺序。已有预处理数据须核对原处理流程。','完成一个未完成的前置任务。','产出 Raw 到窗口到标签的示意与形状表。','检查基线段和刺激段是否被正确区分。','mne,deap','Epochs；events；annotations；窗口与标签映射','一个窗口对应多少秒？;标签覆盖范围是什么？;是否重复执行了原数据的预处理？'],
 [1,'第一周验收与休整','用数据字典、质量检查和划分证据验收，不新增模型任务。','解释数据、标签和窗口的对应关系。','独立说明单位、参考、切窗及泄漏检查，并列出未掌握项。','休息或补最重要的缺口。','mne,split','自己的数据读取与划分脚本','数据来源和许可是什么？;哪个步骤最可能出错？;没有真实数据时能验证什么？'],
 [2,'提取频带功率特征','用 Welch PSD 提取每通道频带功率，记录频带边界与单位。','得到一个窗口的 PSD。','生成窗口×特征矩阵并解释频带积分。','比较绝对功率与相对功率。','welch','scipy.signal.welch；频带积分函数','PSD 与功率有什么区别？;频率分辨率由什么决定？;窗口长度怎样影响估计？'],
 [2,'建立传统情绪基线','在固定划分上建立 StandardScaler 与逻辑回归流水线；先预测一个预先定义的情绪目标。','跑通特征到分类输出。','报告验证指标、类别分布和多数类基线；标准化只在训练集拟合。','比较 SVM；若采用回归则报告 MAE 和均值预测基线。','sklearn','Pipeline；StandardScaler；LogisticRegression','基线是否高于多数类预测？;阈值是否提前固定？;是否使用了测试集调参？'],
 [2,'掌握 PyTorch 最小训练循环','读取 Dataset、DataLoader、forward、loss、backward 和 optimizer 的数据流。','跑通一个 batch。','解释每步形状、标签类型以及 train/eval 差异。','实现小样本过拟合检查。','torch','Dataset.__getitem__；DataLoader；nn.Module.forward','分类标签是什么 dtype？;为什么需要 zero_grad？;eval 是否关闭梯度计算？'],
 [2,'逐层理解 EEGNet','结合论文与当前固定版本源码理解时间、深度空间和可分离卷积。','找到三个核心模块。','手工预测并验证每层形状和参数量。','实现一个简化模块并与原实现核对。','eegnet,brain','记录本机 EEGNet 类所在文件及版本；forward 路径','空间卷积覆盖哪些轴？;groups 参数改变什么？;时间核长度对应多少秒？'],
 [2,'把 EEGNet 接入情绪任务','复用同一标签定义和试次划分，明确输出头和损失函数，检查 32 导 forward。','用 32 导张量通过 forward。','跑通训练并保存配置、日志和验证曲线。','做小样本过拟合检查以排查管线错误。','brain,torch','EEGNet 构造参数；分类头；CrossEntropyLoss 或回归损失','输出是类别还是评分？;模型是否偷偷改变了输入轴？;两条基线的划分是否一致？'],
 [2,'缓冲：解释模型训练问题','补训练、张量检查或日志；诊断过拟合、类别不均衡和异常损失。','定位一个尚未理解的训练步骤。','保存训练曲线并提出一个有证据的诊断。','阅读一个优化器或学习率调度实现。','torch','train/eval；训练日志；checkpoint','训练好验证差说明什么？;类别数量怎样影响基线？;加载权重后结果是否一致？'],
 [2,'第二周验收与休整','解释两条基线从输入到输出的全过程，不要求深度模型一定更好。','能说明特征基线与 EEGNet 的差别。','交付两个可运行入口和一张张量表。','补课或休息。','eegnet,sklearn','特征基线与 EEGNet 训练入口','参数量是否合理？;哪个模块你能独立修改？;未跑完实验的原因是什么？'],
 [3,'追踪完整代码调用链','从入口到数据、预处理、标签、模型、训练和指标，定位自己实际调用的源码。','找到五个关键调用位置。','记录仓库 commit、真实文件路径、输入输出和调用关系。','用断点验证一条调用链。','brain,git','实际训练入口；Dataset；模型；trainer；metric','由谁调用这个函数？;异常在哪一层最先出现？;修改此处会影响谁？'],
 [3,'验证个体化评估','模拟为一个玩家校准后预测其新试次，严格按试次划分。','完成一个被试的独立测试。','分类报告 Balanced Accuracy、Macro-F1 与混淆矩阵；回归报告 MAE。','有多会话数据时再做跨会话。','split,sklearn','固定 split 索引；评估脚本','训练见过这个玩家吗？;测试试次是否独立？;当前指标对应哪种使用场景？'],
 [3,'审查标签与数据泄漏','检查重叠窗口、归一化、特征选择、阈值、同人数据和测试集使用方式。','检查集合 ID 交集。','对每个拟合步骤说明使用的数据，并检查标签分布。','在训练内做标签打乱诊断；异常高分需排查。','sklearn,split','Pipeline.fit；split 文件；标签转换','标签是否被当成输入？;阈值是否看过测试数据？;重叠窗口会虚增有效样本数吗？'],
 [3,'分析失败试次和伪迹','按试次、被试及信号质量汇总错误，避免把相邻窗口当独立证据。','检查三个错误案例。','比较正确与错误样本的波形、PSD 和标签情况。','检查模型是否依赖明显肌电或眼电。','mne,welch','预测表关联 trial_id；质量标记','错误是否集中于某个被试？;标签是否可能不稳定？;高分能否来自伪迹？'],
 [3,'跨玩家泛化小实验','将未见被试留出测试。计算资源不足时只完成划分检查和小规模实验。','生成无被试交集的划分。','跑一个留出被试并说明与个体化结果的区别。','进行多个留出被试评估并报告波动。','split','GroupKFold 或 LeaveOneGroupOut，groups=subject_id','模型见过测试玩家吗？;小规模结果能推广到所有玩家吗？;哪些个体差异需要校准？'],
 [3,'缓冲：整理可复现实验','固定数据版本、代码 commit、预处理、种子和划分，补齐缺失实验记录。','补齐一项实验元数据。','用相同协议比较两条基线，记录限制。','使用多个种子衡量训练波动。','git,sklearn','实验配置；git diff；结果表','差异来自模型还是划分？;随机种子解决所有不确定性吗？;别人如何重跑这一结果？'],
 [3,'第三周验收与休整','用证据说明当前模型适用范围，允许结论为效果不足。','完成泄漏检查表。','交付代码地图和评估报告，明确跨场景限制。','补课或休息。','split,git','评估报告与代码地图','哪些结果足够可信？;公开视频刺激数据能代表游戏吗？;最需要补充哪类数据？'],
 [4,'设计游戏脑电时间对齐','先定义脑电时间戳、游戏事件和自评的关系；没有游戏数据时构造事件序列演示接口。','写出三类时间信息。','说明时钟偏差、事件延迟、标签时间范围和缺失处理。','模拟偏移并验证对齐误差。','mne','annotations；事件表；时间戳对齐函数','设备是否共用时钟？;自评反映哪个时间段？;事件是标签还是辅助信息？'],
 [4,'实现顺序回放与滑窗','按时间顺序逐块读取记录，用缓冲区构造窗口，不读取未来样本。','回放一个试次。','记录窗口长度、步长、覆盖范围与输出时间。','测试数据不足、断流与重复包。','torch,mne','ring buffer；窗口构造；模型推理','每次预测用了多久的数据？;相邻预测共享多少样本？;第一条结果何时产生？'],
 [4,'检查在线预处理的因果性','对比离线零相位处理与在线有状态滤波；明确公开预处理数据的在线验证限制。','标出所有可能使用未来数据的步骤。','演示 sosfilt 状态跨数据块传递，并记录差异。','使用原始记录比较离线与因果处理的模型效果。','filter,mne','sosfilt 的 zi/zf；在线标准化策略','零相位滤波用了未来数据吗？;每块重置滤波会怎样？;整段归一化能直接在线用吗？'],
 [4,'平滑输出与延迟评估','比较原始预测与仅使用当前及过去输出的平滑方法；不把模型置信度当作真实情绪强度。','画出预测时间序列。','记录窗口等待、推理与平滑延迟，并解释响应速度。','比较不同平滑长度的抖动与延迟。','torch','inference_mode；EMA 或后向移动平均；计时','平滑引入多少延迟？;低置信度时怎样表达？;处理速度能跟上采集吗？'],
 [4,'提出并实施一个优化假设','选择一个变量，例如频带、窗口长度或时间卷积核；在验证集选方案。','写出假设和预期影响。','实现改动并检查形状、训练和回放流程。','比较计算成本；避免一次堆叠多个模块。','brain,git','配置差异；模型模块；git diff','为什么这个改动可能有效？;哪些条件保持一致？;是否反复查看了测试集？'],
 [4,'完成公平对照实验','比较原始与修改方案；测试窗口变化时仍用固定原始试次划分。','完成一组对照。','记录指标、运行成本和限制；无提升也可通过。','多种子或多被试复核结论。','sklearn,split','基线与改进配置；评估结果表','指标差异是否稳定？;有没有牺牲延迟或可解释性？;什么证据能否定你的假设？'],
 [4,'缓冲：阅读陌生代码并修复问题','用未读过的相关模块练习定位入口、输入输出和测试，补齐一个真实问题。','找到入口并说明输入输出。','提交一个小改动及验证记录。','解释上游版本变更影响。','git,brain','新模块；相关测试；git diff','新模块由谁调用？;如何复现问题？;修复是否影响其他输入？'],
 [4,'完善复现与接手文档','整理环境、数据许可、标签、训练、评估和回放说明。','写清运行命令。','从说明重跑一个小实验；标明未实现和未验证部分。','在新环境复现。','git','README；依赖版本；配置；错误清单','哪些文件是生成产物？;数据未获授权时怎么演示？;新人第一步应该运行什么？'],
 [4,'总验收与下一步','按运行、阅读、解释、修改、验证五项能力复盘，准备真实游戏数据接入清单。','完成能力自评。','交付最终报告，列出设备、通道、采样、标签与同步待确认项。','按真实项目制定后续计划。','deap,git','最终报告；真实数据接入清单','哪些能力有独立完成证据？;真实游戏数据与教学数据有哪些差异？;下一步最小验证是什么？']
];

export const taskSeed = rows.map(r => r.slice(0,7));
export function lesson(day) {
  const r = rows[day-1];
  return { resources:r[6].split(',').map(k=>resources[k]), code:r[7], questions:r[8].split(';') };
}

export function migrateCurriculum(state, freshTasks) {
  if (state.meta?.curriculumVersion === curriculumVersion) return state;
  const oldTasks = state.tasks || [];
  const updated = { ...state, tasks:freshTasks, meta:{...state.meta, curriculumVersion},
    curriculumHistory:[...(state.curriculumHistory || []), { migratedAt:new Date().toISOString(), tasks:oldTasks, reviews:state.reviews || [] }], reviews:[] };
  if (oldTasks[0]) updated.tasks[0] = {...oldTasks[0], ...freshTasks[0], status:oldTasks[0].status,
    evidenceType:oldTasks[0].evidenceType || '', evidence:oldTasks[0].evidence || '', reflection:oldTasks[0].reflection || '', actualMinutes:oldTasks[0].actualMinutes || 0};
  return updated;
}
