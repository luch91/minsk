import { useEffect, useRef, useState } from 'react';
import type { EvaluationResult, Intervention, Workflow } from '@minsk/contracts';
import { missingApproval } from '../../../fixtures/workflows/missing-approval';

export type ModelRecord = { id: string | null; modelId: string; provider: string; role: string; usage: unknown; accountingStatus: string };
export type Investigation = { investigationId?: string; baseline: EvaluationResult; intervention: Intervention; failure: EvaluationResult; verification: { repaired: EvaluationResult; safeguard: { stepId: string; conditionId: string }; resolved: boolean } | null; trace: Array<{ id: string; tool: string; status: string; arguments: unknown; result: unknown; modelId?: string; responseId?: string | null }>; routing?: {modelId:string;reason:string;escalated:boolean}; model: ModelRecord };
export type Scenario = 'BASELINE' | 'COUNTERFACTUAL' | 'SAFEGUARD';
export type ProviderStatus = 'loading' | 'available' | 'capacity_exhausted' | 'disabled' | 'unavailable';
type ProviderAvailability={meta:ProviderStatus;baseten:ProviderStatus;error:string;remaining:{meta:number|null;baseten:number|null;global:number|null;client:number|null}};
const API = import.meta.env.VITE_API_URL || '';
const sessionKey='minsk-public-session';
let ephemeralSession:string|undefined;
function sessionId(){try{const existing=localStorage.getItem(sessionKey);if(existing)return existing;}catch{/* Storage is optional. */}const created=ephemeralSession??=[...crypto.getRandomValues(new Uint8Array(16))].map(n=>n.toString(16).padStart(2,'0')).join('');try{localStorage.setItem(sessionKey,created);}catch{/* Keep a stable session in memory when storage is blocked. */}return created;}
export async function call<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API}${path}`, { method: body ? 'POST' : 'GET', headers: { ...(body ? { 'Content-Type': 'application/json' } : {}),'X-Minsk-Session':sessionId() }, body: body ? JSON.stringify(body) : undefined, signal });
  if (!response.headers.get('content-type')?.includes('application/json')) throw new Error(`API returned ${response.status} without JSON. Check the configured API URL.`);
  const result = await response.json();
  if (!response.ok) {
    const reference=response.headers.get('X-Correlation-ID')||result.correlationId;
    throw new Error(`${result.error || `Request failed: ${response.status}`}${reference?` Reference: ${reference}`:''}`);
  }
  return result as T;
}

export function useInvestigation() {
  const [samples, setSamples] = useState<Workflow[]>([missingApproval]);
  const [workflow, setWorkflow] = useState<Workflow | null>(missingApproval);
  const [selected, setSelected] = useState<string | null>(missingApproval.steps[0]?.id ?? missingApproval.conditions[0]?.id ?? null);
  const [source, setSource] = useState(missingApproval.sourceDocuments[0]?.text ?? '');
  const [baseline, setBaseline] = useState<EvaluationResult | null>(null);
  const [failure, setFailure] = useState<EvaluationResult | null>(null);
  const [verification, setVerification] = useState<Investigation['verification']>(null);
  const [intervention, setIntervention] = useState<Intervention | null>(null);
  const [applied, setApplied] = useState<Intervention | null>(null);
  const [trace, setTrace] = useState<Investigation['trace']>([]);
  const [model, setModel] = useState<Investigation['model'] | null>(null);
  const [modelCallCount, setModelCallCount] = useState(0);
  const [extractionModel, setExtractionModel] = useState<ModelRecord | null>(null);
  const [routing, setRouting] = useState<Investigation['routing']>(undefined);
  const [investigationId, setInvestigationId] = useState<string | null>(null);
  const [scenario, setScenario] = useState<Scenario>('BASELINE');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [liveEnabled, setLiveEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState<unknown>(null);
  const [benchmark, setBenchmark] = useState<unknown>(null);
  const [challenger,setChallenger]=useState<unknown>(null);
  const [challengerEnabled,setChallengerEnabled]=useState(false);
  const [providerStatus,setProviderStatus]=useState<ProviderAvailability>({meta:'loading',baseten:'loading',error:'',remaining:{meta:null,baseten:null,global:null,client:null}});
  const controller = useRef<AbortController | null>(null);
  const revision = useRef(0);

  useEffect(() => {
    const ac = new AbortController();
    const initialRevision=revision.current;
    let acceptedRevision=initialRevision;
    const loadSamples=call<{ samples: Workflow[] }>('/api/v1/samples', undefined, ac.signal).then(async response => {
      if (ac.signal.aborted) return;
      setSamples(response.samples.length?response.samples:[missingApproval]);
      const first=response.samples.find(sample=>sample.id==='missing-approval')??response.samples[0];
      if(!first||revision.current!==initialRevision||JSON.stringify(first)===JSON.stringify(missingApproval))return;
      acceptedRevision=++revision.current;
      setWorkflow(first);setSelected(first.steps[0]?.id??first.conditions[0]?.id??null);setSource(first.sourceDocuments[0]?.text??'');setBaseline(null);
      const evaluated=await call<{result:EvaluationResult}>('/api/v1/experiments/run',{workflow:first},ac.signal);
      if(!ac.signal.aborted&&revision.current===acceptedRevision)setBaseline(evaluated.result);
    }).catch(e => { if (!ac.signal.aborted&&revision.current===acceptedRevision) setError(e instanceof Error?e.message:'Workflow library request failed'); });
    const loadBaseline=call<{ result: EvaluationResult }>('/api/v1/experiments/run', { workflow: missingApproval }, ac.signal).then(evaluated => {
      if (!ac.signal.aborted&&revision.current===initialRevision) setBaseline(evaluated.result);
    }).catch(e => { if (!ac.signal.aborted&&revision.current===initialRevision) setError(e instanceof Error?e.message:'Initial evaluation failed'); });
    Promise.allSettled([loadSamples,loadBaseline]).finally(() => { if (!ac.signal.aborted) setLoading(false); });
    refreshBudget(ac.signal);
    return () => { ac.abort(); controller.current?.abort(); };
  }, []);

  async function refreshBudget(signal?:AbortSignal) {
    setProviderStatus(previous=>({...previous,meta:'loading',baseten:'loading',error:''}));
    try {
      const x=await call<{liveModelEnabled:boolean;publicChallengerEnabled:boolean;providers:{meta:{state:ProviderStatus;remainingDispatches:number};baseten:{state:ProviderStatus;remainingDispatches:number}};availability:{modelCalls:{globalRemaining:number;clientRemaining:number}}}>('/api/v1/budget',undefined,signal);
      if(signal?.aborted)return;
      setLiveEnabled(x.liveModelEnabled);setChallengerEnabled(x.publicChallengerEnabled);
      setProviderStatus({meta:x.providers.meta.state,baseten:x.providers.baseten.state,error:'',remaining:{meta:x.providers.meta.remainingDispatches,baseten:x.providers.baseten.remainingDispatches,global:x.availability.modelCalls.globalRemaining,client:x.availability.modelCalls.clientRemaining}});
    } catch(e) {
      if(signal?.aborted)return;
      setLiveEnabled(false);setChallengerEnabled(false);
      setProviderStatus({meta:'unavailable',baseten:'unavailable',error:e instanceof Error?e.message:'Provider status request failed',remaining:{meta:null,baseten:null,global:null,client:null}});
    }
  }

  async function run<T>(label: string, operation: (signal: AbortSignal) => Promise<T>, done: (value: T) => void) {
    controller.current?.abort(); const ac = new AbortController(); controller.current = ac; setBusy(label); setError('');
    try { const value = await operation(ac.signal); if (!ac.signal.aborted) { done(value); return value; } }
    catch (e) { if (!ac.signal.aborted) setError(e instanceof Error ? e.message : 'Request failed'); }
    finally { if (controller.current === ac) { setBusy(''); controller.current = null; } }
  }
  function reset(next: Workflow, preserveExtraction = false) {
    revision.current++;
    setWorkflow(next); setSource(next.sourceDocuments[0]?.text ?? ''); setSelected(next.steps[0]?.id ?? null); setBaseline(null); setFailure(null); setVerification(null); setIntervention(null); setApplied(null); setTrace([]); setModel(null); if (!preserveExtraction) setExtractionModel(null); setCertificate(null);setChallenger(null); setRouting(undefined); setInvestigationId(null); setScenario('BASELINE');
  }
  function selectWorkflow(next: Workflow) {
    revision.current++;
    const preserveExtraction = workflow?.id === next.id && JSON.stringify(workflow.sourceDocuments) === JSON.stringify(next.sourceDocuments);
    return run('Evaluating workflow', async s => {
      const validated = await call<{workflow:Workflow}>('/api/v1/workflows/validate', next, s);
      const evaluated = await call<{result:EvaluationResult}>('/api/v1/experiments/run', {workflow:validated.workflow}, s);
      return {...evaluated,workflow:validated.workflow};
    }, x => {reset(x.workflow,preserveExtraction);setBaseline(x.result);});
  }
  function loadWorkflowJson(text:string) { return selectWorkflow(JSON.parse(text)); }
  function editCondition(id: string, value: boolean | null) { if (workflow) return selectWorkflow({ ...workflow, conditions: workflow.conditions.map(c => c.id === id ? { ...c, observedValue: value } : c) }); }
  function editConditionDetails(id:string,patch:Partial<Pick<Workflow['conditions'][number],'name'|'expectedValue'|'freshnessRequirement'|'observedAt'|'sourceSpans'>>) {if(workflow)return selectWorkflow({...workflow,conditions:workflow.conditions.map(c=>c.id===id?{...c,...patch}:c)});}
  function editConditionEvidence(id:string,excerpt:string){if(workflow){const source=workflow.sourceDocuments[0];if(!source)return;const startOffset=source.text.indexOf(excerpt);if(startOffset<0){setError('Evidence must be an exact excerpt from the workflow source.');return;}return editConditionDetails(id,{sourceSpans:[{sourceId:source.id,startOffset,endOffset:startOffset+excerpt.length,excerpt,verified:true}]});}}
  function editRulePredicate(id:string,predicate:'ALL'|'ANY'){if(workflow)return selectWorkflow({...workflow,policyRules:workflow.policyRules.map(rule=>rule.id===id?{...rule,predicate}:rule)});}
  function editRuleEvidence(id:string,excerpt:string){if(workflow){const rule=workflow.policyRules.find(item=>item.id===id);const source=workflow.sourceDocuments[0];if(!rule||!source)return;const startOffset=source.text.indexOf(excerpt);if(startOffset<0){setError('Evidence must be an exact excerpt from the workflow source.');return;}return selectWorkflow({...workflow,policyRules:workflow.policyRules.map(item=>item.id===id?{...item,sourceSpans:[{sourceId:source.id,startOffset,endOffset:startOffset+excerpt.length,excerpt,verified:true}]}:item)});}}
  function toggleGate(stepId: string, conditionId: string) { if (workflow) return selectWorkflow({ ...workflow, steps: workflow.steps.map(step => step.id === stepId ? { ...step, executionGateIds: step.executionGateIds.includes(conditionId) ? step.executionGateIds.filter(id => id !== conditionId) : [...step.executionGateIds, conditionId] } : step) }); }
  function selectCondition(id: string) {
    const c = workflow?.conditions.find(item => item.id === id);
    setIntervention(c ? { id: `user-${c.id}`, targetConditionId: c.id, originalValue: c.observedValue, replacementValue: c.observedValue === true ? false : true, reason: 'Manual counterfactual', proposedBy: 'USER', validated: true } : null);
  }
  async function analyze() { const response=await run('Extracting workflow', async s => {const extracted=await call<{ workflow: Workflow; model: ModelRecord }>('/api/v1/workflows/extract', { text: source }, s);const evaluated=await call<{result:EvaluationResult}>('/api/v1/experiments/run',{workflow:extracted.workflow},s);return {extracted,evaluated};},x=>{reset(x.extracted.workflow);setExtractionModel(x.extracted.model);setModelCallCount(n => n + 1);setBaseline(x.evaluated.result);});await refreshBudget();return response; }
  function applyIntervention(next = intervention) {
    if (!workflow || !next) return;
    return run('Evaluating counterfactual', s => call<{ result: EvaluationResult }>('/api/v1/experiments/run', { workflow, intervention: next }, s), x => { setIntervention(next); setApplied(next); setFailure(x.result); setVerification(null); setScenario('COUNTERFACTUAL'); setTrace([]); setModel(null); setRouting(undefined); setInvestigationId(null); setCertificate(null); setChallenger(null); });
  }
  async function investigate() {
    if (!workflow) return;
    const response=await run('Meta investigation', s => call<Investigation>('/api/v1/investigations', { workflow, ...(intervention?{targetConditionId:intervention.targetConditionId}:{}) }, s), x => { setCertificate(null); setChallenger(null); setBaseline(x.baseline); setIntervention(x.intervention); setApplied(x.intervention); setFailure(x.failure); setVerification(x.verification); setTrace(x.trace); setModel(x.model); setModelCallCount(n => n + new Set([x.model.id, ...x.trace.map(t => t.responseId)].filter(Boolean)).size); setRouting(x.routing); setInvestigationId(x.investigationId ?? null); setScenario('COUNTERFACTUAL'); });
    await refreshBudget();return response;
  }
  function demonstrate(next:Workflow) {
    const target=next.conditions.find(condition=>condition.id==='human-approval')??next.conditions.find(condition=>next.policyRules.some(rule=>rule.requiredConditionIds.includes(condition.id)&&!next.steps.find(step=>step.id===rule.subjectStepId)?.executionGateIds.includes(condition.id)))??next.conditions[0];
    if(!target){setError('The prepared workflow has no condition to demonstrate.');return;}
    const replacement=target.valueType==='BOOLEAN'?false:target.observedValue;
    const demonstration:Intervention={id:`deterministic-${target.id}`,targetConditionId:target.id,originalValue:target.observedValue,replacementValue:replacement,reason:'Prepared deterministic demonstration',proposedBy:'USER',validated:true};
    return run('Running deterministic demonstration',async s=>{const validated=await call<{workflow:Workflow}>('/api/v1/workflows/validate',next,s);const baselineResult=await call<{result:EvaluationResult}>('/api/v1/experiments/run',{workflow:validated.workflow},s);const changedResult=await call<{result:EvaluationResult}>('/api/v1/experiments/run',{workflow:validated.workflow,intervention:demonstration},s);return {workflow:validated.workflow,baseline:baselineResult.result,failure:changedResult.result,intervention:demonstration};},value=>{reset(value.workflow);setBaseline(value.baseline);setIntervention(value.intervention);setApplied(value.intervention);setFailure(value.failure);setScenario('COUNTERFACTUAL');});
  }
  function verify() {
    if (!workflow || !applied) return;
    const stepId = workflow.policyRules.find(rule => rule.requiredConditionIds.includes(applied.targetConditionId))?.subjectStepId;
    if (!stepId) {setError('This condition is not required by a policy rule. Choose a policy condition before verifying a safeguard.');return;}
    return run('Verifying safeguard', s => call<{ repaired: EvaluationResult; resolved: boolean }>('/api/v1/safeguards/verify', { workflow, intervention: applied, stepId, conditionId: applied.targetConditionId }, s), x => { setCertificate(null); if(verification&&(verification.safeguard.stepId!==stepId||verification.safeguard.conditionId!==applied.targetConditionId))setInvestigationId(null); setVerification({ ...x, safeguard: { stepId, conditionId: applied.targetConditionId } }); setScenario('SAFEGUARD'); });
  }
  function exportCertificate() {
    if (!workflow || !baseline || !failure || !applied) return;
    return run('Exporting certificate', s => call<unknown>('/api/v1/reports/export', { workflow, investigation: { investigationId: investigationId ?? undefined, baseline, intervention: applied, failure, verification, trace, model } }, s), report => {
      setCertificate(report);const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'minsk-certificate.json'; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }
  function loadBenchmark(){return run('Running benchmark',s=>call<unknown>('/api/v1/benchmark',undefined,s),setBenchmark);}
  async function runChallenger(){if(!workflow)return;const response=await run('Running Baseten challenger',s=>call<unknown>('/api/v1/challengers/open-weight',{workflow,...(investigationId&&applied?{hosted:{investigationId,intervention:applied}}:{})},s),value=>{setChallenger(value);setModelCallCount(n=>n+1);});await refreshBudget();return response;}
  const result = scenario === 'SAFEGUARD' ? verification?.repaired ?? baseline : scenario === 'COUNTERFACTUAL' ? failure ?? baseline : baseline;
  const sceneWorkflow = workflow && scenario === 'SAFEGUARD' && verification ? { ...workflow, steps: workflow.steps.map(step => step.id === verification.safeguard.stepId && !step.executionGateIds.includes(verification.safeguard.conditionId) ? { ...step, executionGateIds: [...step.executionGateIds, verification.safeguard.conditionId] } : step) } : workflow;
  return { modelCallCount, setError, samples, workflow, sceneWorkflow, selected, setSelected, source, setSource, baseline, failure, verification, intervention, applied, trace, model, extractionModel, routing, scenario, setScenario, result, busy, error, liveEnabled, challengerEnabled,providerStatus,refreshBudget,challenger,runChallenger,loading, certificate, benchmark, loadBenchmark,loadWorkflowJson, selectWorkflow, selectCondition, editCondition, editConditionDetails,editConditionEvidence,editRulePredicate,editRuleEvidence,toggleGate, analyze, applyIntervention, investigate, demonstrate, verify, exportCertificate, cancel: () => controller.current?.abort() };
}
export type InvestigationState = ReturnType<typeof useInvestigation>;
