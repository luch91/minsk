import {describe,it,expect,vi,afterEach} from 'vitest';
import api from './index';
import type {InvestigationAttestation} from './budget';
import type {Workflow,Intervention} from '@minsk/contracts';
import {missingApproval} from '../../../fixtures/workflows/missing-approval';

const text='Production deployment requires passing automated tests, human approval, and verified migration compatibility. The deployment agent executes when tests pass and migration compatibility passes. Automated tests passed. Human approval is present. Migration compatibility verified.';
const extracted={title:'Release fixture',conditions:[{id:'tests',name:'Automated tests',expectedValue:true,observedValue:true,evidence:'Automated tests passed.',freshnessRequirement:null,observedAt:null},{id:'approval',name:'Human approval',expectedValue:true,observedValue:true,evidence:'Human approval is present.',freshnessRequirement:null,observedAt:null},{id:'migration',name:'Migration compatibility',expectedValue:true,observedValue:true,evidence:'Migration compatibility verified.',freshnessRequirement:null,observedAt:null}],policyRules:[{id:'policy',description:'Deployment requires all three conditions',subjectStepId:'deploy',predicate:'ALL',requiredConditionIds:['tests','approval','migration'],evidence:text.split('. ')[0]+'.'}],steps:[{id:'deploy',name:'Deploy',actionType:'DEPLOY',dependsOn:[],executionGateIds:['tests','migration'],evidence:'The deployment agent executes when tests pass and migration compatibility passes.'}]};
function setup(){
 const records=new Map<string,InvestigationAttestation>();
 const ledger={admit:vi.fn(async()=>({allowed:true})),reserve:vi.fn(async()=>({allowed:true})),settle:vi.fn(async()=>{}),markUnknown:vi.fn(async()=>{}),acquireInvestigation:vi.fn(async()=>true),releaseInvestigation:vi.fn(async()=>{}),attest:vi.fn(async(id:string,r:InvestigationAttestation)=>{records.set(id,r);}),getAttestation:async(id:string)=>records.get(id)??null};
 const env={BUDGET:{getByName:()=>ledger},MODEL_CALLS_ENABLED:'true',META_CREDITS_CONFIRMED:'true',META_BILLING_MODE:'Standard',MODEL_API_KEY:'fixture-meta-secret',BASETEN_CHALLENGER_ENABLED:'true',BASETEN_CREDITS_CONFIRMED:'true',PUBLIC_CHALLENGER_ENABLED:'true',BASETEN_API_KEY:'fixture-baseten-secret'} as unknown as Parameters<typeof api.fetch>[1];
 const post=(path:string,body:unknown)=>api.fetch(new Request('https://fixture.test/api/v1/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),env);
 return {ledger,post,env};
}
afterEach(()=>vi.unstubAllGlobals());
describe('release provider journey with deterministic provider fixtures',()=>{
 it('extracts, investigates through both tools, compares Baseten and exports trusted Meta provenance',async()=>{
  const {post,ledger}=setup();const requests:Array<Record<string,unknown>>=[];
  vi.stubGlobal('fetch',vi.fn(async(url:string,init:RequestInit)=>{
   const p=JSON.parse(init.body as string);requests.push(p);
   if(url.includes('baseten'))return Response.json({id:'fixture-baseten',choices:[{message:{content:JSON.stringify({candidates:[{conditionId:'approval',replacementValue:false,reason:'Fixture: approval is not gated'}]})}}],usage:{prompt_tokens:100,completion_tokens:50}});
   const name=p.tools?.[0]?.name;
   const output=name?[{type:'function_call',name,call_id:'fixture-'+name,arguments:JSON.stringify(name==='run_counterfactual'?{conditionId:'approval',replacementValue:false}:{stepId:'deploy',conditionId:'approval'})}]:[{type:'message',content:[{type:'output_text',text:JSON.stringify(extracted)}]}];
   return Response.json({id:'fixture-'+(name??'extraction'),output,usage:{input_tokens:100,output_tokens:50}});
  }));
  const extraction=await post('workflows/extract',{text});expect(extraction.status).toBe(200);
  const {workflow}=await extraction.json() as {workflow:Workflow};expect(workflow.conditions.map(c=>c.observedValue)).toEqual([true,true,true]);
  const investigation=await post('investigations',{workflow});expect(investigation.status).toBe(200);
  const result=await investigation.json() as {investigationId:string;baseline:{outcome:string};failure:{outcome:string};verification:{repaired:{outcome:string};safeguard:{stepId:string;conditionId:string}};intervention:Intervention;trace:unknown[]};
  expect(result.baseline.outcome).toBe('SAFE_EXECUTION');expect(result.failure.outcome).toBe('UNSAFE_EXECUTION');expect(result.verification.repaired.outcome).toBe('SAFE_BLOCK');expect(result.trace).toHaveLength(2);
  const comparison=await post('challengers/open-weight',{workflow,hosted:{investigationId:result.investigationId,intervention:result.intervention}});expect(comparison.status).toBe(200);expect(await comparison.json()).toMatchObject({challenger:{provider:'Baseten',responseId:'fixture-baseten'},experiments:[{result:{outcome:'UNSAFE_EXECUTION'}}],comparison:{hostedOutcome:'UNSAFE_EXECUTION'}});
  const report=await post('reports/export',{workflow,investigation:result});expect(report.status).toBe(200);
  const certificate=await report.json() as {modelMetadata:{responseIds:string[];calls:unknown[]}};
  expect(certificate.modelMetadata.responseIds).toEqual(['fixture-run_counterfactual','fixture-propose_safeguard']);expect(certificate.modelMetadata.calls).toHaveLength(2);
  expect(await (await post('reports/verify',{certificate,workflow})).json()).toMatchObject({valid:true,inputVerified:true,provenanceAuthenticity:'NOT_VERIFIED'});
  expect(JSON.stringify(certificate)).not.toContain('fixture-meta-secret');expect(JSON.stringify(certificate)).not.toContain('fixture-baseten-secret');
  const tampered=await post('reports/export',{workflow,investigation:{...result,intervention:{...result.intervention,reason:'tampered'}}});expect(tampered.status).toBe(400);
  const context=JSON.parse((requests[1]!.input as Array<{content:string}>)[1]!.content);expect(context.rules[0].predicate).toBe('ALL');expect(context.steps[0]).toMatchObject({actionType:'DEPLOY',dependsOn:[]});expect(context.conditions[0].expectedValue).toBe(true);
  expect(ledger.reserve).toHaveBeenCalledTimes(4);expect(ledger.settle).toHaveBeenCalledTimes(4);expect(ledger.releaseInvestigation).toHaveBeenCalledWith(expect.any(String));
 });
 it.each([{conditionId:'human-approval',replacementValue:true},'{broken'])('rejects an invalid provider proposal and releases the lease: %j',async(args)=>{
  const {post,ledger}=setup();vi.stubGlobal('fetch',vi.fn(async()=>Response.json({id:'fixture-invalid',output:[{type:'function_call',name:'run_counterfactual',call_id:'fixture-call',arguments:typeof args==='string'?args:JSON.stringify(args)}],usage:{input_tokens:100,output_tokens:10}})));
  const response=await post('investigations',{workflow:missingApproval});expect(response.status).toBe(502);expect(ledger.releaseInvestigation).toHaveBeenCalledTimes(1);expect(ledger.attest).not.toHaveBeenCalled();
 });
 it('reports provider throttling without leaking provider response contents',async()=>{
  const {post,ledger}=setup();vi.stubGlobal('fetch',vi.fn(async()=>new Response('fixture-meta-secret',{status:429})));
  const response=await post('workflows/extract',{text});expect(response.status).toBe(429);expect(await response.text()).not.toContain('fixture-meta-secret');expect(ledger.markUnknown).toHaveBeenCalledWith(expect.any(String),expect.any(Number),'HTTP_429');
 });
 it('falls back once from unavailable Wonder and preserves routing provenance',async()=>{
  const {post,env,ledger}=setup();env.WONDER_ENABLED='true';
  const workflow=structuredClone(missingApproval);workflow.conditions[0]!.observedValue=null;workflow.conditions[1]!.observedValue=null;
  const known=workflow.conditions.find(c=>typeof c.observedValue==='boolean')!;
  const transport=vi.fn(async(_url:string,init:RequestInit)=>{
   const payload=JSON.parse(init.body as string);
   if(payload.model==='muse-wonder-1.0')return new Response('Fixture: provider unavailable',{status:503});
   return Response.json({id:'fixture-fallback',output:[{type:'function_call',name:'run_counterfactual',call_id:'fixture-fallback-tool',arguments:JSON.stringify({conditionId:known.id,replacementValue:!known.observedValue})}],usage:{input_tokens:100,output_tokens:10}});
  });vi.stubGlobal('fetch',transport);
  const response=await post('investigations',{workflow});expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({model:{modelId:'muse-spark-1.3',role:'ESCALATION_FALLBACK'},routing:{modelId:'muse-spark-1.3',escalated:false,reason:expect.stringContaining('one Spark fallback')}});
  expect(transport).toHaveBeenCalledTimes(2);expect(ledger.markUnknown).toHaveBeenCalledTimes(1);expect(ledger.attest).toHaveBeenCalledTimes(1);expect(ledger.releaseInvestigation).toHaveBeenCalledTimes(1);
 });
 it('does not attest an incomplete investigation when safeguard inference is throttled',async()=>{
  const {post,ledger}=setup();let calls=0;
  vi.stubGlobal('fetch',vi.fn(async()=>{calls++;if(calls===2)return new Response('Fixture: provider quota',{status:429});return Response.json({id:'fixture-first-only',output:[{type:'function_call',name:'run_counterfactual',call_id:'fixture-first-tool',arguments:JSON.stringify({conditionId:'human-approval',replacementValue:false})}],usage:{input_tokens:100,output_tokens:20}});}));
  const response=await post('investigations',{workflow:missingApproval});expect(response.status).toBe(429);expect(calls).toBe(2);expect(ledger.attest).not.toHaveBeenCalled();expect(ledger.releaseInvestigation).toHaveBeenCalledTimes(1);expect(ledger.settle).toHaveBeenCalledTimes(1);expect(ledger.markUnknown).toHaveBeenCalledTimes(1);
 });
 it('caps actual streamed UTF-8 bytes before decoding or model dispatch',async()=>{
  const {post}=setup();const transport=vi.fn();vi.stubGlobal('fetch',transport);
  const response=await post('workflows/extract',{text:'界'.repeat(21_000)});expect(response.status).toBe(413);expect(transport).not.toHaveBeenCalled();
 });
});
