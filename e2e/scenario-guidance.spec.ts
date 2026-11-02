import {expect,test,type Page} from '@playwright/test';
async function navigate(page:Page,name:string){const menu=page.getByRole('button',{name:'Open navigation',exact:true});if(await menu.isVisible())await menu.click();await page.getByRole('navigation').getByRole('button',{name,exact:false}).click();}
const scenario=(page:Page,name:string)=>page.locator('.scenario-control:visible').first().getByRole('button',{name,exact:true});

test('empty scenario controls guide setup and generated results remain selectable',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));let providerCalls=0;let experiments=0;
 page.on('request',r=>{if(/workflows\/extract|\/investigations$|challengers\/open-weight/.test(r.url()))providerCalls++;if(r.url().includes('/experiments/run')&&r.postDataJSON()?.intervention)experiments++;});
 await page.goto('/');await expect(page.getByRole('button',{name:'Inspect Safe execution',exact:true})).toBeAttached();
 await expect(scenario(page,'counterfactual')).toBeEnabled();await expect(scenario(page,'safeguard')).toBeEnabled();await expect(page.locator('.scenario-hint')).toContainText('Run a counterfactual');
 await scenario(page,'safeguard').click();await expect(page.getByRole('heading',{name:'Counterfactuals',exact:true})).toBeVisible();expect(experiments).toBe(0);
 await navigate(page,'Home');await scenario(page,'counterfactual').click();await expect(page.getByRole('heading',{name:'Counterfactuals',exact:true})).toBeVisible();expect(experiments).toBe(0);
 await page.getByLabel('Counterfactual condition').selectOption('human-approval');await page.getByRole('button',{name:'Run counterfactual',exact:true}).click();await expect(page.locator('main .outcome-panel code')).toHaveText('UNSAFE_EXECUTION');expect(experiments).toBe(1);
 await navigate(page,'Home');await scenario(page,'safeguard').click();await expect(page.getByRole('heading',{name:'Safeguards',exact:true})).toBeVisible();await page.getByRole('button',{name:'Verify proposed execution gate',exact:true}).click();await expect(page.locator('main .outcome-panel code')).toHaveText('SAFE_BLOCK');
 await page.getByRole('button',{name:'Inspect repaired path',exact:true}).click();await expect(page.locator('.scenario-hint')).toContainText('All three results are ready');
 for(const [name,outcome] of [['baseline','Safe execution'],['counterfactual','Unsafe execution'],['safeguard','Safe block']]){await scenario(page,name!).click();await expect(page.getByRole('button',{name:`Inspect ${outcome}`,exact:true})).toBeAttached();await expect(scenario(page,name!)).toHaveAttribute('aria-pressed','true');}
 expect(providerCalls).toBe(0);expect(errors).toEqual([]);
});
