import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {summarize,type ScoreRow} from '../model-evaluation/scoring';
const [input,output]=process.argv.slice(2);
if(!input||!output||input===output)throw new Error('Supply distinct input and output JSON paths; raw evidence is immutable');
const raw=await readFile(input,'utf8');
const report=JSON.parse(raw) as {rows:ScoreRow[];groups:Record<string,{expected:number}>};
const groups=Object.fromEntries(Object.entries(report.groups).map(([task,value])=>[task,{task,...summarize(report.rows.filter(row=>row.task===task),value.expected,task)}]));
await writeFile(output,JSON.stringify({derivedFrom:createHash('sha256').update(raw).digest('hex'),scoringSourceSha256:createHash('sha256').update(await readFile('model-evaluation/scoring.ts')).digest('hex'),note:'Offline rescore only. Original responses and raw report remain unchanged. Extraction classification metrics are inapplicable.',groups},null,2)+'\n',{flag:'wx'});
