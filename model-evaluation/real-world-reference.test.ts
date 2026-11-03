import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe,expect,it} from 'vitest';
import {evaluate,hash,validateWorkflow,verifySafeguard} from '../packages/simulator/src/index';
import {verifyCertificate} from '../packages/simulator/src/certificate';

const root=resolve(import.meta.dirname,'..');
const readJson=(path:string)=>JSON.parse(readFileSync(resolve(root,path),'utf8')) as Record<string,any>;
const evidence=readJson('model-evaluation/real-world-extraction-2026-11-02.json');
const raw=readJson(evidence.modelOutput.rawStructuredExtractionFile);
const corrected=readJson(evidence.corrections.correctedWorkflowFile);
const certificate=readJson(evidence.certificate.file);
const now=new Date('2026-11-03T08:00:00.000Z');

describe('verified real-world reference case',()=>{
  it('pins a licensed immutable source and verifies every excerpt offset',()=>{
    const source=readFileSync(resolve(root,evidence.source.snapshotFile),'utf8');
    expect(createHash('sha256').update(source).digest('hex')).toBe(evidence.source.sha256);
    expect(evidence.source.canonicalUrl).toContain(evidence.source.revision);
    expect(evidence.source.licence.spdx).toBe('MIT');
    for(const span of evidence.extractedText.excerpts)expect(source.slice(span.startOffset,span.endOffset)).toBe(span.excerpt);
  });
  it('preserves the raw extraction and its indeterminate result',async()=>{
    expect(validateWorkflow(raw)).toEqual(raw);
    expect((await evaluate(raw,undefined,new Date('2026-11-02T21:00:24.552Z'))).outcome).toBe('INDETERMINATE');
    expect(evidence.modelOutput.deterministicOutcome).toBe('INDETERMINATE');
  });
  it('applies the confirmed OR selector and historical-policy correction',()=>{
    const workflow=validateWorkflow(corrected);
    expect(workflow.conditions.filter(item=>item.id.startsWith('c_branch_'))).toHaveLength(0);
    expect(workflow.conditions.find(item=>item.id==='c_review_branch')?.sourceSpans[0]?.excerpt).toContain(' || ');
    expect(workflow.steps.find(item=>item.id==='s_verify_preview')?.executionGateIds).toEqual(['c_review_branch']);
    expect(evidence.corrections.interpretation).toContain('The isolated-preview step is historical reference evidence and is not current production deployment policy.');
  });
  it('reproduces the baseline, unsafe counterfactual and verified safe block',async()=>{
    const intervention=evidence.counterfactual.exactIntervention;
    const result=await verifySafeguard(corrected,intervention,'s_verify_preview','c_live_model',now);
    expect(result.baseline).toEqual(evidence.simulation.result);
    expect(result.failure).toEqual(evidence.counterfactual.result);
    expect(result.repaired).toEqual(evidence.safeguard.result);
    expect({baseline:result.baseline.outcome,counterfactual:result.failure.outcome,safeguard:result.repaired.outcome,resolved:result.resolved}).toEqual({baseline:'SAFE_BLOCK',counterfactual:'UNSAFE_EXECUTION',safeguard:'SAFE_BLOCK',resolved:true});
  });
  it('binds the corrected source, workflow and outcomes in a verified certificate',async()=>{
    expect(await hash(corrected)).toBe(evidence.certificate.workflowHash);
    expect(await hash(corrected.sourceDocuments)).toBe(evidence.certificate.sourceHash);
    expect(certificate.integrityHash).toBe(evidence.certificate.integrityHash);
    expect(await verifyCertificate(certificate,corrected)).toEqual({valid:true,errors:[],inputVerified:true,provenanceAuthenticity:'NOT_VERIFIED'});
  });
});
