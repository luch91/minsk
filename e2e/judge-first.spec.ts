import {expect,test} from '@playwright/test';

const exhaustedBudget={
  liveModelEnabled:true,
  publicChallengerEnabled:true,
  providers:{meta:{state:'capacity_exhausted',remainingDispatches:0},baseten:{state:'capacity_exhausted',remainingDispatches:0}},
  availability:{modelCalls:{globalRemaining:0,clientRemaining:0}}
};

test('judge entry opens a prepared workflow with honest live and deterministic actions',async({page})=>{
  let providerCalls=0;
  await page.route('**/api/v1/budget',route=>route.fulfill({json:exhaustedBudget}));
  page.on('request',request=>{if(/workflows\/extract|\/investigations$|challengers\/open-weight/.test(request.url()))providerCalls++;});
  await page.goto('/');
  const launch=page.getByRole('region',{name:'Prepared judge workflow'});
  await expect(launch.getByRole('heading',{name:'The Missing Approval',exact:true})).toBeVisible();
  await expect(launch).toContainText('0 live requests remain for this browser; 0 remain in the shared judging window.');
  await expect(launch).toContainText('live capacity is exhausted');
  await expect(launch.getByRole('button',{name:'Try live extraction',exact:true})).toBeDisabled();
  await expect(launch.getByRole('button',{name:'Run model-assisted investigation',exact:true})).toBeDisabled();
  await expect(launch.getByRole('button',{name:'Run Baseten challenger',exact:true})).toBeDisabled();
  await launch.getByRole('button',{name:'Use deterministic demonstration',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Counterfactuals',exact:true})).toBeVisible();
  await expect(page.locator('.outcome-panel code')).toHaveText('UNSAFE_EXECUTION');
  await expect(page.locator('.outcome-panel')).toContainText('DETERMINISTIC RESULT');
  await expect(page.locator('.toast')).toContainText('No live provider was called');
  expect(providerCalls).toBe(0);
});

test('a rejected live request stays a live error and is never replaced with a deterministic result',async({page})=>{
  const available={...exhaustedBudget,providers:{meta:{state:'available',remainingDispatches:5},baseten:{state:'available',remainingDispatches:5}},availability:{modelCalls:{globalRemaining:500,clientRemaining:5}}};
  await page.route('**/api/v1/budget',route=>route.fulfill({json:available}));
  await page.route('**/api/v1/investigations',route=>route.fulfill({status:429,headers:{'content-type':'application/json','X-Correlation-ID':'judge-capacity-test'},body:JSON.stringify({error:'Live capacity reached. No provider request was dispatched.',liveResult:false})}));
  await page.goto('/');
  await page.getByRole('region',{name:'Prepared judge workflow'}).getByRole('button',{name:'Run model-assisted investigation',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('Live capacity reached. No provider request was dispatched. Reference: judge-capacity-test');
  await expect(page.getByRole('heading',{name:'Home',exact:true})).toBeVisible();
  await expect(page.locator('.outcome-panel')).toHaveCount(0);
});
