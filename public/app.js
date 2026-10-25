const $ = (selector, root = document) => root.querySelector(selector);
const app = $("#app");
const toast = $("#toast");
const staticMode = location.hostname.endsWith("github.io") || location.protocol === "file:";
const storageKey = "eeg-code-learning-state-v1";

const weeks = [
  { title: "跑通并解释数据流", focus: "MNE、Braindecode、Raw、Epochs、Windows、Tensor", outcome: "一份数据流图、张量表和可复现基线" },
  { title: "读懂并重写 EEGNet", focus: "卷积、空间滤波、参数量、forward、单元测试", outcome: "支持 32 导的 MyEEGNet 和结构说明" },
  { title: "建立可信评估", focus: "CSP、LDA、MOABB、跨会话、跨被试、数据泄漏", outcome: "传统基线与 EEGNet 的公平对比" },
  { title: "优化与模拟接手", focus: "32 导适配、消融、日志、Git diff、复现文档", outcome: "一次可信优化和完整接手报告" }
];

const taskSeed = [
  [1,"建立可复现环境","确认 Python、PyTorch、MNE、Braindecode 版本并完成最小导入测试。","记录版本和安装命令。","运行最小张量与 MNE Raw 测试，保存输出。","建立 requirements 或环境锁定文件，并写排障说明。"],
  [1,"认识 EEG 数据结构","用 MNE 加载示例数据，识别通道、采样率、时间轴和事件。","打印数据形状与通道列表。","画出 Raw 到 Epochs 的转换过程。","解释 32 导数据中通道顺序错误的后果。"],
  [1,"完成预处理链","执行带通滤波、重采样和事件切分，记录每一步变化。","跑通官方预处理示例。","比较处理前后的 PSD 和数据形状。","测试两组滤波范围并解释差异。"],
  [1,"跑通 Braindecode 基线","运行官方运动想象示例，保存配置、日志与结果。","成功进入训练阶段。","完整训练一次并保存指标。","更换一个受试者并比较结果。"],
  [1,"追踪训练调用链","定位数据加载、窗口切分、模型创建、损失与评估入口。","找出五个关键文件或对象。","画出完整调用链并标注输入输出。","进入两个核心类的源码解释关键方法。"],
  [1,"整理第一周工程","清理脚本、固定配置、补齐运行说明和张量尺寸表。","整理当天代码与笔记。","从干净终端重新运行基线。","添加一个自动检查数据形状的测试。"],
  [1,"第一周验收","脱离教程解释数据流，并根据证据判断是否进入下一周。","口头解释 Raw、Epochs、Windows。","完成数据流图、基线和张量表。","限时阅读一个陌生示例并画出调用链。"],
  [2,"阅读 EEGNet 原始结构","对照论文和小型实现拆解时间卷积、空间卷积与可分离卷积。","标出三个主要模块。","记录每层核大小、输出形状和参数量。","解释各模块对应的 EEG 归纳偏置。"],
  [2,"追踪 Braindecode EEGNet","定位构造参数和 forward 路径，理解 n_chans、n_times、n_outputs。","找到模型定义。","解释所有关键参数来源。","比较原始实现与 Braindecode 实现差异。"],
  [2,"实现时间特征模块","用 PyTorch 独立实现 EEGNet 第一部分并测试形状。","完成时间卷积 forward。","添加 BatchNorm、约束和形状测试。","计算感受野及其对应时间长度。"],
  [2,"实现空间特征模块","实现跨通道深度卷积，支持任意通道数。","支持 32 通道输入。","完成空间卷积与池化测试。","验证通道数改变时不依赖硬编码。"],
  [2,"完成 MyEEGNet","连接分类头并避免硬编码 flatten 维度。","随机输入可以 forward。","输出形状严格为 batch 乘 classes。","加入模型摘要和参数量比较。"],
  [2,"训练自写模型","把 MyEEGNet 接入第一周数据管线并训练。","完成一个小样本过拟合测试。","完成一次正常训练并保存曲线。","比较框架实现与自写实现性能。"],
  [2,"第二周验收","代码走读 MyEEGNet，解释每层作用并通过单元测试。","所有形状测试通过。","能够独立解释和修改 32 导输入。","修改一个模块并预测、验证影响。"],
  [3,"建立 CSP 加 LDA 基线","使用相同数据和划分实现传统运动想象基线。","跑通 CSP 特征提取。","保存 LDA 结果与混淆矩阵。","可视化 CSP 模式并解释含义。"],
  [3,"理解 MOABB 抽象","阅读 dataset、paradigm、pipeline 和 evaluation 的调用关系。","找到四个核心抽象。","画出 MOABB 评估调用链。","定位一次评估的缓存和结果保存逻辑。"],
  [3,"完成被试内评估","用一致的数据预处理比较 CSP 与 EEGNet。","跑通一个被试。","报告 Balanced Accuracy 和 Kappa。","加入多随机种子并统计波动。"],
  [3,"完成跨会话评估","确保训练与测试来自不同 session，检查泄漏。","确认 session 划分。","完成评估并解释性能差异。","写出泄漏检查清单。"],
  [3,"完成跨被试评估","用未见被试测试泛化能力，记录每个被试结果。","跑通小规模跨被试。","报告均值、标准差和失败被试。","分析个体差异可能来源。"],
  [3,"统一实验记录","为配置、随机种子、commit 和指标建立固定记录格式。","补齐已有实验元数据。","所有结果能追溯到代码版本。","生成一张自动对比表。"],
  [3,"第三周验收","复核数据划分与指标，给出哪个模型更可信的结论。","完成泄漏检查。","完成公平对比报告。","重新运行一个结果验证可复现性。"],
  [4,"定义 32 导接口","确定通道名称、顺序、采样率、窗口、标签与缺失导处理。","写出输入契约。","实现数据检查函数。","模拟错序、缺导和异常振幅测试。"],
  [4,"接入 32 导数据","把数据转换成统一结构并跑通预处理和模型 forward。","加载一个样本。","跑通完整数据管线。","生成通道质量与类别分布报告。"],
  [4,"建立优化基线","冻结数据划分和基线配置，选择唯一优化假设。","保存基线配置。","运行多个随机种子。","计算参数量、训练时间与推理时间。"],
  [4,"实施最小优化","只改变一个变量，如卷积核、窗口、频带或轻量注意力。","完成代码修改。","保证测试通过并完成训练。","解释改动如何影响特征提取。"],
  [4,"完成消融实验","比较基线与优化版本，保持其他条件一致。","完成一次对照。","报告均值、波动和失败案例。","加入第二数据划分验证结论。"],
  [4,"陌生代码限时阅读","选择未读示例，限时定位入口、数据、模型、训练和评估。","30 分钟找到入口与模型。","两小时完成调用链。","提交一个小改动并补测试。"],
  [4,"编写复现文档","从零写环境、数据、训练、评估和常见错误说明。","补齐运行命令。","让全部实验可按文档复现。","在新目录模拟干净复现。"],
  [4,"最终接手演练","从新需求出发完成一次修改、测试、实验、解释和 Git 提交。","完成需求拆解。","交付代码、测试与结果。","做一次自我代码审查并修复问题。"],
  [4,"总验收与后续路线","检查五项能力，整理未掌握内容和后续项目跟进方案。","完成能力自评。","提交最终报告和项目归档。","制定下一个月的真实项目贡献计划。"]
];

function defaultTasks() {
  return taskSeed.map((row, index) => ({
    id: `day-${index + 1}`, day: index + 1, week: row[0], title: row[1], brief: row[2],
    minimum: row[3], standard: row[4], stretch: row[5], status: "not-started",
    evidenceType: "", evidence: "", reflection: "", actualMinutes: 0, adjustment: null
  }));
}

function defaultState() {
  return {
    profile: null,
    tasks: defaultTasks(),
    codeMaps: [], experiments: [], reviews: [],
    settings: { morning: "09:00", evening: "21:30", remindersEnabled: false },
    meta: { version: 1, savedAt: null }
  };
}

let state = defaultState();
let view = "today";
let selectedLevel = "standard";
let modal = null;
let saveTimer;

function dateKey(date) { return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
function addDays(key, days) { const d = new Date(`${key}T12:00:00`); d.setDate(d.getDate() + days); return dateKey(d); }
function todayKey() { return dateKey(new Date()); }
function currentDay() {
  if (!state.profile) return 1;
  const start = new Date(`${state.profile.startDate}T12:00:00`);
  const now = new Date(`${todayKey()}T12:00:00`);
  return Math.max(1, Math.min(30, Math.floor((now - start) / 86400000) + 1));
}
function currentTask() { return state.tasks[currentDay() - 1]; }
function esc(value = "") { return String(value).replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c])); }
function completedCount() { return state.tasks.filter(t => t.status === "complete").length; }
function notify(message) { toast.textContent = message; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 2200); }
function formatSaved() { return state.meta?.savedAt ? new Date(state.meta.savedAt).toLocaleString("zh-CN", { hour12: false }) : "尚未保存"; }

async function save(immediate = false) {
  clearTimeout(saveTimer);
  const run = async () => {
    if (staticMode) {
      state.meta = { ...(state.meta || {}), savedAt: new Date().toISOString() };
      localStorage.setItem(storageKey, JSON.stringify(state));
      const label = $("#save-state");
      if (label) label.textContent = `已保存在本机 ${formatSaved()}`;
      return;
    }
    const response = await fetch("/api/state", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(state) });
    if (!response.ok) throw new Error("保存失败");
    state = (await response.json()).state;
    const label = $("#save-state");
    if (label) label.textContent = `已保存 ${formatSaved()}`;
  };
  if (immediate) return run();
  saveTimer = setTimeout(() => run().catch(() => notify("保存失败，请检查本地服务")), 450);
}

async function load() {
  if (staticMode) {
    state = JSON.parse(localStorage.getItem(storageKey) || "null") || defaultState();
    render();
    return;
  }
  const response = await fetch("/api/state");
  const data = await response.json();
  state = data.state || defaultState();
  render();
}

function nav() {
  const items = [["today","今日执行"],["roadmap","30 天路线"],["codemap","代码地图"],["experiments","实验记录"],["review","周复盘"],["settings","设置与提醒"]];
  return `<aside class="sidebar"><div class="brand"><strong>EEG CODE LAB</strong><span>32 导代码接手训练</span></div><nav class="nav">${items.map(([id,label]) => `<button data-view="${id}" class="${view === id ? "active" : ""}">${label}</button>`).join("")}</nav><div class="sidebar-meta"><div>第 ${currentDay()} / 30 天</div><div id="save-state">已保存 ${formatSaved()}</div></div></aside>`;
}

function header(title, subtitle, actions = "") {
  return `<header class="topbar"><div><h1>${title}</h1><p>${subtitle}</p></div><div class="actions">${actions}</div></header>`;
}

function summary() {
  const day = currentDay(); const week = Math.ceil(day / 7); const done = completedCount();
  return `<section class="band"><div class="summary-grid"><div class="summary-cell lead"><small>当前里程碑</small><strong>${weeks[Math.min(week - 1, 3)].title}</strong><div class="progress"><span style="width:${done / 30 * 100}%"></span></div></div><div class="summary-cell"><small>计划进度</small><strong>${day}/30</strong></div><div class="summary-cell"><small>已验收任务</small><strong>${done}</strong></div><div class="summary-cell"><small>今日档位</small><strong>${state.profile?.dailyMinutes || 120}<small> 分钟</small></strong></div></div></section>`;
}

function recommendation(task) {
  if (!task.adjustment) return `<p class="muted">提交今日状态后，系统才会提出明日调整建议。任何调整都不会自动生效。</p>`;
  return `<div class="suggestion"><strong>待确认的调整建议</strong><div>${esc(task.adjustment.message)}</div><div class="suggestion-actions"><button class="btn primary" data-adjust="accept">接受建议</button><button class="btn" data-adjust="reject">保持原计划</button></div></div>`;
}

function todayView() {
  const task = currentTask();
  return `${header("今日执行", `第 ${task.day} 天 · 第 ${task.week} 周`, `<button class="btn" data-backup>生成快照</button><button class="btn" data-export>导出数据</button>`)}${summary()}<section class="band"><div class="today-layout"><article class="task-sheet"><div class="task-kicker">TODAY'S CORE OUTCOME</div><h2>${esc(task.title)}</h2><p>${esc(task.brief)}</p><div class="level-switch">${[["minimum","最低完成","约 30 分钟"],["standard","标准完成","约 60 至 120 分钟"],["stretch","扩展完成","时间充足时"]].map(([id,label,time]) => `<button data-level="${id}" class="${selectedLevel === id ? "active" : ""}"><strong>${label}</strong><span>${time}<br>${esc(task[id])}</span></button>`).join("")}</div><div class="field-grid"><div class="field"><label>成果证据类型</label><select id="evidence-type"><option value="">请选择</option>${["代码与 Git commit","运行日志","调用链或张量表","实验结果","结构化笔记","测试报告"].map(x => `<option ${task.evidenceType === x ? "selected" : ""}>${x}</option>`).join("")}</select></div><div class="field"><label>实际投入时间（分钟）</label><input id="actual-minutes" type="number" min="0" max="720" value="${task.actualMinutes || ""}"></div><div class="field full"><label>证据位置或摘要</label><textarea id="evidence" placeholder="填写文件路径、commit、日志位置或结果摘要">${esc(task.evidence)}</textarea></div><div class="field full"><label>今天仍不能解释的内容</label><textarea id="reflection" placeholder="这会成为下一次复盘的输入">${esc(task.reflection)}</textarea></div></div></article><aside class="side-panel"><div class="panel-section"><h3>今日可用时间</h3><div class="time-options">${[30,60,120,180].map(n => `<button data-time="${n}" class="${state.profile.dailyMinutes === n ? "selected" : ""}">${n === 180 ? "180+" : n} 分钟</button>`).join("")}</div></div><div class="panel-section"><h3>执行状态</h3><div class="status-list">${[["not-started","未开始"],["active","进行中"],["partial","部分完成"],["blocked","阻塞"],["complete","完成并验收"],["skipped","跳过"]].map(([id,label]) => `<button data-status="${id}" class="${task.status === id ? "selected" : ""}">${label}</button>`).join("")}</div></div><div class="panel-section"><h3>计划调整</h3>${recommendation(task)}</div></aside></div></section>`;
}

function roadmapView() {
  const day = currentDay();
  return `${header("30 天路线", "四周里程碑稳定，每日任务根据实际反馈滚动调整")}<section class="band"><div class="week-grid">${weeks.map((w,i) => `<article class="week ${Math.ceil(day / 7) === i + 1 ? "current" : ""}"><small>第 ${i + 1} 周</small><h3>${w.title}</h3><p>${w.focus}</p><b>周验收：${w.outcome}</b></article>`).join("")}</div></section><section class="band"><div class="band-title"><div><h2>每日核心成果</h2><p>扩展任务不会形成逾期债务</p></div></div><div class="table-wrap"><table><thead><tr><th>天</th><th>核心成果</th><th>周</th><th>状态</th><th>证据</th></tr></thead><tbody>${state.tasks.map(t => `<tr><td>${t.day}</td><td><strong>${esc(t.title)}</strong><br><span class="muted">${esc(t.standard)}</span></td><td>W${t.week}</td><td><span class="tag">${statusLabel(t.status)}</span></td><td>${esc(t.evidence || "尚未记录")}</td></tr>`).join("")}</tbody></table></div></section>`;
}

function statusLabel(status) { return ({"not-started":"未开始","active":"进行中","partial":"部分完成","blocked":"阻塞","complete":"已验收","skipped":"已跳过"})[status] || status; }

function codeMapView() {
  return `${header("代码地图", "训练快速接手陌生 EEG 仓库的能力", `<button class="btn primary" data-open="codemap">新增代码地图</button>`)}<section class="band">${state.codeMaps.length ? `<div class="table-wrap"><table><thead><tr><th>仓库</th><th>入口与数据</th><th>模型与训练</th><th>当前疑问</th></tr></thead><tbody>${state.codeMaps.map(m => `<tr><td><strong>${esc(m.repo)}</strong><br><span class="muted">${esc(m.commit)}</span></td><td>${esc(m.entry)}<br>${esc(m.data)}</td><td>${esc(m.model)}<br>${esc(m.training)}</td><td>${esc(m.unknown)}</td></tr>`).join("")}</tbody></table></div>` : `<div class="empty">还没有代码地图。第一次运行 Braindecode 后建立第一张。</div>`}</section>`;
}

function experimentsView() {
  return `${header("实验记录", "每个结果都要能追溯到数据划分、配置与代码版本", `<button class="btn primary" data-open="experiment">记录实验</button>`)}<section class="band">${state.experiments.length ? `<div class="table-wrap"><table><thead><tr><th>实验</th><th>数据与划分</th><th>模型</th><th>指标</th><th>追溯</th></tr></thead><tbody>${state.experiments.map(e => `<tr><td><strong>${esc(e.name)}</strong><br><span class="muted">${esc(e.date)}</span></td><td>${esc(e.dataset)}<br>${esc(e.split)}</td><td>${esc(e.model)}<br><span class="muted">seed ${esc(e.seed)}</span></td><td>${esc(e.metrics)}</td><td>${esc(e.commit)}<br>${esc(e.notes)}</td></tr>`).join("")}</tbody></table></div>` : `<div class="empty">还没有实验记录。完成第一个基线后从这里建立对照。</div>`}</section>`;
}

function reviewView() {
  const currentWeek = Math.min(4, Math.ceil(currentDay() / 7));
  const review = state.reviews.find(r => r.week === currentWeek) || {};
  return `${header("周复盘", `第 ${currentWeek} 周验收，不通过时只补关键前置能力`)}<section class="band"><div class="task-sheet"><div class="review-grid"><div class="field"><label>本周真正完成的成果</label><textarea id="review-wins">${esc(review.wins)}</textarea></div><div class="field"><label>仍无法独立解释的内容</label><textarea id="review-gaps">${esc(review.gaps)}</textarea></div><div class="field"><label>主要阻塞与根因</label><textarea id="review-blockers">${esc(review.blockers)}</textarea></div><div class="field"><label>下周应保留或删减什么</label><textarea id="review-next">${esc(review.next)}</textarea></div><div class="field"><label>里程碑是否通过</label><select id="review-result"><option value="pending">待验收</option><option value="passed" ${review.result === "passed" ? "selected" : ""}>通过</option><option value="conditional" ${review.result === "conditional" ? "selected" : ""}>有条件通过</option><option value="failed" ${review.result === "failed" ? "selected" : ""}>未通过</option></select></div><div class="field"><label>验收证据</label><input id="review-evidence" value="${esc(review.evidence)}" placeholder="文件、commit 或报告位置"></div></div><div class="modal-actions"><button class="btn primary" data-save-review>保存复盘</button></div></div></section>`;
}

function settingsView() {
  return `${header("设置与提醒", "网站保存记录，Codex 根据这里的节奏发送提醒")}<section class="band"><div class="task-sheet"><div class="field-grid"><div class="field"><label>计划开始日期</label><input id="setting-start" type="date" value="${state.profile.startDate}"></div><div class="field"><label>默认每日时间</label><select id="setting-minutes">${[30,60,120,180].map(n => `<option value="${n}" ${state.profile.dailyMinutes === n ? "selected" : ""}>${n === 180 ? "180+" : n} 分钟</option>`).join("")}</select></div><div class="field"><label>开始提醒</label><input id="setting-morning" type="time" value="${state.settings.morning}"></div><div class="field"><label>复盘提醒</label><input id="setting-evening" type="time" value="${state.settings.evening}"></div><div class="field full"><label>提醒工作方式</label><div class="suggestion">Codex 发送今天的核心成果和最低完成标准。晚间反馈后，系统生成调整建议，但只有你确认后才修改后续任务。</div></div></div><div class="modal-actions"><button class="btn" data-backup>生成本地快照</button><button class="btn" data-export>导出 JSON</button><button class="btn primary" data-save-settings>保存设置</button></div></div></section>`;
}

function setupModal() {
  return `<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true"><h2>启动 30 天 EEG 代码训练</h2><p>先确定开始日期和常用时间档位。之后每天仍可临时切换，不会破坏周里程碑。</p><div class="field-grid"><div class="field"><label>开始日期</label><input id="setup-date" type="date" value="${todayKey()}"></div><div class="field"><label>默认投入时间</label><select id="setup-minutes"><option value="30">30 分钟</option><option value="60">60 分钟</option><option value="120" selected>120 分钟</option><option value="180">180 分钟以上</option></select></div><div class="field full"><label>当前基础</label><select id="setup-level"><option>会 Python，深度学习基础较弱</option><option>会 Python 和 PyTorch 基础</option><option>做过深度学习项目，EEG 入门</option><option>已有 EEG 经验，需要强化工程阅读</option></select></div></div><div class="modal-actions"><button class="btn primary" data-start>生成计划并开始</button></div></section></div>`;
}

function dataModal(type) {
  if (type === "codemap") return `<div class="modal-backdrop"><section class="modal"><h2>新增代码地图</h2><p>记录模块关系，不复制大段源码。</p><div class="field-grid">${[["map-repo","仓库与路径"],["map-commit","分支或 commit"],["map-entry","运行入口"],["map-data","数据加载与预处理"],["map-model","模型定义"],["map-training","训练与评估"],["map-unknown","仍不理解"]].map(([id,label]) => `<div class="field ${id === "map-unknown" ? "full" : ""}"><label>${label}</label><input id="${id}"></div>`).join("")}</div><div class="modal-actions"><button class="btn" data-close>取消</button><button class="btn primary" data-save-map>保存</button></div></section></div>`;
  if (type === "experiment") return `<div class="modal-backdrop"><section class="modal"><h2>记录实验</h2><p>没有数据划分和代码版本的指标不进入正式对比。</p><div class="field-grid">${[["exp-name","实验名称"],["exp-date","日期",todayKey()],["exp-dataset","数据集与受试者"],["exp-split","划分方式"],["exp-model","模型与关键配置"],["exp-seed","随机种子"],["exp-metrics","核心指标"],["exp-commit","Git commit"],["exp-notes","结论与风险"]].map(([id,label,value=""]) => `<div class="field ${id === "exp-notes" ? "full" : ""}"><label>${label}</label><input id="${id}" value="${value}"></div>`).join("")}</div><div class="modal-actions"><button class="btn" data-close>取消</button><button class="btn primary" data-save-exp>保存</button></div></section></div>`;
  return "";
}

function render() {
  if (!state.profile) { app.innerHTML = `<main class="main">${header("EEG 代码学习台", "30 天从运行到优化的项目接手训练")}</main>${setupModal()}`; bind(); return; }
  const views = { today: todayView, roadmap: roadmapView, codemap: codeMapView, experiments: experimentsView, review: reviewView, settings: settingsView };
  app.innerHTML = `<div class="app-shell">${nav()}<main class="main">${views[view]()}</main></div>${modal ? dataModal(modal) : ""}`;
  bind();
}

function makeSuggestion(task, status) {
  const next = state.tasks[task.day];
  if (!next || status === "complete" || status === "active" || status === "not-started") return null;
  if (status === "partial") return { type: "carry", message: `建议明天先用 30 分钟完成“${task.title}”剩余标准，再开始原任务“${next.title}”。接受后会把补做要求加入明日说明。` };
  if (status === "blocked") return { type: "debug", message: `建议明天先建立限时 60 分钟的排障任务；若仍未解决，使用官方示例或小样本继续主线，避免阻塞吞掉整周。` };
  return { type: "defer", message: `建议把“${task.title}”移到本周验收日前，并保持明日原任务不变。扩展内容不顺延。` };
}

function bind() {
  document.querySelectorAll("[data-view]").forEach(b => b.onclick = () => { view = b.dataset.view; render(); });
  document.querySelectorAll("[data-level]").forEach(b => b.onclick = () => { selectedLevel = b.dataset.level; render(); });
  document.querySelectorAll("[data-time]").forEach(b => b.onclick = () => { state.profile.dailyMinutes = Number(b.dataset.time); save(); render(); });
  document.querySelectorAll("[data-status]").forEach(b => b.onclick = () => {
    const task = currentTask(); task.status = b.dataset.status;
    task.evidenceType = $("#evidence-type")?.value || task.evidenceType;
    task.evidence = $("#evidence")?.value || ""; task.reflection = $("#reflection")?.value || "";
    task.actualMinutes = Number($("#actual-minutes")?.value || 0);
    if (task.status === "complete" && (!task.evidenceType || !task.evidence)) { notify("完成验收前需要填写成果证据"); task.status = "active"; }
    task.adjustment = makeSuggestion(task, task.status); save(); render();
  });
  ["#evidence-type","#evidence","#reflection","#actual-minutes"].forEach(sel => { const el = $(sel); if (el) el.onchange = () => { const t = currentTask(); t.evidenceType = $("#evidence-type").value; t.evidence = $("#evidence").value; t.reflection = $("#reflection").value; t.actualMinutes = Number($("#actual-minutes").value || 0); save(); }; });
  document.querySelectorAll("[data-adjust]").forEach(b => b.onclick = () => {
    const task = currentTask(); const accepted = b.dataset.adjust === "accept"; const next = state.tasks[task.day];
    if (accepted && next && task.adjustment) next.brief = `调整任务：${task.adjustment.message} 原计划：${next.brief}`;
    task.adjustment = null; save(); render(); notify(accepted ? "调整已确认" : "已保持原计划");
  });
  document.querySelectorAll("[data-open]").forEach(b => b.onclick = () => { modal = b.dataset.open; render(); });
  document.querySelectorAll("[data-close]").forEach(b => b.onclick = () => { modal = null; render(); });
  $("[data-start]")?.addEventListener("click", async () => { state.profile = { startDate: $("#setup-date").value, dailyMinutes: Number($("#setup-minutes").value), level: $("#setup-level").value }; await save(true); render(); notify("30 天计划已启动"); });
  document.querySelectorAll("[data-backup]").forEach(b => b.onclick = async () => {
    await save(true);
    if (staticMode) { localStorage.setItem(`${storageKey}-backup-${Date.now()}`, JSON.stringify(state)); notify("浏览器本地快照已保存"); return; }
    const r = await fetch("/api/backup", { method: "POST" }); const data = await r.json(); notify(data.backup ? `快照已保存：${data.backup.name}` : "请先保存计划");
  });
  document.querySelectorAll("[data-export]").forEach(b => b.onclick = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "eeg-learning-backup.json"; link.click(); URL.revokeObjectURL(link.href);
  });
  $("[data-save-map]")?.addEventListener("click", () => { state.codeMaps.push({ repo:$("#map-repo").value, commit:$("#map-commit").value, entry:$("#map-entry").value, data:$("#map-data").value, model:$("#map-model").value, training:$("#map-training").value, unknown:$("#map-unknown").value }); modal = null; save(); render(); });
  $("[data-save-exp]")?.addEventListener("click", () => { state.experiments.push({ name:$("#exp-name").value, date:$("#exp-date").value, dataset:$("#exp-dataset").value, split:$("#exp-split").value, model:$("#exp-model").value, seed:$("#exp-seed").value, metrics:$("#exp-metrics").value, commit:$("#exp-commit").value, notes:$("#exp-notes").value }); modal = null; save(); render(); });
  $("[data-save-review]")?.addEventListener("click", () => { const week = Math.min(4, Math.ceil(currentDay()/7)); const next = { week, wins:$("#review-wins").value, gaps:$("#review-gaps").value, blockers:$("#review-blockers").value, next:$("#review-next").value, result:$("#review-result").value, evidence:$("#review-evidence").value }; state.reviews = state.reviews.filter(r => r.week !== week); state.reviews.push(next); save(); notify("周复盘已保存"); });
  $("[data-save-settings]")?.addEventListener("click", () => { state.profile.startDate = $("#setting-start").value; state.profile.dailyMinutes = Number($("#setting-minutes").value); state.settings.morning = $("#setting-morning").value; state.settings.evening = $("#setting-evening").value; save(); render(); notify("设置已保存"); });
}

load().catch(error => { app.innerHTML = `<main class="main"><div class="empty">无法连接本地数据服务：${esc(error.message)}</div></main>`; });
