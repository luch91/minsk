import {DurableObject} from 'cloudflare:workers';
import {modelConfig,type ModelId} from './models';

export type LiveProvider='Meta'|'Baseten';
export type CapacityCode='REQUEST_GLOBAL_LIMIT'|'REQUEST_CLIENT_LIMIT'|'MODEL_GLOBAL_LIMIT'|'MODEL_CLIENT_LIMIT'|'PROVIDER_DAILY_LIMIT'|'PROVIDER_SPEND_CAP'|'CAPACITY_CONFIGURATION_INVALID'|'EVALUATION_LIMIT';
export type Admission={allowed:true}|{allowed:false;code:CapacityCode;reason:string};
type QuotaSettings={PUBLIC_GLOBAL_REQUESTS_PER_MINUTE?:string;PUBLIC_CLIENT_REQUESTS_PER_MINUTE?:string;PUBLIC_GLOBAL_MODEL_CALLS_PER_DAY?:string;PUBLIC_CLIENT_MODEL_CALLS_PER_DAY?:string};
type CapacitySettings=QuotaSettings&{META_CEILING_MICRO_USD?:string;BASETEN_CEILING_MICRO_USD?:string;BASETEN_MAX_CALLS_PER_DAY?:string;MINSK_EVAL_MAX_CALLS?:string;MINSK_EVAL_MAX_MICRO_USD?:string};

export function providerCeiling(provider:LiveProvider,settings:{META_CEILING_MICRO_USD?:string;BASETEN_CEILING_MICRO_USD?:string}):number|null {
  const raw=provider==='Baseten'?settings.BASETEN_CEILING_MICRO_USD??'10000000':settings.META_CEILING_MICRO_USD??'50000000';
  if(!raw||!/^[1-9]\d*$/.test(raw))return null;
  const ceiling=Number(raw);const maximum=provider==='Meta'?50_000_000:100_000_000;
  return Number.isSafeInteger(ceiling)&&ceiling<=maximum?ceiling:null;
}
export function configuredLimit(value:string|undefined,fallback:number,maximum:number):number {if(value===undefined)return fallback;const parsed=Number(value);return Number.isInteger(parsed)&&parsed>0&&parsed<=maximum?parsed:fallback;}
export function basetenDailyLimit(settings:{BASETEN_MAX_CALLS_PER_DAY?:string}):number{return configuredLimit(settings.BASETEN_MAX_CALLS_PER_DAY,50,10_000);}
export function publicQuotaLimits(settings:QuotaSettings){return {globalRequestsPerMinute:configuredLimit(settings.PUBLIC_GLOBAL_REQUESTS_PER_MINUTE,300,10_000),clientRequestsPerMinute:configuredLimit(settings.PUBLIC_CLIENT_REQUESTS_PER_MINUTE,30,1_000),globalModelCallsPerDay:configuredLimit(settings.PUBLIC_GLOBAL_MODEL_CALLS_PER_DAY,500,100_000),clientModelCallsPerDay:configuredLimit(settings.PUBLIC_CLIENT_MODEL_CALLS_PER_DAY,20,1_000)};}
export function quotaAdmission(globalCount:number,clientCount:number,globalLimit:number,clientLimit:number,scope:'request'|'model'):Admission {
  if(globalCount>=globalLimit)return {allowed:false,code:scope==='request'?'REQUEST_GLOBAL_LIMIT':'MODEL_GLOBAL_LIMIT',reason:scope==='request'?'Live request capacity is temporarily exhausted':'Live model capacity is exhausted for today'};
  if(clientCount>=clientLimit)return {allowed:false,code:scope==='request'?'REQUEST_CLIENT_LIMIT':'MODEL_CLIENT_LIMIT',reason:scope==='request'?'This client has reached the temporary request allowance':'This client has reached today\'s live model allowance'};
  return {allowed:true};
}
export function evaluationAdmission(count:number,costMicroUsd:number,estimatedMicroUsd:number,limit=6,ceilingMicroUsd=300_000,provider:LiveProvider='Meta'):Admission {
  if(!Number.isInteger(limit)||limit<1||limit>200||!Number.isInteger(ceilingMicroUsd)||ceilingMicroUsd<1||ceilingMicroUsd>10_000_000)return {allowed:false,code:'CAPACITY_CONFIGURATION_INVALID',reason:'Invalid evaluation capacity configuration'};
  if(count>=limit)return {allowed:false,code:'EVALUATION_LIMIT',reason:'Evaluation call limit reached'};
  if(!Number.isFinite(estimatedMicroUsd)||estimatedMicroUsd<=0)return {allowed:false,code:'CAPACITY_CONFIGURATION_INVALID',reason:'Invalid evaluation estimate'};
  if(provider==='Meta'&&costMicroUsd+estimatedMicroUsd>ceilingMicroUsd)return {allowed:false,code:'EVALUATION_LIMIT',reason:'Evaluation Meta estimate ceiling reached'};
  return {allowed:true};
}
export type ModelCallAttestation={modelId:ModelId;role:string;responseId:string|null;toolCallId:string;toolArgumentsJson?:string;toolResultJson?:string;inputTokens:number;outputTokens:number;accountingStatus:'PROVIDER_USAGE'|'UNKNOWN_USAGE';routingReason:string};
export type InvestigationAttestation={graphHash:string;interventionHash:string;stepId:string|null;conditionId:string|null;responseIds:string[];toolCallIds:string[];inputTokens:number;outputTokens:number;verificationOutcome:string|null;calls?:ModelCallAttestation[]};

export class BudgetLedger extends DurableObject {
  private initialize():void {
    this.ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS calls (id TEXT PRIMARY KEY, day TEXT NOT NULL, session TEXT NOT NULL, reserved INTEGER NOT NULL, actual INTEGER, kind TEXT NOT NULL, state TEXT NOT NULL DEFAULT \'RESERVED\')');
    const columns=this.ctx.storage.sql.exec<{name:string}>('PRAGMA table_info(calls)').toArray();if(!columns.some(x=>x.name==='state'))this.ctx.storage.sql.exec('ALTER TABLE calls ADD COLUMN state TEXT NOT NULL DEFAULT \'UNKNOWN_USAGE\'');
    if(!columns.some(x=>x.name==='model'))this.ctx.storage.sql.exec("ALTER TABLE calls ADD COLUMN model TEXT NOT NULL DEFAULT 'muse-spark-1.3'");
    if(!columns.some(x=>x.name==='provider'))this.ctx.storage.sql.exec("ALTER TABLE calls ADD COLUMN provider TEXT NOT NULL DEFAULT 'Meta'");
    if(!columns.some(x=>x.name==='input_tokens'))this.ctx.storage.sql.exec('ALTER TABLE calls ADD COLUMN input_tokens INTEGER');
    if(!columns.some(x=>x.name==='output_tokens'))this.ctx.storage.sql.exec('ALTER TABLE calls ADD COLUMN output_tokens INTEGER');
    if(!columns.some(x=>x.name==='latency_ms'))this.ctx.storage.sql.exec('ALTER TABLE calls ADD COLUMN latency_ms INTEGER');
    if(!columns.some(x=>x.name==='error_code'))this.ctx.storage.sql.exec('ALTER TABLE calls ADD COLUMN error_code TEXT');
    this.ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS request_counts (key TEXT PRIMARY KEY, count INTEGER NOT NULL)');this.ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS attestations (id TEXT PRIMARY KEY, payload TEXT NOT NULL, created INTEGER NOT NULL)');this.ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS investigation_lock (id INTEGER PRIMARY KEY CHECK (id=1), started INTEGER NOT NULL, owner TEXT)');
    const lockColumns=this.ctx.storage.sql.exec<{name:string}>('PRAGMA table_info(investigation_lock)').toArray();if(!lockColumns.some(x=>x.name==='owner'))this.ctx.storage.sql.exec('ALTER TABLE investigation_lock ADD COLUMN owner TEXT');
  }
  admit(client:string):Admission {
    this.initialize();const minute=new Date().toISOString().slice(0,16);const quotas=publicQuotaLimits(this.env as CapacitySettings);const globalCount=this.ctx.storage.sql.exec<{count:number}>('SELECT count FROM request_counts WHERE key=?',`global:${minute}`).toArray()[0]?.count??0;const clientCount=this.ctx.storage.sql.exec<{count:number}>('SELECT count FROM request_counts WHERE key=?',`client:${client}:${minute}`).toArray()[0]?.count??0;const admission=quotaAdmission(globalCount,clientCount,quotas.globalRequestsPerMinute,quotas.clientRequestsPerMinute,'request');if(!admission.allowed)return admission;
    for(const key of [`global:${minute}`,`client:${client}:${minute}`])this.ctx.storage.sql.exec('INSERT INTO request_counts (key,count) VALUES (?,1) ON CONFLICT(key) DO UPDATE SET count=count+1',key);this.ctx.storage.sql.exec('DELETE FROM request_counts WHERE key NOT LIKE ?',`%${minute}`);return {allowed:true};
  }
  acquireInvestigation(owner:string):boolean{this.initialize();const now=Date.now();this.ctx.storage.sql.exec('DELETE FROM investigation_lock WHERE started<?',now-180_000);const current=this.ctx.storage.sql.exec<{id:number}>('SELECT id FROM investigation_lock WHERE id=1').toArray();if(current.length)return false;this.ctx.storage.sql.exec('INSERT INTO investigation_lock (id,started,owner) VALUES (1,?,?)',now,owner);return true;}
  releaseInvestigation(owner:string):void{this.initialize();this.ctx.storage.sql.exec('DELETE FROM investigation_lock WHERE id=1 AND owner=?',owner);}
  reserve(id:string,client:string,estimatedMicroUsd:number,kind:'text'|'image',model:ModelId|'meta-models/muse-spark-open-1026'='muse-spark-1.3',provider:LiveProvider='Meta'):Admission {
    this.initialize();const settings=this.env as CapacitySettings;
    if(client==='eval:controlled'){const used=this.ctx.storage.sql.exec<{count:number;cost:number}>('SELECT COUNT(*) AS count,COALESCE(SUM(CASE WHEN provider=\'Meta\' THEN MAX(COALESCE(actual,0),reserved) ELSE 0 END),0) AS cost FROM calls WHERE session=?',client).one();const admission=evaluationAdmission(used.count,used.cost,estimatedMicroUsd,settings.MINSK_EVAL_MAX_CALLS?Number(settings.MINSK_EVAL_MAX_CALLS):6,settings.MINSK_EVAL_MAX_MICRO_USD?Number(settings.MINSK_EVAL_MAX_MICRO_USD):300_000,provider);if(!admission.allowed)return admission;}
    const day=new Date().toISOString().slice(0,10);const total=this.ctx.storage.sql.exec<{value:number}>('SELECT COALESCE(SUM(COALESCE(actual,reserved)),0) AS value FROM calls WHERE provider=?',provider).one().value;const daily=this.ctx.storage.sql.exec<{value:number}>('SELECT COUNT(*) AS value FROM calls WHERE day=?',day).one().value;const perClient=this.ctx.storage.sql.exec<{value:number}>('SELECT COUNT(*) AS value FROM calls WHERE session=? AND day=?',client,day).one().value;const providerDaily=this.ctx.storage.sql.exec<{value:number}>('SELECT COUNT(*) AS value FROM calls WHERE provider=? AND day=?',provider,day).one().value;
    const ceiling=providerCeiling(provider,settings);if(ceiling===null||!Number.isSafeInteger(estimatedMicroUsd)||estimatedMicroUsd<=0)return {allowed:false,code:'CAPACITY_CONFIGURATION_INVALID',reason:`${provider} live capacity is not configured correctly`};if(total+estimatedMicroUsd>ceiling)return {allowed:false,code:'PROVIDER_SPEND_CAP',reason:`${provider} live capacity is exhausted`};if(provider==='Baseten'&&providerDaily>=basetenDailyLimit(settings))return {allowed:false,code:'PROVIDER_DAILY_LIMIT',reason:'Baseten live capacity is exhausted for today'};
    const quotas=publicQuotaLimits(settings);if(client!=='eval:controlled'){const admission=quotaAdmission(daily,perClient,quotas.globalModelCallsPerDay,quotas.clientModelCallsPerDay,'model');if(!admission.allowed)return admission;}
    this.ctx.storage.sql.exec('INSERT INTO calls (id,day,session,reserved,actual,kind,state,model,provider) VALUES (?,?,?,?,NULL,?,\'RESERVED\',?,?)',id,day,client,estimatedMicroUsd,kind,model,provider);return {allowed:true};
  }
  settle(id:string,actualMicroUsd:number,inputTokens?:number,outputTokens?:number,latencyMs?:number):void {this.initialize();this.ctx.storage.sql.exec('UPDATE calls SET actual=?,input_tokens=?,output_tokens=?,latency_ms=?,state=\'PROVIDER_USAGE\' WHERE id=?',Math.max(0,Math.floor(actualMicroUsd)),inputTokens??null,outputTokens??null,Number.isSafeInteger(latencyMs)&&latencyMs!>=0?latencyMs:null,id);}
  markUnknown(id:string,latencyMs?:number,errorCode?:string):void{this.initialize();this.ctx.storage.sql.exec('UPDATE calls SET latency_ms=COALESCE(?,latency_ms),error_code=COALESCE(?,error_code),state=\'UNKNOWN_USAGE\' WHERE id=? AND actual IS NULL',Number.isSafeInteger(latencyMs)&&latencyMs!>=0?latencyMs:null,errorCode?.slice(0,80)??null,id);}
  attest(id:string,payload:InvestigationAttestation):void{this.initialize();this.ctx.storage.sql.exec('INSERT INTO attestations (id,payload,created) VALUES (?,?,?)',id,JSON.stringify(payload),Date.now());}
  getAttestation(id:string):InvestigationAttestation|null{this.initialize();const row=this.ctx.storage.sql.exec<{payload:string;created:number}>('SELECT payload,created FROM attestations WHERE id=?',id).toArray()[0];if(!row||Date.now()-row.created>86_400_000)return null;return JSON.parse(row.payload) as InvestigationAttestation;}
  availability(client:string){
    this.initialize();const now=new Date();const minute=now.toISOString().slice(0,16);const day=now.toISOString().slice(0,10);const settings=this.env as CapacitySettings;const quotas=publicQuotaLimits(settings);const requestGlobal=this.ctx.storage.sql.exec<{count:number}>('SELECT count FROM request_counts WHERE key=?',`global:${minute}`).toArray()[0]?.count??0;const requestClient=this.ctx.storage.sql.exec<{count:number}>('SELECT count FROM request_counts WHERE key=?',`client:${client}:${minute}`).toArray()[0]?.count??0;const modelGlobal=this.ctx.storage.sql.exec<{value:number}>('SELECT COUNT(*) AS value FROM calls WHERE day=?',day).one().value;const modelClient=this.ctx.storage.sql.exec<{value:number}>('SELECT COUNT(*) AS value FROM calls WHERE session=? AND day=?',client,day).one().value;
    const provider=(name:LiveProvider)=>{const dispatches=this.ctx.storage.sql.exec<{value:number}>('SELECT COUNT(*) AS value FROM calls WHERE provider=? AND day=?',name,day).one().value;const reserved=this.ctx.storage.sql.exec<{value:number}>('SELECT COALESCE(SUM(COALESCE(actual,reserved)),0) AS value FROM calls WHERE provider=?',name).one().value;const ceiling=providerCeiling(name,settings);const dailyLimit=name==='Baseten'?basetenDailyLimit(settings):quotas.globalModelCallsPerDay;return {capacityAvailable:ceiling!==null&&reserved<ceiling&&dispatches<dailyLimit,remainingDispatches:Math.max(0,Math.min(quotas.globalModelCallsPerDay-modelGlobal,quotas.clientModelCallsPerDay-modelClient,dailyLimit-dispatches))};};
    return {requests:{globalRemaining:Math.max(0,quotas.globalRequestsPerMinute-requestGlobal),clientRemaining:Math.max(0,quotas.clientRequestsPerMinute-requestClient),resetsAt:new Date(Math.floor(now.getTime()/60_000)*60_000+60_000).toISOString()},modelCalls:{globalRemaining:Math.max(0,quotas.globalModelCallsPerDay-modelGlobal),clientRemaining:Math.max(0,quotas.clientModelCallsPerDay-modelClient),resetsAt:`${new Date(now.getTime()+86_400_000).toISOString().slice(0,10)}T00:00:00.000Z`},providers:{meta:provider('Meta'),baseten:provider('Baseten')}};
  }
}
export function estimateMicroUsd(inputBytes:number,outputTokens:number,modelId:ModelId='muse-spark-1.3'):number {const model=modelConfig(modelId);return Math.ceil(inputBytes*model.inputUsdPerMillion+outputTokens*model.outputUsdPerMillion);}
export function actualMicroUsd(inputTokens:number,outputTokens:number,modelId:ModelId='muse-spark-1.3'):number{const model=modelConfig(modelId);return Math.ceil(inputTokens*model.inputUsdPerMillion+outputTokens*model.outputUsdPerMillion);}
