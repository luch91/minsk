import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function navigate(page:Page,name:string){const menu=page.getByRole('button',{name:'Open navigation',exact:true});if(await menu.isVisible())await menu.click();await page.getByRole('navigation').getByRole('button',{name,exact:false}).click();}

test('sample, counterfactual, safeguard, replay, certificate, and benchmark', async ({ page }) => {
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading',{name:'Home',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Inspect Safe execution',exact:true})).toBeAttached();
  await navigate(page,'Counterfactuals');
  await page.getByLabel('Counterfactual condition').selectOption('human-approval');
  await page.getByRole('button', { name: 'Run counterfactual',exact:true }).click();
  await expect(page.locator('.outcome-panel code')).toHaveText('UNSAFE_EXECUTION');
  await page.getByRole('button', { name: 'Verify safeguard',exact:true }).click();
  await expect(page.locator('.outcome-panel code')).toHaveText('SAFE_BLOCK');
  await page.getByRole('button',{name:'Next event',exact:true}).click();
  await expect(page.locator('.replay-event')).toContainText('BLOCKED');
  await navigate(page,'Home');
  await expect(page.getByRole('button',{name:'Inspect Safe block',exact:true})).toBeAttached();
  await navigate(page,'Counterfactuals');
  for(const [scenario,outcome] of [['baseline','SAFE_EXECUTION'],['counterfactual','UNSAFE_EXECUTION'],['safeguard','SAFE_BLOCK']]){
    await page.getByRole('button',{name:scenario,exact:true}).click();
    await expect(page.locator('.outcome-panel code')).toHaveText(outcome!);
  }
  await navigate(page,'Certificates');
  const download=page.waitForEvent('download');
  await page.getByRole('button',{name:'Export certificate',exact:true}).click();
  const file=await download;
  expect(file.suggestedFilename()).toBe('minsk-certificate.json');
  const certificate=JSON.parse(await readFile(await file.path(),'utf8'));
  expect(certificate.baseline.outcome).toBe('SAFE_EXECUTION');
  expect(certificate.evaluationResult.outcome).toBe('UNSAFE_EXECUTION');
  expect(certificate.verificationResult.outcome).toBe('SAFE_BLOCK');
  expect(certificate.modelMetadata).toBeNull();
  await expect(page.getByRole('heading',{name:'Certificate integrity verified'})).toBeVisible();
  await navigate(page,'Benchmark');
  await page.getByRole('button',{name:'Run deterministic benchmark'}).click();
  await expect(page.locator('.benchmark-summary')).toContainText('12/12');
  expect(errors).toEqual([]);
});

test('API failure is reported as an error', async ({ page }) => {
  await page.route('**/api/v1/samples', route => route.fulfill({ status: 502, contentType: 'text/html', body: '<html>Unavailable</html>' }));
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('API returned 502 without JSON');
});

test('workflow review, graph inspection, and disabled live controls',async({page})=>{
  await page.goto('/');await expect(page.getByRole('heading',{name:'Home',exact:true})).toBeVisible();
  await navigate(page,'Workflows');
  const observed=page.getByLabel('Observed Human approval present',{exact:true});
  await observed.selectOption('false');
  await expect(observed).toHaveValue('false');
  const bounds=await observed.boundingBox();expect(bounds!.x+bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  await navigate(page,'Investigations');
  await expect(page.getByRole('button',{name:'Run Meta investigation'})).toBeDisabled();
  await navigate(page,'Workflows');
  await expect(page.getByLabel('Observed Human approval present',{exact:true})).toHaveValue('false');
  await page.getByRole('button',{name:'New workflow extraction'}).click();
  await expect(page.getByRole('button',{name:'Extract with Muse Spark'})).toBeDisabled();
  await page.getByRole('button',{name:'Close extraction',exact:true}).click();
});

test('live extraction errors retain source without issuing an unmocked provider request',async({page})=>{
  await page.route('**/api/v1/budget',route=>route.fulfill({json:{liveModelEnabled:true,publicChallengerEnabled:false}}));
  await page.route('**/api/v1/workflows/extract',route=>route.fulfill({status:429,json:{error:'Test fixture: request allowance reached'}}));
  await page.goto('/');await expect(page.getByRole('heading',{name:'Home',exact:true})).toBeVisible();
  await navigate(page,'Workflows');await page.getByRole('button',{name:'New workflow extraction'}).click();
  const source='Production deployment requires explicit human approval and passing tests. The deployment agent only checks tests.';
  await page.getByLabel('Workflow procedure').fill(source);
  await page.getByRole('button',{name:'Extract with Muse Spark'}).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('request allowance reached');
  await expect(page.getByLabel('Workflow procedure')).toHaveValue(source);
});

test('string observations remain strings through editing and counterfactual requests',async({page})=>{
  const samples=await (await page.request.get('/api/v1/samples')).json();
  const workflow=structuredClone(samples.samples[0]);
  workflow.conditions[0].valueType='STRING';workflow.conditions[0].expectedValue='false';workflow.conditions[0].observedValue='true';
  await page.route('**/api/v1/samples',route=>route.fulfill({json:{samples:[workflow]}}));
  await page.goto('/');await expect(page.getByRole('heading',{name:'Home',exact:true})).toBeVisible();
  await navigate(page,'Workflows');await expect(page.getByLabel(`Observed ${workflow.conditions[0].name}`,{exact:true})).toHaveValue('true');
  await navigate(page,'Counterfactuals');await page.getByLabel('Counterfactual condition').selectOption(workflow.conditions[0].id);
  await page.getByLabel('Replacement value').fill('false');
  const request=page.waitForRequest(r=>r.url().includes('/api/v1/experiments/run')&&!!r.postDataJSON()?.intervention);
  await page.getByRole('button',{name:'Run counterfactual',exact:true}).click();
  expect((await request).postDataJSON().intervention.replacementValue).toBe('false');
  await expect(page.locator('.outcome-panel code')).toHaveText('SAFE_EXECUTION');
});
