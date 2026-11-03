import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import type {Intervention,Workflow} from '@minsk/contracts';
import {EVALUATOR_VERSION,evaluate,hash,validateWorkflow,verifySafeguard} from '../packages/simulator/src/index';
import {verifyCertificate} from '../packages/simulator/src/certificate';

const root=resolve(import.meta.dirname,'..');
const referenceDir=resolve(root,'model-evaluation/real-world-reference');
const sourcePath=resolve(referenceDir,'source-ci-0769cb1.yml');
const rawExtractionPath=resolve(referenceDir,'raw-meta-extraction.json');
const source=readFileSync(sourcePath,'utf8');
const rawExtraction=validateWorkflow(JSON.parse(readFileSync(rawExtractionPath,'utf8')));
const generatedAt='2026-11-03T08:00:00.000Z';
const now=new Date(generatedAt);
const sha256=(value:string|Buffer)=>createHash('sha256').update(value).digest('hex');
const sourceSha256=sha256(source);

function evidence(excerpt:string){
  const startOffset=source.indexOf(excerpt);
  if(startOffset<0)throw new Error(`Missing frozen-source excerpt: ${excerpt}`);
  return {sourceId:'ci-0769cb1',startOffset,endOffset:startOffset+excerpt.length,excerpt,verified:true};
}

const branchExpression="github.head_ref == 'feat/approved-workbench-integration' || github.head_ref == 'fix/scenario-guidance' || github.head_ref == 'fix/audit-correctness'";
const correctedWorkflow:Workflow={
  schemaVersion:'1.0.0',
  id:'real-ci-review-isolation-corrected',
  title:'Historical CI review isolation verification',
  sourceDocuments:[{id:'ci-0769cb1',text:source,contentHash:sourceSha256,createdAt:'2026-11-02T21:00:03.661Z',schemaVersion:'1.0.0'}],
  conditions:[
    {id:'c_review_branch',name:'Head ref is an allowed historical review branch',valueType:'BOOLEAN',expectedValue:true,observedValue:true,sourceSpans:[evidence(branchExpression)],freshnessRequirement:null,observedAt:null},
    {id:'c_live_model',name:'Review API live model disabled',valueType:'BOOLEAN',expectedValue:false,observedValue:false,sourceSpans:[evidence('b.liveModelEnabled')],freshnessRequirement:null,observedAt:null},
    {id:'c_open_weight',name:'Review API open-weight provider disabled',valueType:'BOOLEAN',expectedValue:false,observedValue:false,sourceSpans:[evidence('b.openWeightEnabled')],freshnessRequirement:null,observedAt:null},
    {id:'c_public_challenger',name:'Review API public challenger disabled',valueType:'BOOLEAN',expectedValue:false,observedValue:false,sourceSpans:[evidence('b.publicChallengerEnabled')],freshnessRequirement:null,observedAt:null},
    {id:'c_key_present',name:'Review API provider key absent',valueType:'BOOLEAN',expectedValue:false,observedValue:false,sourceSpans:[evidence('b.configuration?.keyPresent')],freshnessRequirement:null,observedAt:null},
    {id:'c_source_commit_mismatch',name:'Preview source commit mismatch absent',valueType:'BOOLEAN',expectedValue:false,observedValue:false,sourceSpans:[evidence('b.sourceCommit!==process.env.MINSK_EXPECTED_COMMIT')],freshnessRequirement:null,observedAt:null},
    {id:'c_api_origin_mismatch',name:'Preview API origin mismatch absent',valueType:'BOOLEAN',expectedValue:false,observedValue:false,sourceSpans:[evidence('b.apiOrigin!==process.env.MINSK_API_URL')],freshnessRequirement:null,observedAt:null}
  ],
  policyRules:[
    {id:'p_api_isolation',description:'Historical review API requires all providers disabled and no provider key',subjectStepId:'s_verify_preview',predicate:'ALL',requiredConditionIds:['c_live_model','c_open_weight','c_public_challenger','c_key_present'],sourceSpans:[evidence('Review API must have all providers disabled and no provider key')],origin:'USER_CONFIRMED'},
    {id:'p_preview_identity',description:'Historical preview must match the tested source and isolated API',subjectStepId:'s_verify_preview',predicate:'ALL',requiredConditionIds:['c_source_commit_mismatch','c_api_origin_mismatch'],sourceSpans:[evidence('Preview does not match the tested source and isolated API')],origin:'USER_CONFIRMED'}
  ],
  steps:[
    {id:'s_install',name:'Install dependencies',actionType:'CHECK',dependsOn:[],executionGateIds:[],sourceSpans:[evidence('pnpm install --frozen-lockfile')]},
    {id:'s_build',name:'Build application',actionType:'CHECK',dependsOn:['s_install'],executionGateIds:[],sourceSpans:[evidence('pnpm build')]},
    {id:'s_e2e',name:'Run local browser suite',actionType:'CHECK',dependsOn:['s_build'],executionGateIds:[],sourceSpans:[evidence('pnpm e2e --max-failures=1')]},
    {id:'s_verify_preview',name:'Verify isolated deployed preview',actionType:'CHECK',dependsOn:['s_e2e'],executionGateIds:['c_review_branch'],sourceSpans:[evidence('Verify isolated deployed preview')]},
    {id:'s_e2e_public',name:'Run browser suite against historical preview',actionType:'CHECK',dependsOn:['s_verify_preview'],executionGateIds:['c_review_branch'],sourceSpans:[evidence('pnpm e2e --max-failures=1 --output=test-results-public')]}
  ]
};

validateWorkflow(correctedWorkflow);
const intervention:Intervention={id:'cf-enable-live-model-on-review-api',targetConditionId:'c_live_model',originalValue:false,replacementValue:true,reason:'Test whether the historical review step would still execute if live inference were enabled',proposedBy:'USER',validated:true};
const verification=await verifySafeguard(correctedWorkflow,intervention,'s_verify_preview','c_live_model',now);
if(verification.baseline.outcome!=='SAFE_BLOCK'||verification.failure.outcome!=='UNSAFE_EXECUTION'||verification.repaired.outcome!=='SAFE_BLOCK'||!verification.resolved)throw new Error('Real-world reference outcomes changed');

const certificateBody={
  certificateVersion:'1' as const,
  sourceHash:await hash(correctedWorkflow.sourceDocuments),
  graphHash:await hash(correctedWorkflow),
  baseline:verification.baseline,
  intervention,
  evaluationResult:verification.failure,
  violatedRules:verification.failure.policyResults.filter(rule=>rule.state==='VIOLATED').map(rule=>rule.ruleId),
  affectedPath:verification.failure.affectedNodeIds,
  safeguard:{stepId:'s_verify_preview',conditionId:'c_live_model'},
  verificationResult:verification.repaired,
  modelMetadata:null,
  evaluationMetadata:{evaluatorVersion:EVALUATOR_VERSION,generatedAt}
};
const certificate={...certificateBody,integrityHash:await hash(certificateBody)};
const certificateVerification=await verifyCertificate(certificate,correctedWorkflow);
if(!certificateVerification.valid||!certificateVerification.inputVerified)throw new Error(`Generated certificate failed verification: ${certificateVerification.errors.join('; ')}`);

const correctedText=`${JSON.stringify(correctedWorkflow,null,2)}\n`;
const experiment={
  intervention,
  baseline:verification.baseline,
  counterfactual:verification.failure,
  safeguard:{operation:'ADD_EXECUTION_GATE',stepId:'s_verify_preview',conditionId:'c_live_model',verificationStatus:verification.verificationStatus,resolved:verification.resolved,result:verification.repaired}
};
const experimentText=`${JSON.stringify(experiment,null,2)}\n`;
const certificateText=`${JSON.stringify(certificate,null,2)}\n`;
const rawExtractionText=readFileSync(rawExtractionPath,'utf8');
const originalEvaluation=await evaluate(rawExtraction,undefined,new Date('2026-11-02T21:00:24.552Z'));
const excerpts=[...correctedWorkflow.conditions,...correctedWorkflow.policyRules,...correctedWorkflow.steps].flatMap(entity=>entity.sourceSpans.map(span=>({entityId:entity.id,startOffset:span.startOffset,endOffset:span.endOffset,excerpt:span.excerpt})));
const caseManifest={
  version:'2',
  caseId:'RW-CI-01',
  classification:'Verified historical public configuration reference; excluded from synthetic benchmark and accuracy metrics',
  source:{
    canonicalUrl:'https://github.com/luch91/minsk/blob/0769cb10564c9c56f4e9467e98e4c6151e21426f/.github/workflows/ci.yml',
    repositoryPath:'.github/workflows/ci.yml',
    revision:'0769cb10564c9c56f4e9467e98e4c6151e21426f',
    retrievedAt:'2026-11-02',
    licence:{spdx:'MIT',url:'https://github.com/luch91/minsk/blob/0769cb10564c9c56f4e9467e98e4c6151e21426f/LICENSE'},
    snapshotFile:'model-evaluation/real-world-reference/source-ci-0769cb1.yml',
    sha256:sourceSha256
  },
  extractedText:{snapshotFile:'model-evaluation/real-world-reference/source-ci-0769cb1.yml',excerpts},
  modelOutput:{rawStructuredExtractionFile:'model-evaluation/real-world-reference/raw-meta-extraction.json',sha256:sha256(rawExtractionText),validation:'VALID',deterministicOutcome:originalEvaluation.outcome},
  corrections:{
    confirmedAt:'2026-11-03',
    confirmedBy:'Repository owner',
    confirmationBasis:'Phase 1 established approved-workbench as a historical deterministic-review resource and the owner directed completion of Phase 2.',
    interpretation:[
      'The three head-ref comparisons form one OR branch selector, not three simultaneous execution gates.',
      'The isolated-preview step is historical reference evidence and is not current production deployment policy.',
      'Corrected observed values are explicit deterministic scenario assumptions, not claims inferred from static YAML.'
    ],
    correctedWorkflowFile:'model-evaluation/real-world-reference/corrected-workflow.json',
    workflowSha256:sha256(correctedText)
  },
  simulation:{kind:'BASELINE',result:verification.baseline},
  counterfactual:{exactIntervention:intervention,result:verification.failure},
  safeguard:{exactChange:{operation:'ADD_EXECUTION_GATE',stepId:'s_verify_preview',conditionId:'c_live_model'},verificationStatus:verification.verificationStatus,resolved:verification.resolved,result:verification.repaired},
  certificate:{file:'model-evaluation/real-world-reference/certificate.json',sha256:sha256(certificateText),sourceHash:certificate.sourceHash,workflowHash:certificate.graphHash,outcome:certificate.evaluationResult.outcome,verified:certificateVerification.valid,inputVerified:certificateVerification.inputVerified,integrityHash:certificate.integrityHash}
};
const manifestText=`${JSON.stringify(caseManifest,null,2)}\n`;

const outputs=new Map([
  [resolve(referenceDir,'corrected-workflow.json'),correctedText],
  [resolve(referenceDir,'counterfactual-and-safeguard.json'),experimentText],
  [resolve(referenceDir,'certificate.json'),certificateText],
  [resolve(root,'model-evaluation/real-world-extraction-2026-11-02.json'),manifestText]
]);
const check=process.argv.includes('--check');
for(const[path,content]of outputs){
  if(check){if(readFileSync(path,'utf8')!==content)throw new Error(`Generated real-world reference is stale: ${path}`);}
  else writeFileSync(path,content);
}
console.log(check?'Real-world reference artifacts are current.':'Generated corrected real-world reference artifacts.');
