import { weeks, taskSeed, lesson, curriculumVersion, migrateCurriculum } from './curriculum.mjs';
const $ = (selector, root = document) => root.querySelector(selector);
const app = $("#app");
const toast = $("#toast");
const staticMode = location.hostname.endsWith("github.io") || location.protocol === "file:";
const storageKey = "eeg-code-learning-state-v1";

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
    meta: { version: 2, curriculumVersion, savedAt: null }
  };
}

let state = defaultState();
let view = "today";
let selectedLevel = "standard";
let modal = null;
let selectedTaskDay = null;
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
function currentTask() { return state.tasks[(selectedTaskDay || currentDay()) - 1]; }
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
    state = migrateCurriculum(state, defaultTasks());
    await save(true);
    render();
    return;
  }
  const response = await fetch("/api/state");
  const data = await response.json();
  state = migrateCurriculum(data.state || defaultState(), defaultTasks());
  await save(true);
  render();
}

function nav() {
  const items = [["today","今日执行"],["roadmap","30 天路线"],["codemap","代码地图"],["experiments","实验记录"],["review","周复盘"],["settings","设置与提醒"]];
  return `<aside class="sidebar"><div class="brand"><strong>EEG CODE LAB</strong><span>游戏脑电情绪识别</span></div><nav class="nav">${items.map(([id,label]) => `<button data-view="${id}" class="${view === id ? "active" : ""}">${label}</button>`).join("")}</nav><div class="sidebar-meta"><div>第 ${currentDay()} / 30 天</div><div id="save-state">已保存 ${formatSaved()}</div></div></aside>`;
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


function lessonPanel(day) {
  const info = lesson(day);
  return `<section class="lesson"><h3>今日学习资料与代码入口</h3><div>${info.resources.map(r=>`<a href="${r.url}" target="_blank" rel="noopener noreferrer">${esc(r.label)}</a>`).join(' · ')}</div><p><strong>阅读入口：</strong>${esc(info.code)}</p><p class="muted">第1天记录实际安装版本与仓库 commit；后续按该版本定位源码。没有获准使用的真实数据时，用合成信号验证接口，不报告情绪识别效果。</p><h3>学完后回答</h3><ol>${info.questions.map(q=>`<li>${esc(q)}</li>`).join('')}</ol></section>`;
}

function todayView() {
  const task = currentTask();
  return `${header("今日执行", `第 ${task.day} 天 · 第 ${task.week} 周`, `<button class="btn" data-backup>生成快照</button><button class="btn" data-export>导出数据</button>`)}${summary()}<section class="band"><div class="today-layout"><article class="task-sheet"><div class="task-kicker">TODAY'S CORE OUTCOME</div><h2>${esc(task.title)}</h2><p>${esc(task.brief)}</p>${lessonPanel(task.day)}<div class="level-switch">${[["minimum","最低完成","约 30 分钟"],["standard","标准完成","约 60 至 120 分钟"],["stretch","扩展完成","时间充足时"]].map(([id,label,time]) => `<button data-level="${id}" class="${(task.completionLevel || selectedLevel) === id ? "active" : ""}"><strong>${label}</strong><span>${time}<br>${esc(task[id])}</span></button>`).join("")}</div><div class="field-grid"><div class="field"><label>成果证据类型</label><select id="evidence-type"><option value="">请选择</option>${["代码与 Git commit","运行日志","调用链或张量表","实验结果","结构化笔记","测试报告"].map(x => `<option ${task.evidenceType === x ? "selected" : ""}>${x}</option>`).join("")}</select></div><div class="field"><label>实际投入时间（分钟）</label><input id="actual-minutes" type="number" min="0" max="720" value="${task.actualMinutes || ""}"></div><div class="field full"><label>证据位置或摘要</label><textarea id="evidence" placeholder="填写文件路径、commit、日志位置或结果摘要">${esc(task.evidence)}</textarea></div><div class="field full"><label>今天仍不能解释的内容</label><textarea id="reflection" placeholder="这会成为下一次复盘的输入">${esc(task.reflection)}</textarea></div></div></article><aside class="side-panel"><div class="panel-section"><h3>今日可用时间</h3><div class="time-options">${[30,60,120,180].map(n => `<button data-time="${n}" class="${state.profile.dailyMinutes === n ? "selected" : ""}">${n === 180 ? "180+" : n} 分钟</button>`).join("")}</div></div><div class="panel-section"><h3>执行状态</h3><div class="status-list">${[["not-started","未开始"],["active","进行中"],["partial","部分完成"],["blocked","阻塞"],["complete","完成并验收"],["skipped","跳过"]].map(([id,label]) => `<button data-status="${id}" class="${task.status === id ? "selected" : ""}">${label}</button>`).join("")}</div></div><div class="panel-section"><h3>计划调整</h3>${recommendation(task)}</div></aside></div></section>`;
}

function roadmapView() {
  const day = currentDay();
  return `${header("30 天路线", "四周里程碑稳定，每日任务根据实际反馈滚动调整")}<section class="band"><div class="week-grid">${weeks.map((w,i) => `<article class="week ${Math.ceil(day / 7) === i + 1 ? "current" : ""}"><small>第 ${i + 1} 周</small><h3>${w.title}</h3><p>${w.focus}</p><b>周验收：${w.outcome}</b></article>`).join("")}</div></section><section class="band"><div class="band-title"><div><h2>每日核心成果</h2><p>扩展任务不会形成逾期债务</p></div></div><div class="table-wrap"><table><thead><tr><th>天</th><th>核心成果</th><th>周</th><th>状态</th><th>证据</th></tr></thead><tbody>${state.tasks.map(t => `<tr><td><button class="btn" data-task-day="${t.day}">第 ${t.day} 天</button></td><td><strong>${esc(t.title)}</strong><br><span class="muted">${esc(t.standard)}</span></td><td>W${t.week}</td><td><span class="tag">${statusLabel(t.status)}</span></td><td>${esc(t.evidence || "尚未记录")}</td></tr>`).join("")}</tbody></table></div></section>`;
}

function statusLabel(status) { return ({"not-started":"未开始","active":"进行中","partial":"部分完成","blocked":"阻塞","complete":"已验收","skipped":"已跳过"})[status] || status; }

function codeMapView() {
  return `${header("代码地图", "训练快速接手陌生 EEG 仓库的能力", `<button class="btn primary" data-open="codemap">新增代码地图</button>`)}<section class="band">${state.codeMaps.length ? `<div class="table-wrap"><table><thead><tr><th>仓库</th><th>入口与数据</th><th>模型与训练</th><th>当前疑问</th></tr></thead><tbody>${state.codeMaps.map(m => `<tr><td><strong>${esc(m.repo)}</strong><br><span class="muted">${esc(m.commit)}</span></td><td>${esc(m.entry)}<br>${esc(m.data)}</td><td>${esc(m.model)}<br>${esc(m.training)}</td><td>${esc(m.unknown)}</td></tr>`).join("")}</tbody></table></div>` : `<div class="empty">还没有代码地图。第一次运行 Braindecode 后建立第一张。</div>`}</section>`;
}

function experimentsView() {
  return `${header("实验记录", "每个结果都要能追溯到数据划分、配置与代码版本", `<button class="btn primary" data-open="experiment">记录实验</button>`)}<section class="band">${state.experiments.length ? `<div class="table-wrap"><table><thead><tr><th>实验</th><th>数据与划分</th><th>模型</th><th>指标</th><th>追溯</th></tr></thead><tbody>${state.experiments.map(e => `<tr><td><strong>${esc(e.name)}</strong><br><span class="muted">${esc(e.date)}</span></td><td>${esc(e.dataset)}<br>${esc(e.split)}<br>${esc(e.labels || "")}<br>${esc(e.signal || "")}<br>${esc(e.window || "")}<br>${esc(e.causal || "")}</td><td>${esc(e.model)}<br><span class="muted">seed ${esc(e.seed)}</span></td><td>${esc(e.metrics)}</td><td>${esc(e.commit)}<br>${esc(e.notes)}</td></tr>`).join("")}</tbody></table></div>` : `<div class="empty">还没有实验记录。完成第一个基线后从这里建立对照。</div>`}</section>`;
}

function reviewView() {
  const currentWeek = Math.min(4, Math.ceil(currentDay() / 7));
  const review = state.reviews.find(r => r.week === currentWeek) || {};
  return `${header("周复盘", `第 ${currentWeek} 周验收，不通过时只补关键前置能力`)}<section class="band"><div class="task-sheet"><div class="review-grid"><div class="field"><label>本周真正完成的成果</label><textarea id="review-wins">${esc(review.wins)}</textarea></div><div class="field"><label>仍无法独立解释的内容</label><textarea id="review-gaps">${esc(review.gaps)}</textarea></div><div class="field"><label>主要阻塞与根因</label><textarea id="review-blockers">${esc(review.blockers)}</textarea></div><div class="field"><label>下周应保留或删减什么</label><textarea id="review-next">${esc(review.next)}</textarea></div><div class="field"><label>里程碑是否通过</label><select id="review-result"><option value="pending">待验收</option><option value="passed" ${review.result === "passed" ? "selected" : ""}>通过</option><option value="conditional" ${review.result === "conditional" ? "selected" : ""}>有条件通过</option><option value="failed" ${review.result === "failed" ? "selected" : ""}>未通过</option></select></div><div class="field"><label>验收证据</label><input id="review-evidence" value="${esc(review.evidence)}" placeholder="文件、commit 或报告位置"></div></div><div class="modal-actions"><button class="btn primary" data-save-review>保存复盘</button></div></div></section>`;
}

function settingsView() {
  return `${header("设置与提醒", "手机和电脑进度独立保存；此页时间仅作记录，实际提醒需在聊天中调整")}<section class="band"><div class="task-sheet"><div class="field-grid"><div class="field"><label>计划开始日期</label><input id="setting-start" type="date" value="${state.profile.startDate}"></div><div class="field"><label>默认每日时间</label><select id="setting-minutes">${[30,60,120,180].map(n => `<option value="${n}" ${state.profile.dailyMinutes === n ? "selected" : ""}>${n === 180 ? "180+" : n} 分钟</option>`).join("")}</select></div><div class="field"><label>开始提醒</label><input id="setting-morning" type="time" value="${state.settings.morning}"></div><div class="field"><label>复盘提醒</label><input id="setting-evening" type="time" value="${state.settings.evening}"></div><div class="field full"><label>提醒工作方式</label><div class="suggestion">Codex 发送今天的核心成果和最低完成标准。晚间反馈后，系统生成调整建议，但只有你确认后才修改后续任务。</div></div></div><div class="modal-actions"><button class="btn" data-backup>生成本地快照</button><button class="btn" data-export>导出 JSON（含旧课程历史）</button><button class="btn primary" data-save-settings>保存设置</button></div></div></section>`;
}

function setupModal() {
  return `<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true"><h2>启动 30 天 EEG 代码训练</h2><p>先确定开始日期和常用时间档位。之后每天仍可临时切换，不会破坏周里程碑。</p><div class="field-grid"><div class="field"><label>开始日期</label><input id="setup-date" type="date" value="${todayKey()}"></div><div class="field"><label>默认投入时间</label><select id="setup-minutes"><option value="30">30 分钟</option><option value="60">60 分钟</option><option value="120" selected>120 分钟</option><option value="180">180 分钟以上</option></select></div><div class="field full"><label>当前基础</label><select id="setup-level"><option>会 Python，深度学习基础较弱</option><option>会 Python 和 PyTorch 基础</option><option>做过深度学习项目，EEG 入门</option><option>已有 EEG 经验，需要强化工程阅读</option></select></div></div><div class="modal-actions"><button class="btn primary" data-start>生成计划并开始</button></div></section></div>`;
}

function dataModal(type) {
  if (type === "codemap") return `<div class="modal-backdrop"><section class="modal"><h2>新增代码地图</h2><p>记录模块关系，不复制大段源码。</p><div class="field-grid">${[["map-repo","仓库与路径"],["map-commit","分支或 commit"],["map-entry","运行入口"],["map-data","数据加载与预处理"],["map-model","模型定义"],["map-training","训练与评估"],["map-unknown","仍不理解"]].map(([id,label]) => `<div class="field ${id === "map-unknown" ? "full" : ""}"><label>${label}</label><input id="${id}"></div>`).join("")}</div><div class="modal-actions"><button class="btn" data-close>取消</button><button class="btn primary" data-save-map>保存</button></div></section></div>`;
  if (type === "experiment") return `<div class="modal-backdrop"><section class="modal"><h2>记录实验</h2><p>请记录标签来源、单位、参考方式、窗口长度/步长、试次或被试划分，以及是否使用未来数据。</p><div class="field-grid">${[["exp-name","实验名称"],["exp-date","日期",todayKey()],["exp-dataset","数据集与受试者"],["exp-split","划分方式"],["exp-model","模型与关键配置"],["exp-seed","随机种子"],["exp-metrics","核心指标"],["exp-commit","Git commit"],["exp-labels","标签来源与定义"],["exp-signal","单位、参考方式与采样率"],["exp-window","窗口长度与步长"],["exp-causal","是否使用未来数据"],["exp-notes","结论与风险"]].map(([id,label,value=""]) => `<div class="field ${id === "exp-notes" ? "full" : ""}"><label>${label}</label><input id="${id}" value="${value}"></div>`).join("")}</div><div class="modal-actions"><button class="btn" data-close>取消</button><button class="btn primary" data-save-exp>保存</button></div></section></div>`;
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
  document.querySelectorAll("[data-task-day]").forEach(b => b.onclick = () => { selectedTaskDay = Number(b.dataset.taskDay); view = "today"; render(); });
  document.querySelectorAll("[data-view]").forEach(b => b.onclick = () => { view = b.dataset.view; selectedTaskDay = null; render(); });
  document.querySelectorAll("[data-level]").forEach(b => b.onclick = () => { selectedLevel = b.dataset.level; currentTask().completionLevel = selectedLevel; save(); render(); });
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
  $("[data-save-exp]")?.addEventListener("click", () => { state.experiments.push({ name:$("#exp-name").value, date:$("#exp-date").value, dataset:$("#exp-dataset").value, split:$("#exp-split").value, model:$("#exp-model").value, seed:$("#exp-seed").value, metrics:$("#exp-metrics").value, commit:$("#exp-commit").value, notes:$("#exp-notes").value, labels:$("#exp-labels").value, signal:$("#exp-signal").value, window:$("#exp-window").value, causal:$("#exp-causal").value }); modal = null; save(); render(); });
  $("[data-save-review]")?.addEventListener("click", () => { const week = Math.min(4, Math.ceil(currentDay()/7)); const next = { week, wins:$("#review-wins").value, gaps:$("#review-gaps").value, blockers:$("#review-blockers").value, next:$("#review-next").value, result:$("#review-result").value, evidence:$("#review-evidence").value }; state.reviews = state.reviews.filter(r => r.week !== week); state.reviews.push(next); save(); notify("周复盘已保存"); });
  $("[data-save-settings]")?.addEventListener("click", () => { state.profile.startDate = $("#setting-start").value; state.profile.dailyMinutes = Number($("#setting-minutes").value); state.settings.morning = $("#setting-morning").value; state.settings.evening = $("#setting-evening").value; save(); render(); notify("设置已保存"); });
}

load().catch(error => { app.innerHTML = `<main class="main"><div class="empty">无法连接本地数据服务：${esc(error.message)}</div></main>`; });
