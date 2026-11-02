import {it,expect} from 'vitest';
import {execFileSync,spawnSync} from 'node:child_process';
import {mkdirSync,readFileSync,readdirSync,rmSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const root=fileURLToPath(new URL('..',import.meta.url));
const results=resolve(root,'model-evaluation/results');
const env={...process.env,MINSK_EVAL_API_URL:'https://benchmark.invalid',MINSK_EVAL_TOKEN:'test-only',MINSK_EVAL_TEST_TOKEN:'test-only',MINSK_EVAL_DEPLOYMENT_ID:'test-version'};
const args=['--import','./model-evaluation/tests/mock-provider.mjs','--import','tsx','scripts/benchmark-models.ts','--provider','baseten'];
it('runs the CLI, persists source identity, rejects mismatched resume and avoids duplicate dispatches',()=>{
 mkdirSync(results,{recursive:true});
 const before=new Set(readdirSync(results));
 let filename:string|undefined;
 try{
  execFileSync(process.execPath,args,{cwd:root,env,encoding:'utf8'});
  filename=readdirSync(results).find(f=>!before.has(f));expect(filename).toBeTruthy();
  const path=`model-evaluation/results/${filename}`;
  const result=JSON.parse(readFileSync(resolve(root,path),'utf8'));expect(result.status).toBe('COMPLETED');expect(result.groups.baseten).toMatchObject({attempted:8,outcomeCorrect:8,notAttempted:0});expect(result.fingerprint).toMatch(/^[a-f0-9]{64}$/);expect(result.sourceHashes['model-evaluation/scoring.ts']).toBeTruthy();
  const resumed=spawnSync(process.execPath,[...args,'--resume',path],{cwd:root,env,encoding:'utf8'});expect(resumed.status,resumed.stderr).toBe(0);expect(JSON.parse(readFileSync(resolve(root,path),'utf8')).rows).toHaveLength(8);
  const rejected=spawnSync(process.execPath,[...args,'--resume',path],{cwd:root,env:{...env,MINSK_EVAL_DEPLOYMENT_ID:'different-version'},encoding:'utf8'});expect(rejected.status).not.toBe(0);expect(rejected.stderr).toContain('Resume configuration does not match');
 }finally{if(filename)rmSync(resolve(results,filename),{force:true});}
},30000);
