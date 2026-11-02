// Test-only transport: no provider requests leave this process.
import {readFileSync} from 'node:fs';
const labels=JSON.parse(readFileSync('model-evaluation/ground-truth.json','utf8'));
globalThis.fetch=async(url,options)=>{
 if(!String(url).startsWith('https://benchmark.invalid/'))throw new Error('Unexpected test destination');
 if(String(url).endsWith('/budget'))return Response.json({liveModelEnabled:true,openWeightEnabled:true});
 const {workflow}=JSON.parse(options.body);
 const target=workflow.id==='H07'||workflow.id==='H08'?workflow.conditions[1]:workflow.conditions[0];
 return Response.json({challenger:{modelId:'meta-models/muse-spark-open-1026',usage:{inputTokens:10,outputTokens:10},telemetry:{estimatedActualMicroUsd:55}},experiments:[{intervention:{id:'mock',targetConditionId:target.id,originalValue:true,replacementValue:false,reason:'Test fixture',proposedBy:'OPEN_WEIGHT',validated:true},result:{outcome:labels.cases[workflow.id].outcome}}]});
};
