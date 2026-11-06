#!/usr/bin/env node
// Download only observed static media from approved HTTPS hosts with bounded retries.
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const args={},extraHosts=[];
for(let i=2;i<process.argv.length;i++){
  const [k,v]=process.argv[i].replace(/^--/,'').split('=',2);
  const value=v??(process.argv[i+1]&&!process.argv[i+1].startsWith('--')?process.argv[++i]:true);
  if(k==='allow-host')extraHosts.push(String(value).toLowerCase());else args[k]=value;
}
const indexPath=path.resolve(args.index||'references/capture-index.json');
const reportPath=path.resolve(args.report||'references/media-manifest.json');
const folder=path.resolve(args.out||'references/media');
const workers=Math.max(1,Math.min(8,Number(args.concurrency||3)));
const maxBytes=Math.max(1,Number(args['max-bytes']||25_000_000));
const maxTotal=Math.max(1,Number(args['max-total-bytes']||500_000_000));
const timeout=Math.max(1000,Number(args['timeout-ms']||20000));
const hash=x=>createHash('sha256').update(x).digest('hex');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const ext=url=>{
  const suffix=path.extname(new URL(url).pathname).slice(0,8).toLowerCase();
  return /^\.[a-z0-9]{2,7}$/.test(suffix)?suffix:'.bin';
};
const assetMime=(mime,url)=>/^(image\/|video\/|font\/|text\/css|application\/(font-|x-font-|octet-stream))/i.test(mime)
  ||/\.(woff2?|ttf|otf|css)(\?|$)/i.test(url);
async function fetchMedia(url){
  for(let attempt=0;attempt<3;attempt++){
    let res;
    try{res=await fetch(url,{headers:{'User-Agent':'ReferenceArchive/1.0'},
      signal:AbortSignal.timeout(timeout),redirect:'manual'});}
    catch(error){if(attempt<2){await sleep(400*2**attempt);continue;}throw error;}
    if([429,500,502,503,504].includes(res.status)&&attempt<2){
      await res.body?.cancel();await sleep(400*2**attempt);continue;
    }
    if(!res.ok)throw new Error('HTTP '+res.status+' (redirects and access blocks are not bypassed)');
    const mime=(res.headers.get('content-type')||'').split(';')[0];
    if(!assetMime(mime,url))throw new Error('unexpected MIME '+(mime||'(none)'));
    const declared=Number(res.headers.get('content-length')||0);
    if(declared>maxBytes)throw new Error('declared asset exceeds max-bytes');
    if(!res.body)throw new Error('empty response body');
    const reader=res.body.getReader(),chunks=[];
    let size=0;
    while(true){
      const {done,value}=await reader.read();
      if(done)break;
      size+=value.length;
      if(size>maxBytes){await reader.cancel();throw new Error('asset exceeds max-bytes');}
      chunks.push(value);
    }
    return {data:Buffer.concat(chunks,size),mime};
  }
  throw new Error('retries exhausted');
}
try{
  const index=JSON.parse(await readFile(indexPath,'utf8'));
  if(!/^https:\/\//i.test(index.source||''))throw new Error('index.source requires HTTPS');
  const hosts=new Set([new URL(index.source).hostname.toLowerCase(),...extraHosts]);
  const urls=[...new Set((index.items||[]).flatMap(i=>i.resourceUrls||[]).filter(Boolean))].sort();
  const prior=await readFile(reportPath,'utf8').then(JSON.parse).catch(()=>[]);
  const old=new Map((Array.isArray(prior)?prior:[]).map(x=>[x.url,x]));
  await mkdir(folder,{recursive:true});await mkdir(path.dirname(reportPath),{recursive:true});
  let cursor=0,total=0;
  const results=Array(urls.length);
  async function worker(){
    while(cursor<urls.length){
      const i=cursor++,url=urls[i];
      try{
        const u=new URL(url);
        if(u.protocol!=='https:'||!hosts.has(u.hostname.toLowerCase())){
          results[i]={url,status:'skipped_unapproved_host'};continue;
        }
        const previous=old.get(url);
        if(previous?.status==='verified'&&previous.path){
          try{
            const file=path.resolve(previous.path),size=(await stat(file)).size;
            if(size===previous.bytes && hash(await readFile(file))===previous.sha256){
              results[i]=previous;continue;
            }
          }catch{}
        }
        const {data,mime}=await fetchMedia(url);
        if(total+data.length>maxTotal)throw new Error('maximum total download budget exceeded');
        total+=data.length;
        const filename=path.join(folder,hash(url).slice(0,24)+ext(url));
        await writeFile(filename,data);
        results[i]={url,path:path.relative(process.cwd(),filename),sha256:hash(data),
          bytes:data.length,mime,status:'verified'};
      }catch(error){results[i]={url,status:'failed',reason:error.message};}
    }
  }
  await Promise.all(Array.from({length:workers},()=>worker()));
  await writeFile(reportPath,JSON.stringify(results,null,2)+'\n');
  const counts=results.reduce((o,x)=>(o[x.status]=(o[x.status]||0)+1,o),{});
  const failed=results.filter(x=>x.status==='failed').slice(0,10).map(x=>({url:x.url,reason:x.reason}));
  console.log(JSON.stringify({status:counts.failed||counts.skipped_unapproved_host?'partial':'downloaded_hashed_not_offline_verified',
    count:results.length,counts,downloadedBytes:total,failed,reportPath}));
  if(counts.failed||counts.skipped_unapproved_host)process.exitCode=2;
}catch(error){console.error(JSON.stringify({status:'failed',error:error.message,indexPath}));process.exitCode=2;}
