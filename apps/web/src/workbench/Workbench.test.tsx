import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it,vi} from 'vitest';
import {Workbench} from './Workbench';
import {missingApproval} from '../../../../fixtures/workflows/missing-approval';
import {realWorldCiReference} from '../../../../fixtures/workflows/real-world-ci-reference';
import type {InvestigationState} from '../useInvestigation';

vi.mock('./icons',()=>({Icon:()=>null}));

describe('Minsk workbench rendering',()=>{
  it('renders imported JSX with a single available workflow',()=>{
    const state={workflow:missingApproval,sceneWorkflow:missingApproval,samples:[missingApproval,realWorldCiReference],source:missingApproval.sourceDocuments[0]?.text??'',baseline:null,failure:null,verification:null,applied:null,trace:[],scenario:'BASELINE',result:null,busy:'',error:'',liveEnabled:false,challengerEnabled:false,providerStatus:{meta:'disabled',baseten:'disabled',error:'',remaining:{meta:0,baseten:0,global:0,client:0}},certificate:null,setError:()=>{},setSource:()=>{},setScenario:()=>{}} as unknown as InvestigationState;
    const html=renderToStaticMarkup(<Workbench state={state}/>);
    expect(html).toContain('Investigation Workbench');
    expect(html).toContain('MINSK');
    expect(html).toContain('aria-label="Minsk home"');
    expect(html).toContain('Policy checkpoints');
    expect(html).toContain('Approval');
    expect(html).toContain('Historical CI review isolation verification');
    expect(html).toContain('Live models disabled');
    expect(html).not.toContain('[object Object]');
  });
});
