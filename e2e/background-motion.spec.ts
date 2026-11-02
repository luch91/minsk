import {expect,test,type Page} from '@playwright/test';
async function navigate(page:Page,name:string){await expect(page.locator('.overview-header h1')).toBeVisible();const menu=page.getByRole('button',{name:'Open navigation',exact:true});if(await menu.isVisible())await menu.click();await page.getByRole('navigation').getByRole('button',{name,exact:false}).click();}

test('one continuous interference field survives navigation, tabs and inspection',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 let providerRequests=0;page.on('request',r=>{if(/workflows\/extract|\/investigations$|challengers\/open-weight/.test(r.url()))providerRequests++;});
 await page.goto('/');await expect(page.getByRole('heading',{name:'Home',exact:true})).toBeVisible();
 const canvas=page.getByTestId('interference-background');await expect(canvas).toHaveAttribute('data-motion-state','running');
 await canvas.evaluate(el=>el.setAttribute('data-continuity-check','same-surface'));
 const initial=Number(await canvas.getAttribute('data-phase'));
 for(const name of ['Workflows','Investigations','Counterfactuals','Safeguards','Evidence','Benchmark','Certificates','Settings','Home']){
  await navigate(page,name);await expect(page.getByRole('heading',{name,exact:true})).toBeVisible();
  await expect(canvas).toHaveAttribute('data-continuity-check','same-surface');await expect(canvas).toHaveCount(1);
 }
 await page.getByRole('button',{name:'METRIC SETTINGS',exact:true}).click();
 await expect(page.getByRole('dialog',{name:'Inspection panel'})).toBeVisible();
 await page.getByRole('dialog').getByRole('button',{name:'Close inspection panel'}).click();
 await page.getByRole('tab',{name:'Workflow review',exact:true}).click();await expect(page.getByRole('heading',{name:'Workflows',exact:true})).toBeVisible();
 await expect(canvas).toHaveAttribute('data-continuity-check','same-surface');
 expect(Number(await canvas.getAttribute('data-phase'))).toBeGreaterThan(initial);
 const pixels=()=>canvas.evaluate(el=>{const c=el as HTMLCanvasElement;const data=c.getContext('2d')!.getImageData(0,0,c.width,c.height).data;let total=0;for(let i=0;i<data.length;i+=17)total=(total+data[i]!*(i%251+1))>>>0;return total;});
 const before=await pixels();await expect.poll(pixels).not.toBe(before);
 expect(providerRequests).toBe(0);expect(errors).toEqual([]);
});

test('background motion can pause, persist and resume without resetting its phase',async({page})=>{
 await page.goto('/');await navigate(page,'Settings');const canvas=page.getByTestId('interference-background');
 const toggle=page.getByRole('checkbox',{name:'Animate interference field'});await toggle.uncheck();await expect(canvas).toHaveAttribute('data-motion-state','paused');
 const paused=await canvas.getAttribute('data-phase');await page.waitForTimeout(200);expect(await canvas.getAttribute('data-phase')).toBe(paused);
 await navigate(page,'Evidence');await expect(canvas).toHaveAttribute('data-motion-state','paused');expect(await canvas.getAttribute('data-phase')).toBe(paused);
 await navigate(page,'Settings');await toggle.check();await expect(canvas).toHaveAttribute('data-motion-state','running');await expect.poll(async()=>Number(await canvas.getAttribute('data-phase'))).toBeGreaterThan(Number(paused));
 await toggle.uncheck();await page.reload();await expect(canvas).toHaveAttribute('data-motion-state','paused');
});

test('reduced-motion preference keeps a static field across navigation and resize',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await expect(page.getByRole('heading',{name:'Home',exact:true})).toBeVisible();
 const canvas=page.getByTestId('interference-background');await expect(canvas).toHaveAttribute('data-motion-state','reduced');const phase=await canvas.getAttribute('data-phase');
 await navigate(page,'Workflows');await page.setViewportSize({width:page.viewportSize()!.width,height:page.viewportSize()!.height+50});await page.waitForTimeout(200);
 expect(await canvas.getAttribute('data-phase')).toBe(phase);await expect(canvas).toHaveAttribute('data-motion-state','reduced');
 const bounds=await canvas.boundingBox();expect(bounds!.width).toBe(page.viewportSize()!.width);
});

test('canvas failure leaves the full deterministic journey available',async({page})=>{
 await page.addInitScript(()=>{HTMLCanvasElement.prototype.getContext=(()=>{throw new Error('Test fixture: canvas blocked');}) as typeof HTMLCanvasElement.prototype.getContext;});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await expect(page.getByRole('heading',{name:'Home',exact:true})).toBeVisible();
 await expect(page.getByTestId('interference-background')).toHaveAttribute('data-motion-state','unavailable');
 await navigate(page,'Counterfactuals');await page.getByLabel('Counterfactual condition').selectOption('human-approval');await page.getByRole('button',{name:'Run counterfactual',exact:true}).click();await expect(page.locator('.outcome-panel code')).toHaveText('UNSAFE_EXECUTION');
 await page.getByRole('button',{name:'Verify safeguard',exact:true}).click();await expect(page.locator('.outcome-panel code')).toHaveText('SAFE_BLOCK');expect(errors).toEqual([]);
});
