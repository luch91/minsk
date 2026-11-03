import {expect,test,type Page} from '@playwright/test';
const api=process.env.MINSK_API_URL??'';
async function navigate(page:Page,name:string){await expect(page.locator('.overview-header h1')).toBeVisible();const menu=page.getByRole('button',{name:'Open navigation',exact:true});if(await menu.isVisible())await menu.click();await page.getByRole('navigation').getByRole('button',{name,exact:false}).click();}

test('provider-fixture extraction review, two-tool investigation, Baseten comparison and real deterministic certificate',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const samples=await (await page.request.get(api+'/api/v1/samples')).json();const workflow=structuredClone(samples.samples[0]);workflow.id='fixture-extraction-review';workflow.title='Provider fixture workflow';workflow.conditions[0].observedValue=null;
 let extractionCalls=0,investigationCalls=0,challengerCalls=0;
 await page.route('**/api/v1/budget',r=>r.fulfill({json:{liveModelEnabled:true,publicChallengerEnabled:true,providers:{meta:{state:'available',remainingDispatches:20},baseten:{state:'available',remainingDispatches:20}},availability:{modelCalls:{globalRemaining:500,clientRemaining:20}}}}));
 await page.route('**/api/v1/workflows/extract',r=>{extractionCalls++;return r.fulfill({json:{workflow,model:{id:'fixture-extraction',modelId:'muse-spark-1.3',provider:'Meta Model API',role:'EXTRACTION',usage:null,accountingStatus:'UNKNOWN_USAGE'}}});});
 await page.route('**/api/v1/investigations',async r=>{
  investigationCalls++;const w=r.request().postDataJSON().workflow;const c=w.conditions.find((c:{id:string})=>c.id==='human-approval');const intervention={id:'fixture-model-change',targetConditionId:c.id,originalValue:c.observedValue,replacementValue:false,reason:'Provider fixture: missing approval gate',proposedBy:'META_HOSTED',validated:true};
  const result=await (await page.request.post(api+'/api/v1/experiments/run',{data:{workflow:w,intervention}})).json();
  const baseline=await (await page.request.post(api+'/api/v1/experiments/run',{data:{workflow:w}})).json();
  const patch={stepId:'deploy-production',conditionId:c.id};const verified=await (await page.request.post(api+'/api/v1/safeguards/verify',{data:{workflow:w,intervention,...patch}})).json();
  await r.fulfill({json:{baseline:baseline.result,intervention,failure:result.result,verification:{repaired:verified.repaired,safeguard:patch,resolved:verified.resolved},trace:[{id:'fixture-counterfactual',tool:'run_counterfactual',status:'COMPLETED',arguments:{conditionId:c.id,replacementValue:false},result:result.result,modelId:'muse-spark-1.3',responseId:'fixture-response-1'},{id:'fixture-safeguard',tool:'propose_safeguard',status:'COMPLETED',arguments:patch,result:{repairedOutcome:verified.repaired.outcome,resolved:verified.resolved},modelId:'muse-spark-1.3',responseId:'fixture-response-2'}],model:{id:'fixture-response-1',modelId:'muse-spark-1.3',provider:'Meta Model API',role:'ROUTINE_INVESTIGATION',usage:null,accountingStatus:'UNKNOWN_USAGE'}}});
 });
 await page.route('**/api/v1/challengers/open-weight',r=>{challengerCalls++;return r.fulfill({json:{challenger:{provider:'Baseten',modelId:'meta-models/muse-spark-open-1026',responseId:'fixture-baseten',candidates:[{conditionId:'human-approval',replacementValue:false,reason:'Provider fixture: missing gate'}]},comparison:null}});});
 await page.goto('/');await navigate(page,'Workflows');await page.getByRole('button',{name:'New workflow extraction'}).click();
 const dialog=page.getByRole('dialog',{name:'New workflow extraction'});await dialog.getByLabel('Workflow procedure').fill(workflow.sourceDocuments[0].text);await dialog.getByRole('button',{name:'Extract with Muse Spark'}).click();
 await expect(dialog.getByRole('heading',{name:'Review the interpretation'})).toBeVisible();
 await dialog.getByLabel(`Observed ${workflow.conditions[0].name}`,{exact:true}).selectOption('true');
 await dialog.getByRole('button',{name:'Confirm interpretation',exact:true}).click();await expect(dialog.locator('.outcome-panel code')).toHaveText('SAFE_EXECUTION');await dialog.getByRole('button',{name:'Open investigation',exact:true}).click();
 await page.getByRole('button',{name:'Run Meta investigation',exact:true}).click();await expect(page.locator('.trace-row')).toHaveCount(2);await expect(page.locator('main .outcome-panel code')).toHaveText('UNSAFE_EXECUTION');
 await page.getByRole('button',{name:'Baseten challenger',exact:true}).click();await page.getByRole('button',{name:'Run Baseten challenger',exact:true}).click();await expect(page.locator('pre')).toContainText('fixture-baseten');
 await navigate(page,'Counterfactuals');await page.getByRole('button',{name:'Verify safeguard',exact:true}).click();await expect(page.locator('main .outcome-panel code')).toHaveText('SAFE_BLOCK');
 await navigate(page,'Certificates');const download=page.waitForEvent('download');await page.getByRole('button',{name:'Export certificate',exact:true}).click();await download;await expect(page.getByRole('heading',{name:'Certificate integrity verified'})).toBeVisible();
 // This browser fixture intentionally has no ledger attestation. API integration tests cover trusted model provenance.
 await expect(page.locator('.certificate-summary')).toContainText('No attested model provenance');
 await navigate(page,'Counterfactuals');await page.getByRole('button',{name:'Run counterfactual',exact:true}).click();await expect(page.locator('main .outcome-panel code')).toHaveText('UNSAFE_EXECUTION');await navigate(page,'Certificates');await expect(page.locator('.certificate-summary')).toHaveCount(0);
 expect([extractionCalls,investigationCalls,challengerCalls]).toEqual([1,1,1]);expect(errors).toEqual([]);
});

test('blocked local storage still permits the complete deterministic journey',async({page})=>{
 await page.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new Error('Fixture: storage blocked');};Storage.prototype.setItem=()=>{throw new Error('Fixture: storage blocked');};});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await navigate(page,'Counterfactuals');await page.getByRole('button',{name:'Run counterfactual',exact:true}).click();await expect(page.locator('main .outcome-panel code')).toHaveText('UNSAFE_EXECUTION');await page.getByRole('button',{name:'Verify safeguard',exact:true}).click();await expect(page.locator('main .outcome-panel code')).toHaveText('SAFE_BLOCK');expect(errors).toEqual([]);
});

test('cancelling extraction preserves source and ignores a late fixture response',async({page})=>{
 await page.route('**/api/v1/budget',r=>r.fulfill({json:{liveModelEnabled:true,publicChallengerEnabled:false,providers:{meta:{state:'available',remainingDispatches:20},baseten:{state:'disabled',remainingDispatches:20}},availability:{modelCalls:{globalRemaining:500,clientRemaining:20}}}}));
 let release!:()=>void;const pending=new Promise<void>(r=>{release=r;});
 await page.route('**/api/v1/workflows/extract',async r=>{await pending;await r.fulfill({json:{error:'Late cancelled fixture'}}).catch(()=>{});});
 await page.goto('/');await navigate(page,'Workflows');await page.getByRole('button',{name:'New workflow extraction'}).click();const dialog=page.getByRole('dialog',{name:'New workflow extraction'});const source='Fixture workflow: production deployment requires human approval and passing tests.';await dialog.getByLabel('Workflow procedure').fill(source);await dialog.getByRole('button',{name:'Extract with Muse Spark'}).click();await expect(dialog.getByRole('status')).toContainText('Extracting workflow');await dialog.getByRole('button',{name:'Cancel',exact:true}).click();release();await expect(dialog.getByRole('heading',{name:'Submit workflow text'})).toBeVisible();await expect(dialog.getByLabel('Workflow procedure')).toHaveValue(source);await expect(dialog.getByRole('status')).toHaveCount(0);
});
