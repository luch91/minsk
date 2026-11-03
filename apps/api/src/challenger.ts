import {z} from 'zod';
import type {Workflow} from '@minsk/contracts';
import {BudgetLedger,type CapacityCode} from './budget';
import {logProviderAttempt,type ProviderResult} from './provider-telemetry';

export const BASETEN_MODEL='meta-models/muse-spark-open-1026' as const;
const INPUT_RATE=1.25;
const OUTPUT_RATE=4.25;
const MAX_OUTPUT_TOKENS=2048;
const candidateSchema=z.object({conditionId:z.string(),replacementValue:z.boolean(),reason:z.string().min(1).max(300)});
const responseSchema=z.object({candidates:z.array(candidateSchema).max(3)});
export type Candidate=z.infer<typeof candidateSchema>;
export type CandidateConstraints={maxCandidates:number};
export type ChallengerResult={candidates:Candidate[];provider:'Baseten';modelId:typeof BASETEN_MODEL;responseId:string|null;usage:{inputTokens:number;outputTokens:number}|null;accountingStatus:'PROVIDER_USAGE'|'UNKNOWN_USAGE';telemetry:{latencyMs:number;reservedMicroUsd:number;estimatedActualMicroUsd:number|null}};
export interface AdversarialModelProvider {
  generateCandidates(workflow:Workflow,constraints:CandidateConstraints,signal:AbortSignal):Promise<ChallengerResult>;
  validateAvailability():boolean;
  getModelMetadata():{provider:string;modelId:string};
}
export class ChallengerError extends Error {constructor(public status:number,message:string,public result:ProviderResult='PROVIDER_FAILURE',public capacityCode?:CapacityCode){super(message);}}
export function validatedCandidates(content:string|undefined,eligible:Map<string,boolean>,limit:number):Candidate[]{
  if(content===undefined)throw new ChallengerError(502,'Baseten response has no message content','MALFORMED_OUTPUT');
  if(!content.trim())throw new ChallengerError(502,'Baseten response has empty candidate content','MALFORMED_OUTPUT');
  let parsed:z.infer<typeof responseSchema>;
  try{parsed=responseSchema.parse(JSON.parse(content));}catch{throw new ChallengerError(502,'Baseten returned malformed candidate JSON','MALFORMED_OUTPUT');}
  if(!parsed.candidates.length)throw new ChallengerError(502,'Baseten returned an empty candidate list','MALFORMED_OUTPUT');
  const unique=new Set<string>();let unknown=0;let unchanged=0;let duplicate=0;
  const valid=parsed.candidates.filter(candidate=>{
    if(!eligible.has(candidate.conditionId)){unknown++;return false;}
    if(candidate.replacementValue===eligible.get(candidate.conditionId)){unchanged++;return false;}
    if(unique.has(candidate.conditionId)){duplicate++;return false;}
    unique.add(candidate.conditionId);return true;
  }).slice(0,limit);
  if(!valid.length)throw new ChallengerError(502,`Baseten proposed no valid intervention: ${unknown} unknown IDs, ${unchanged} unchanged values, ${duplicate} duplicates`,'MALFORMED_OUTPUT');
  return valid;
}
export function basetenEstimateMicroUsd(inputBytes:number,outputTokens=MAX_OUTPUT_TOKENS){return Math.ceil(inputBytes*INPUT_RATE+outputTokens*OUTPUT_RATE);}
export function basetenActualMicroUsd(inputTokens:number,outputTokens:number){return Math.ceil(inputTokens*INPUT_RATE+outputTokens*OUTPUT_RATE);}

export class EligibleOpenWeightInvestigator implements AdversarialModelProvider {
  constructor(private readonly key:string|undefined,private readonly enabled:boolean,private readonly ledger:DurableObjectStub<BudgetLedger>,private readonly client:string,private readonly correlationId:string){}
  validateAvailability(){return this.enabled&&!!this.key;}
  getModelMetadata(){return {provider:'Baseten',modelId:BASETEN_MODEL};}
  async generateCandidates(workflow:Workflow,constraints:CandidateConstraints,signal:AbortSignal):Promise<ChallengerResult>{
    if(!this.validateAvailability())throw new ChallengerError(503,'Open-weight challenger is disabled');
    const candidates=workflow.conditions.filter(condition=>typeof condition.observedValue==='boolean');
    if(!candidates.length)throw new ChallengerError(422,'No observed boolean condition is eligible');
    const prompt=JSON.stringify({conditions:candidates.map(condition=>({id:condition.id,name:condition.name,observedValue:condition.observedValue,expectedValue:condition.expectedValue,freshnessRequirement:condition.freshnessRequirement,observedAt:condition.observedAt})),rules:workflow.policyRules.map(rule=>({id:rule.id,subjectStepId:rule.subjectStepId,requiredConditionIds:rule.requiredConditionIds,predicate:rule.predicate})),steps:workflow.steps.map(step=>({id:step.id,executionGateIds:step.executionGateIds,dependsOn:step.dependsOn,actionType:step.actionType})),maxCandidates:Math.min(3,constraints.maxCandidates)});
    const payload=JSON.stringify({model:BASETEN_MODEL,messages:[{role:'system',content:'Propose up to three adversarial changes to observed boolean conditions in the validated workflow. Return only a JSON object with a nonempty candidates array. Each candidate has conditionId, replacementValue, and reason. Use only listed IDs and choose a value different from the observation. Return a candidate even if a gate should safely block it or another condition remains unknown. Do not claim any simulator outcome.'},{role:'user',content:prompt}],max_tokens:MAX_OUTPUT_TOKENS,reasoning_effort:'low',response_format:{type:'json_object'},temperature:0});
    const id=crypto.randomUUID();
    const reservedMicroUsd=basetenEstimateMicroUsd(new TextEncoder().encode(payload).length);
    const reservation=await this.ledger.reserve(id,this.client,reservedMicroUsd,'text',BASETEN_MODEL,'Baseten');
    if(!reservation.allowed){logProviderAttempt({correlationId:this.correlationId,provider:'Baseten',modelId:BASETEN_MODEL,requestPurpose:'CHALLENGER_ANALYSIS',latencyMs:0,inputTokens:null,outputTokens:null,fallbackStatus:'NONE',result:'CAPACITY_REJECTED',capacityCode:reservation.code});throw new ChallengerError(429,reservation.reason,'CAPACITY_REJECTED',reservation.code);}
    const timeout=AbortSignal.timeout(30_000);
    const start=performance.now();
    try{
      const response=await fetch('https://inference.baseten.co/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${this.key}`,'Content-Type':'application/json'},body:payload,signal:AbortSignal.any([signal,timeout])});
      if(!response.ok)throw new ChallengerError(response.status===429?429:response.status>=500?502:502,`Baseten provider returned ${response.status}`);
      const result=await response.json() as {id?:string;choices?:Array<{message?:{content?:string}}>;usage?:{prompt_tokens?:number;completion_tokens?:number}};
      const reported=result.usage?.prompt_tokens!==undefined&&result.usage.completion_tokens!==undefined;
      const latencyMs=Math.round(performance.now()-start);if(reported)await this.ledger.settle(id,basetenActualMicroUsd(result.usage!.prompt_tokens!,result.usage!.completion_tokens!),result.usage!.prompt_tokens,result.usage!.completion_tokens,latencyMs);else await this.ledger.markUnknown(id,latencyMs);
      const valid=validatedCandidates(result.choices?.[0]?.message?.content,new Map(candidates.map(candidate=>[candidate.id,candidate.observedValue as boolean])),Math.min(3,constraints.maxCandidates));
      logProviderAttempt({correlationId:this.correlationId,provider:'Baseten',modelId:BASETEN_MODEL,requestPurpose:'CHALLENGER_ANALYSIS',latencyMs,inputTokens:reported?result.usage!.prompt_tokens!:null,outputTokens:reported?result.usage!.completion_tokens!:null,fallbackStatus:'NONE',result:'SUCCEEDED'});
      return {candidates:valid,provider:'Baseten',modelId:BASETEN_MODEL,responseId:result.id??null,usage:reported?{inputTokens:result.usage!.prompt_tokens!,outputTokens:result.usage!.completion_tokens!}:null,accountingStatus:reported?'PROVIDER_USAGE':'UNKNOWN_USAGE',telemetry:{latencyMs,reservedMicroUsd,estimatedActualMicroUsd:reported?basetenActualMicroUsd(result.usage!.prompt_tokens!,result.usage!.completion_tokens!):null}};
    }catch(error){const latencyMs=Math.round(performance.now()-start);const result:ProviderResult=signal.aborted?'CANCELLED':timeout.aborted?'TIMEOUT':error instanceof ChallengerError?error.result:'PROVIDER_FAILURE';const code=result==='CANCELLED'?'CANCELLED':result==='TIMEOUT'?'TIMEOUT':error instanceof ChallengerError?`HTTP_${error.status}`:'TRANSPORT';await this.ledger.markUnknown(id,latencyMs,code);logProviderAttempt({correlationId:this.correlationId,provider:'Baseten',modelId:BASETEN_MODEL,requestPurpose:'CHALLENGER_ANALYSIS',latencyMs,inputTokens:null,outputTokens:null,fallbackStatus:'NONE',result,providerStatus:error instanceof ChallengerError?error.status:undefined});if(signal.aborted)throw new ChallengerError(499,'Request cancelled','CANCELLED');if(timeout.aborted)throw new ChallengerError(504,'Baseten provider timed out','TIMEOUT');throw error;}
  }
}
