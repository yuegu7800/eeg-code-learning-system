import test from 'node:test';
import assert from 'node:assert/strict';
import {taskSeed,lesson,migrateCurriculum,curriculumVersion} from '../public/curriculum.mjs';
test('30 lessons have resources, code targets and three questions',()=>{
 assert.equal(taskSeed.length,30);
 taskSeed.forEach((r,i)=>{assert.equal(r.length,7);const l=lesson(i+1);assert.equal(l.questions.length,3);assert.ok(l.code);assert.ok(l.resources.every(x=>x.url.startsWith('https://')));});
});
test('migration preserves records and is idempotent',()=>{
 const old={profile:{startDate:'2026-10-26'},tasks:[{status:'complete',evidence:'log'}, {status:'complete',title:'old'}],reviews:[{week:1}],experiments:[{name:'old'}],meta:{}};
 const fresh=taskSeed.map((r,i)=>({day:i+1,title:r[1],status:'not-started'}));
 const migrated=migrateCurriculum(old,fresh);
 assert.equal(migrated.tasks[0].evidence,'log');assert.equal(migrated.tasks[1].status,'not-started');
 assert.equal(migrated.curriculumHistory[0].tasks[1].title,'old');assert.deepEqual(migrated.experiments,old.experiments);
 assert.deepEqual(migrated.profile,old.profile);assert.equal(migrated.meta.curriculumVersion,curriculumVersion);
 assert.equal(migrateCurriculum(migrated,fresh),migrated);
});
