#!/usr/bin/env node
// Explicit-plan, read-only reference capture. It never asserts complete visual fidelity.
import {chromium} from '@playwright/test';
import {readFile,writeFile,mkdir,rename,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const args={};
for(let i=2;i<process.argv.length;i++){
  const [k,v]=process.argv[i].replace(/^--/,'').split('=',2);
  args[k]=v??(process.argv[i+1]&&!process.argv[i+1].startsWith('--')?process.argv[++i]:true);
}
const planPath=path.resolve(args.plan||'references/reference-plan.json');
const root=path.resolve(args.out||'references');
const indexPath=path.join(root,'capture-index.json');
const hash=x=>createHash('sha256').update(x).digest('hex');
const slug=x=>String(x).toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').slice(0,64);
const exists=async p=>{try{await access(p);return true;}catch{return false;}};
const checkout=u=>/\/(checkout|payment|order-confirmation)(\/|$)/i.test(new URL(u).pathname);
const save=async x=>{await writeFile(indexPath+'.tmp',JSON.stringify(x,null,2)+'\n');await rename(indexPath+'.tmp',indexPath);};
async function step(page,action,origin){
  const target=action.selector?page.locator(action.selector).first():null;
  switch(action.type){
    case 'click': {
      if(!target)throw new Error('click requires selector');
      const href=await target.getAttribute('href');
      if(href){
        const targetUrl=new URL(href,page.url());
        if(checkout(targetUrl)||targetUrl.origin!==origin)throw new Error('navigation outside approved source scope');
      }
      await target.click({timeout:7000});break;
    }
    case 'hover':if(!target)throw new Error('hover requires selector');await target.hover({timeout:7000});break;
    case 'press':await page.keyboard.press(action.key||'Escape');break;
    case 'scroll':await page.evaluate(y=>scrollTo(0,y),Number(action.y||0));break;
    case 'wait':await page.waitForTimeout(Math.min(3000,Math.max(0,Number(action.ms||200))));break;
    case 'select':if(!target)throw new Error('select requires selector');await target.selectOption(action.value);break;
    default:throw new Error('unknown state action: '+action.type);
  }
  if(checkout(page.url())||new URL(page.url()).origin!==origin)
    throw new Error('navigation outside approved source scope');
}
async function extract(page,folder){
  const data=await page.evaluate(()=>{
    const elements=[...document.querySelectorAll('header,nav,main section,main h1,main h2,video')].slice(0,500);
    const styles=elements.map(e=>{
      const r=e.getBoundingClientRect(),s=getComputedStyle(e);
      return {tag:e.tagName,id:e.id,className:String(e.className).slice(0,150),
        rect:{x:r.x,y:r.y,width:r.width,height:r.height},
        style:{fontFamily:s.fontFamily,fontSize:s.fontSize,fontWeight:s.fontWeight,
        color:s.color,backgroundColor:s.backgroundColor,display:s.display,padding:s.padding,
        margin:s.margin,transition:s.transition,animation:s.animation,transform:s.transform}};
    });
    const images=[...document.images].map(e=>({url:e.currentSrc||e.src,alt:e.alt,srcset:e.srcset,width:e.naturalWidth,height:e.naturalHeight}));
    const videos=[...document.querySelectorAll('video')].map(e=>({url:e.currentSrc||e.src,poster:e.poster,
      autoplay:e.autoplay,muted:e.muted,loop:e.loop,playsInline:e.playsInline,paused:e.paused,
      duration:Number.isFinite(e.duration)?e.duration:null}));
    const links=[...document.querySelectorAll('a[href]')].map(e=>({label:(e.getAttribute('aria-label')||e.textContent||'').trim().slice(0,120),url:e.href,visible:!!e.getClientRects().length}));
    const srcsets=[...document.querySelectorAll('img[srcset],source[srcset]')].flatMap(e=>(e.getAttribute('srcset')||'').split(',').map(x=>x.trim().split(/\s+/)[0]).filter(Boolean));
    const backgrounds=[...document.querySelectorAll('main *,header *')].slice(0,2500).flatMap(e=>{
      const bg=getComputedStyle(e).backgroundImage;
      return bg==='none'?[]:[...bg.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(m=>m[1]);
    });
    const resources=performance.getEntriesByType('resource').filter(e=>/\.(css|woff2?|ttf|otf|svg|png|jpe?g|webp|avif|gif|ico|mp4|webm)(\?|$)/i.test(e.name)||['css','img','video'].includes(e.initiatorType)).map(e=>e.name);
    const icons=[...document.querySelectorAll('link[rel*="icon"],link[rel="stylesheet"]')].map(e=>e.href);
    const urls=[...images.map(e=>e.url),...videos.flatMap(e=>[e.url,e.poster]),...srcsets,...backgrounds,...resources,...icons]
      .filter(Boolean).map(u=>{try{return new URL(u,location.href).href;}catch{return '';}});
    return {url:location.href,title:document.title,capturedAt:new Date().toISOString(),
      viewport:{width:innerWidth,height:innerHeight},images,videos,links,styles,
      resourceUrls:[...new Set(urls.filter(u=>/^https?:\/\//.test(u)))]};
  });
  await mkdir(folder,{recursive:true});
  await writeFile(path.join(folder,'snapshot.html'),await page.content());
  await writeFile(path.join(folder,'dom.json'),JSON.stringify(data,null,2)+'\n');
  await page.screenshot({path:path.join(folder,'full.png'),fullPage:true});
  return data;
}
let browser;
try{
  const planText=await readFile(planPath,'utf8'),plan=JSON.parse(planText);
  if(!/^https:\/\//.test(plan.source||''))throw new Error('plan.source requires HTTPS');
  if(!Array.isArray(plan.pages)||!plan.pages.length)throw new Error('plan.pages is empty');
  const origin=new URL(plan.source).origin;
  const sizes=plan.viewports||[{id:'desktop',width:1440,height:900},{id:'mobile',width:390,height:844}];
  await mkdir(root,{recursive:true});
  let index={source:plan.source,planHash:hash(planText),items:[],failures:[]};
  if(!args.force&&await exists(indexPath)){
    const old=JSON.parse(await readFile(indexPath,'utf8'));
    if(old.planHash===index.planHash)index=old;
  }
  browser=await chromium.launch({headless:!args.headed});
  let captured=0,resumed=0,failed=0,blocked=false;
  for(const p of plan.pages)for(const size of sizes)for(const state of (p.states?.length?p.states:[{id:'default',steps:[]}])) {
    const url=new URL(p.url,plan.source);
    if(url.origin!==origin||checkout(url))throw new Error('URL outside authorized source scope: '+url.href);
    const key=[p.id,size.id,state.id].join(':');
    const folder=path.join(root,'captured',slug(key)+'-'+hash(key).slice(0,8));
    if(index.items.some(e=>e.key===key)&&!args.force&&await exists(path.join(folder,'dom.json'))&&await exists(path.join(folder,'full.png'))){resumed++;continue;}
    if(blocked){index.failures.push({key,url:url.href,error:'skipped after access block'});failed++;continue;}
    const context=await browser.newContext({viewport:{width:size.width,height:size.height},
      ...(args['storage-state']?{storageState:path.resolve(args['storage-state'])}:{})});
    const page=await context.newPage();
    try{
      const response=await page.goto(url.href,{waitUntil:'domcontentloaded',timeout:25000});
      const code=response?.status()||0;
      if([401,403,429].includes(code)){blocked=true;throw new Error('HTTP '+code+' access restriction');}
      if(code>=400)throw new Error('HTTP '+code);
      if(new URL(page.url()).origin!==origin||checkout(page.url()))throw new Error('redirect outside authorized source scope');
      if(p.readySelector)await page.locator(p.readySelector).first().waitFor({timeout:10000});
      if(!args['no-lazy'])await page.evaluate(async()=>{
        const max=Math.min(document.body.scrollHeight,50000);
        for(let y=0;y<max;y+=850){scrollTo(0,y);await new Promise(r=>setTimeout(r,35));}
        scrollTo(0,0);
      });
      for(const action of state.steps||[])await step(page,action,origin);
      await page.waitForTimeout(200);
      const data=await extract(page,folder);
      index.items=index.items.filter(e=>e.key!==key);
      index.items.push({key,url:data.url,viewport:data.viewport,state:state.id,
        folder:path.relative(process.cwd(),folder),resourceUrls:data.resourceUrls,
        images:data.images.length,videos:data.videos.length,links:data.links.length,status:'captured_unverified'});
      index.failures=index.failures.filter(e=>e.key!==key);
      captured++;
    }catch(error){index.failures=index.failures.filter(e=>e.key!==key);index.failures.push({key,url:url.href,error:error.message});failed++;}
    finally{await context.close().catch(()=>{});await save(index);}
  }
  await save(index);
  console.log(JSON.stringify({status:failed?'partial':'captured_unverified',captured,resumed,failed,indexPath}));
  if(failed)process.exitCode=2;
}catch(error){console.error(JSON.stringify({status:'failed',error:error.message,planPath}));process.exitCode=2;}
finally{if(browser)await browser.close();}
