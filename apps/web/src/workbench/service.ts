import {call} from '../useInvestigation';
import {WorkflowSchema} from '@minsk/contracts';
export const validateWorkflow=(value:unknown)=>WorkflowSchema.parse(value);
export async function verifyCertificate(certificate:unknown,workflow:unknown){return call('/api/v1/reports/verify',{certificate,workflow});}
export function download(name:string,body:unknown){const url=URL.createObjectURL(new Blob([JSON.stringify(body,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
