import type {LiveProvider,CapacityCode} from './budget';

export type RequestPurpose='WORKFLOW_EXTRACTION'|'COUNTERFACTUAL_INVESTIGATION'|'SAFEGUARD_PROPOSAL'|'MODEL_ONLY_EVALUATION'|'CHALLENGER_ANALYSIS';
export type FallbackStatus='NONE'|'FALLBACK_SOURCE'|'FALLBACK_TARGET';
export type ProviderResult='SUCCEEDED'|'CAPACITY_REJECTED'|'PROVIDER_FAILURE'|'TIMEOUT'|'CANCELLED'|'MALFORMED_OUTPUT';
export type ProviderAttempt={correlationId:string;provider:LiveProvider;modelId:string;requestPurpose:RequestPurpose;latencyMs:number;inputTokens:number|null;outputTokens:number|null;fallbackStatus:FallbackStatus;result:ProviderResult;capacityCode?:CapacityCode;providerStatus?:number};

export function logProviderAttempt(event:ProviderAttempt):void {
  const payload={event:'provider_attempt',...event};
  const serialized=JSON.stringify(payload);
  if(event.result==='SUCCEEDED')console.log(serialized);
  else if(event.result==='CAPACITY_REJECTED'||event.result==='CANCELLED')console.warn(serialized);
  else console.error(serialized);
}
