import {describe,it,expect} from 'vitest';
import {scoreExtraction,summarize,type ScoreRow} from '../../../model-evaluation/scoring';
import {missingApproval} from '../../../fixtures/workflows/missing-approval';
import {expectedInvalidCase} from '../../../model-evaluation/invalid-cases';
import {runBenchmark} from './benchmark';
import {evaluate} from '@minsk/simulator';
const row=(patch:Partial<ScoreRow>={}):ScoreRow=>({caseId:'H01',task:'baseten',reference:{outcome:'UNSAFE_EXECUTION',repair:'SAFE_BLOCK'},outcome:'UNSAFE_EXECUTION',targetMatched:true,...patch});
describe('benchmark scoring boundaries',()=>{
 it('keeps failed and missing candidates in the attempted denominator',()=>{const s=summarize([row(),row({error:'provider failed',outcome:null}),row({outcome:null,targetMatched:false})],8);expect(s).toMatchObject({attempted:3,notAttempted:5,classified:1,unclassified:2,errors:1,agreementPerAttempt:1/3,agreementAcrossPlannedCases:1/8,missedUnsafeCases:2});});
 it('marks classification metrics as inapplicable for extraction',()=>{expect(summarize([row({task:'spark-extraction',extractionCorrect:true,outcome:null})],1)).toMatchObject({classified:null,agreementPerAttempt:null,missedUnsafeCases:null});});
 it('rejects coincidentally correct outcomes for another target',()=>{expect(summarize([row({targetMatched:false})],1)).toMatchObject({outcomeCorrect:0,agreementPerAttempt:0,missedUnsafeCases:1});});
 it('separates abstention and correct indeterminate handling from true negatives',()=>{const s=summarize([row({reference:{outcome:'SAFE_BLOCK',repair:null},outcome:'INDETERMINATE'}),row({reference:{outcome:'INDETERMINATE',repair:null},outcome:'INDETERMINATE'})],2);expect(s).toMatchObject({trueNegative:0,abstainedOnDeterminate:1,unknownCorrect:1});});
 it('scores every extraction dimension and detects extra gates, missing evidence and wrong support observations',()=>{const workflow=structuredClone(missingApproval);expect(Object.values(scoreExtraction(workflow,workflow)).every(Boolean)).toBe(true);const changed=structuredClone(workflow);changed.conditions[1]!.observedValue=false;changed.steps[0]!.executionGateIds=[];changed.conditions[0]!.sourceSpans=[];expect(scoreExtraction(changed,workflow)).toMatchObject({observations:false,gates:false,evidence:false});});
 it('does not treat arbitrary crashes as expected invalid input',async()=>{expect(expectedInvalidCase('MFB-11',new Error('transport crash'))).toBe(false);const report=await runBenchmark((async()=>{throw new Error('transport crash');}) as typeof evaluate);expect(report.passed).toBe(0);expect(report.rows.every(r=>r.unexpectedError==='transport crash')).toBe(true);});
 it('accepts only the locked invalid-case messages',async()=>{const report=await runBenchmark();expect(report.passed).toBe(12);expect(report.rows.filter(r=>r.validationError).map(r=>r.id)).toEqual(['MFB-11','MFB-12']);});
});
