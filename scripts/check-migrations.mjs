import {DatabaseSync} from 'node:sqlite';import {readFileSync,writeFileSync} from 'node:fs';
import {statements} from './finalize-build.mjs';
const root=process.cwd(),journal=JSON.parse(readFileSync(root+'/drizzle/meta/_journal.json','utf8')),db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON');let count=0;
for(const entry of journal.entries){for(const sql of statements(readFileSync(root+'/drizzle/'+entry.tag+'.sql','utf8'))){db.exec(sql);count++;}}
if(db.prepare('PRAGMA integrity_check').get().integrity_check!=='ok'||db.prepare('PRAGMA foreign_key_check').all().length)throw Error('Migration integrity failed');
const result={migrations:journal.entries.length,statements:count,tables:db.prepare("SELECT count(*) AS n FROM sqlite_master WHERE type='table'").get().n,integrity:'ok'};db.close();console.log(result);
