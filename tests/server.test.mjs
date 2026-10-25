import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("frontend includes core learning surfaces", async () => {
  const source = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
  for (const label of ["今日执行", "30 天路线", "代码地图", "实验记录", "周复盘", "设置与提醒"]) {
    assert.match(source, new RegExp(label));
  }
  assert.equal((source.match(/\[4,"/g) || []).length >= 9, true);
});

test("server persists state to a local json file", async () => {
  const source = await readFile(new URL("../server.mjs", import.meta.url), "utf8");
  assert.match(source, /state\.json/);
  assert.match(source, /api\/backup/);
  assert.match(source, /api\/export/);
  assert.match(source, /Buffer\.isBuffer/);
});
