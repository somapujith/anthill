import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';

const base=process.env.QA_BASE_URL||'http://127.0.0.1:5180';
const viewportCases=[[360,800],[390,844],[768,1024],[1024,768],[1440,900],[1920,1080],[1366,600]];
const routes=process.env.QA_ROUTES?process.env.QA_ROUTES.split(','):['/','/about','/philosophy','/team','/speedscalers','/portfolio','/programs','/stories','/insights','/contact','/privacy-policy'];
const output='tmp/qa'; await fs.mkdir(output,{recursive:true});
let server;
if(process.env.QA_START_SERVER==='1'){
 server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',new URL(base).port,'--strictPort'],{stdio:'ignore',windowsHide:true});
 for(let attempt=0;attempt<40;attempt++){try{if((await fetch(base)).ok)break;}catch{}await new Promise(r=>setTimeout(r,150));}
}
const browser=await chromium.launch({headless:true,channel:'chrome'});
const results=[]; const interactions=[];
try {
 for(const [width,height] of viewportCases){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
  const page=await context.newPage(); let errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  for(const route of routes){
   errors=[];
   await page.goto(base+route,{waitUntil:'networkidle'});
   await page.waitForTimeout(180);
   await page.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=innerHeight){scrollTo(0,y);await new Promise(r=>setTimeout(r,35));}scrollTo(0,0);});
   await page.waitForTimeout(100);
   const state=await page.evaluate(()=>({
    documentWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth,
    overflows:[...document.querySelectorAll('main *,header *,footer *')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&(r.left<-.5||r.right>innerWidth+.5)&&!el.closest('.portfolio-track');}).slice(0,12).map(el=>({tag:el.tagName,class:el.className,text:el.textContent?.slice(0,80)})),
    brokenImages:[...document.images].filter(im=>im.complete&&im.naturalWidth===0).map(im=>({src:im.getAttribute('src'),alt:im.alt})),
    title:document.title,h1:document.querySelector('h1')?.textContent,
   }));
   results.push({width,height,route,...state,errors:[...errors]});
   await fs.writeFile(`${output}/viewport-results.json`,JSON.stringify({base,results,interactions},null,2));
   console.log(JSON.stringify({viewport:`${width}x${height}`,route,overflow:state.documentWidth>width,broken:state.brokenImages.length,errors:errors.length}));
   if((width===1440&&['/','/about','/portfolio'].includes(route))||(width===390&&['/','/about','/portfolio'].includes(route))||(width===360&&route==='/')){
    await page.screenshot({path:`${output}/${route==='/'?'home':route.slice(1)}-${width}.png`,fullPage:true});
   }
  }
  await context.close();
 }
 const context=await browser.newContext({viewport:{width:390,height:844}});const page=await context.newPage();
 await page.goto(base,{waitUntil:'networkidle'});
 const check=async(name,run)=>{try{const details=await run();interactions.push({name,pass:true,details});console.log(`PASS ${name}`);}catch(e){interactions.push({name,pass:false,error:e.message});console.log(`FAIL ${name}: ${e.message}`);}};
 await check('Mobile menu open, focus trap and Escape restore',async()=>{
  const toggle=page.getByRole('button',{name:'Open navigation'});await toggle.click();
  const dialog=page.getByRole('dialog',{name:'Explore Anthill'});await dialog.waitFor();
  const initialInside=await dialog.evaluate(el=>el.contains(document.activeElement));if(!initialInside)throw Error('Initial focus outside dialog');
  const count=await dialog.locator('a,button').count();for(let n=0;n<count+2;n++)await page.keyboard.press('Tab');
  if(!await dialog.evaluate(el=>el.contains(document.activeElement)))throw Error('Tab escaped focus trap');
  await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});if(await toggle.getAttribute('aria-expanded')!=='false')throw Error('Menu still expanded');
  if(!await toggle.evaluate(el=>el===document.activeElement))throw Error('Focus not restored');
  await toggle.click();await dialog.getByRole('button',{name:'Close navigation'}).click();await dialog.waitFor({state:'hidden'});
 });
 await check('Homepage carousel and company disclosure',async()=>{
  const track=page.locator('.portfolio-track');await track.scrollIntoViewIfNeeded();await page.getByRole('button',{name:'Next company'}).click();await page.waitForTimeout(500);
  const next=await track.evaluate(el=>el.scrollLeft);if(next<=0)throw Error('Next button did not advance');
  await page.getByRole('button',{name:'Previous company'}).click();await page.waitForTimeout(500);const prev=await track.evaluate(el=>el.scrollLeft);if(prev>=next)throw Error('Previous button did not retreat');
  const overview=page.getByRole('button',{name:/Overview of/}).first();await overview.click();if(await overview.getAttribute('aria-expanded')!=='true')throw Error('Disclosure did not expand');await overview.click();if(await overview.getAttribute('aria-expanded')!=='false')throw Error('Disclosure did not close');return {next,prev};
 });
 await check('Portfolio categories and empty search clear',async()=>{
  await page.goto(base+'/portfolio',{waitUntil:'networkidle'});
  const filters=page.locator('.content-filters button');const initial=await page.locator('.content-card').count();const categories=await filters.allTextContents();
  for(let n=1;n<await filters.count();n++){const button=filters.nth(n);await button.click();if(await button.getAttribute('aria-pressed')!=='true')throw Error('Category not selected');}
  await filters.first().click();const restored=await page.locator('.content-card').count();if(initial!==restored)throw Error('All category did not restore collection');
  await page.getByRole('searchbox').fill('zzzzno-company-result');await page.getByRole('button',{name:/Clear filters/}).waitFor();await page.getByRole('button',{name:/Clear filters/}).click();if(await page.locator('.content-card').count()!==initial)throw Error('Clear did not restore cards');return {initial,categories};
 });
 await check('Newsletter email validation and local frontend registration',async()=>{
  const requests=[];page.on('request',r=>{if(['POST','PUT','PATCH'].includes(r.method()))requests.push(r.url());});
  const input=page.getByLabel('Your Email Address');await input.fill('invalid');await page.getByRole('button',{name:'Subscribe to newsletter'}).click();if(await input.evaluate(el=>el.validity.valid))throw Error('Invalid email accepted');
  await input.fill('viewport-qa@example.com');await page.getByRole('button',{name:'Subscribe to newsletter'}).click();await page.getByText('Your email is saved on this device.',{exact:false}).waitFor();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('anthill-newsletter-interest')||'[]'));if(!saved.includes('viewport-qa@example.com'))throw Error('Email was not registered locally');if(requests.length)throw Error('Unexpected external submit '+requests.join(','));return {saved,externalSubmits:requests.length};
 });
 await check('Contact file larger than 10MB is rejected',async()=>{
  await page.goto(base+'/contact',{waitUntil:'networkidle'});await page.locator('input[type=file]').setInputFiles({name:'too-large.pdf',mimeType:'application/pdf',buffer:Buffer.alloc(10*1024*1024+1)});await page.getByText('Upload failed. Max size for files is 10 MB.',{exact:true}).waitFor();if(await page.locator('input[type=file]').evaluate(el=>el.files.length)!==0)throw Error('Oversized file remains selected');
 });
 await context.close();
 await fs.writeFile(`${output}/viewport-results.json`,JSON.stringify({base,results,interactions},null,2));
 const bad=results.filter(r=>r.documentWidth>r.width||r.brokenImages.length||r.errors.length);
 console.log(JSON.stringify({pagesChecked:results.length,issueCases:bad.length,interactionsPassed:interactions.filter(i=>i.pass).length,interactionsTotal:interactions.length}));
 if(bad.length||interactions.some(i=>!i.pass))process.exitCode=1;
} finally {await browser.close();server?.kill();}
