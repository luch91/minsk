import {expect,test,type Page} from '@playwright/test';
import multiStepCase from '../benchmark/cases/MFB-10.json' with {type:'json'};

async function navigate(page:Page,name:string){const menu=page.getByRole('button',{name:'Open navigation',exact:true});if(await menu.isVisible())await menu.click();await page.getByRole('navigation').getByRole('button',{name,exact:false}).click();}
async function start(page:Page){await page.goto('/');await expect(page.getByRole('button',{name:'Inspect Safe execution',exact:true})).toBeAttached();}
async function openImport(page:Page){await navigate(page,'Workflows');await page.getByRole('button',{name:'Import or edit JSON',exact:true}).click();return page.getByRole('dialog',{name:'Inspection panel'});}
async function importWorkflow(page:Page,workflow:unknown){const dialog=await openImport(page);await dialog.getByLabel('Workflow JSON',{exact:true}).fill(JSON.stringify(workflow));await dialog.getByRole('button',{name:'Validate and load workflow',exact:true}).click();await expect(dialog).toBeHidden();}

test('rejected semantic imports preserve the current workflow and completed result',async({page})=>{
 await start(page);await navigate(page,'Counterfactuals');await page.getByRole('button',{name:'Run counterfactual',exact:true}).click();await expect(page.locator('.outcome-panel code')).toHaveText('UNSAFE_EXECUTION');
 const dialog=await openImport(page);const original=JSON.parse(await dialog.getByLabel('Workflow JSON',{exact:true}).inputValue());
 for(const kind of ['gate','cycle','span','hash']){
  const invalid=structuredClone(original);invalid.id=`rejected-${kind}`;invalid.title=`Rejected ${kind}`;
  if(kind==='gate')invalid.steps[0].executionGateIds.push('missing-audit-condition');
  if(kind==='cycle')invalid.steps[0].dependsOn.push(invalid.steps[0].id);
  if(kind==='span')invalid.conditions[0].sourceSpans[0].excerpt='Nonmatching audit excerpt';
  if(kind==='hash')invalid.sourceDocuments[0].contentHash='0'.repeat(64);
  await dialog.getByLabel('Workflow JSON',{exact:true}).fill(JSON.stringify(invalid));await dialog.getByRole('button',{name:'Validate and load workflow',exact:true}).click();await expect(dialog.getByRole('alert')).toBeVisible();await expect(page.locator('.overview-header')).toContainText('2');
 }
 await dialog.getByRole('button',{name:'Close inspection panel',exact:true}).click();await navigate(page,'Counterfactuals');await expect(page.locator('.outcome-panel code')).toHaveText('UNSAFE_EXECUTION');await expect(page.getByLabel('Counterfactual condition')).toHaveValue('human-approval');
 const again=await openImport(page);expect(JSON.parse(await again.getByLabel('Workflow JSON',{exact:true}).inputValue())).toEqual(original);
});

test('imported interpretation requires confirmation and selects a valid typed condition',async({page})=>{
 await start(page);await navigate(page,'Workflows');await page.getByRole('button',{name:'Confirm interpretation',exact:true}).click();const dialog=await openImport(page);const workflow=JSON.parse(await dialog.getByLabel('Workflow JSON',{exact:true}).inputValue());workflow.id='audit-review-required';workflow.title='Audit interpretation review';workflow.policyRules[0].predicate='ANY';
 await dialog.getByLabel('Workflow JSON',{exact:true}).fill(JSON.stringify(workflow));await dialog.getByRole('button',{name:'Validate and load workflow',exact:true}).click();await expect(dialog).toBeHidden();await navigate(page,'Home');await expect(page.locator('.investigation-status')).toContainText('Review required');await expect(page.locator('.investigation-status')).not.toContainText('Interpretation confirmed');
 await navigate(page,'Workflows');await page.getByRole('button',{name:'Confirm interpretation',exact:true}).click();await navigate(page,'Home');await expect(page.locator('.investigation-status')).toContainText('Interpretation confirmed');
});

test('library policy signal follows the evaluated scenario instead of a fixed green state',async({page})=>{
 await start(page);await navigate(page,'Counterfactuals');await page.getByRole('button',{name:'Run counterfactual',exact:true}).click();await expect(page.locator('.outcome-panel code')).toHaveText('UNSAFE_EXECUTION');await navigate(page,'Home');
 const row=page.getByRole('button',{name:'The Missing Approval',exact:true});await expect(row.locator('[aria-label="Policy VIOLATED"]')).toHaveCount(1);await expect(page.getByRole('button',{name:'Correctly protected workflow',exact:true}).locator('[aria-label="Policy UNKNOWN"]')).toHaveCount(1);
 await page.locator('.scenario-control:visible').first().getByRole('button',{name:'baseline',exact:true}).click();await expect(row.locator('[aria-label="Policy SATISFIED"]')).toHaveCount(1);
});

test('multi-step graph, inspection, gate editing and replay retain the actual dependency',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await start(page);await importWorkflow(page,multiStepCase.workflow);await navigate(page,'Home');
 const steps=page.locator('.destination-row[data-workflow-id="mfb-10"]');await expect(steps).toHaveCount(2);await expect(page.locator('[data-dependency-from="test-step"][data-dependency-to="deploy-production"]')).toHaveCount(1);await expect(page.locator('.destination-groups h3')).toContainText('7');
 await steps.filter({hasText:'Deploy production'}).click();const drawer=page.getByRole('dialog',{name:'Inspection panel'});await expect(drawer.getByRole('heading',{name:'Deploy production',exact:true})).toBeVisible();await expect(drawer).toContainText('Run tests');await drawer.getByRole('button',{name:'Close inspection panel',exact:true}).click();
 await page.getByRole('button',{name:'SHOW ALL WORKFLOW STEPS',exact:true}).click();await expect(drawer.getByRole('heading',{name:'Run tests',exact:true})).toBeVisible();await expect(drawer.getByRole('heading',{name:'Deploy production',exact:true})).toBeVisible();await drawer.getByRole('button',{name:'Close inspection panel',exact:true}).click();
 await page.getByLabel('Gate editing step').selectOption('deploy-production');const gate=page.getByLabel('Execution gate passing tests',{exact:true});await expect(gate).not.toBeChecked();await gate.check();await expect(gate).toBeChecked();await page.getByLabel('Gate editing step').selectOption('test-step');await expect(gate).toBeChecked();
 await navigate(page,'Counterfactuals');await page.getByRole('button',{name:'Run counterfactual',exact:true}).click();await expect(page.locator('.outcome-panel code')).toHaveText('SAFE_BLOCK');await page.getByRole('button',{name:'Next event',exact:true}).click();await page.getByRole('button',{name:'Next event',exact:true}).click();await expect(page.locator('.replay-event')).toHaveCount(2);await expect(page.locator('.replay-event').nth(0)).toContainText('BLOCKED');await expect(page.locator('.replay-event').nth(1)).toContainText('Dependency violated');expect(errors).toEqual([]);
});
