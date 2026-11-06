// Generic idempotent batch executor. The caller owns Shopify permissions and remote readback.
import {readFile,writeFile,rename,mkdir,open,unlink} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const digest=x=>createHash('sha256').update(x).digest('hex');
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export async function runBatches({items,idOf,processItem,checkpointPath,inputHash,
  concurrency=3,maxAttempts=2,isRetryable=()=>false,retryDelayMs=500}={}){
  if(!Array.isArray(items)||typeof idOf!=='function'||typeof processItem!=='function')
    throw new TypeError('items[], idOf and processItem required');
  if(!checkpointPath)throw new Error('checkpointPath required');
  if(!Number.isInteger(maxAttempts)||maxAttempts<1)throw new Error('maxAttempts must be >=1');
  const originalIds=items.map(idOf);
  if(originalIds.some(x=>x===null||x===undefined||String(x).trim()===''))
    throw new Error('missing stable ID');
  const ids=originalIds.map(String);
  if(new Set(ids).size!==ids.length)throw new Error('duplicate stable IDs');
  const fingerprint=inputHash||digest(JSON.stringify(items));
  const target=path.resolve(checkpointPath);
  await mkdir(path.dirname(target),{recursive:true});
  const lock=await open(target+'.lock','wx').catch(error=>{
    throw new Error('checkpoint already locked: '+error.message);
  });
  let snapshot={version:1,inputHash:fingerprint,completed:{},failures:{}};
  let pendingPersist=Promise.resolve();
  const persist=()=>{
    pendingPersist=pendingPersist.then(async()=>{
      const tmp=target+'.tmp';
      await writeFile(tmp,JSON.stringify(snapshot,null,2)+'\n');
      await rename(tmp,target);
    });
    return pendingPersist;
  };
  try{
    try{
      const existing=JSON.parse(await readFile(target,'utf8'));
      if(existing.inputHash!==fingerprint)
        throw new Error('input changed: use a new checkpoint path or explicitly migrate');
      snapshot=existing;
    }catch(error){if(error.code!=='ENOENT')throw error;}
    let cursor=0,done=0,resumed=0,failed=0;
    async function worker(){
      while(cursor<items.length){
        const index=cursor++,item=items[index],id=ids[index];
        if(snapshot.completed[id]){resumed++;continue;}
        let lastError;
        for(let attempt=1;attempt<=maxAttempts;attempt++){
          try{
            // processItem must include required remote readback before returning success.
            await processItem(item,{id,attempt});
            snapshot.completed[id]={verifiedAt:new Date().toISOString()};
            delete snapshot.failures[id];
            done++;await persist();lastError=null;break;
          }catch(error){
            lastError=error;
            if(attempt<maxAttempts&&isRetryable(error,item))
              await pause(retryDelayMs*2**(attempt-1));
            else break;
          }
        }
        if(lastError){
          snapshot.failures[id]={reason:String(lastError.message||lastError).slice(0,500)};
          failed++;await persist();
        }
      }
    }
    await Promise.all(Array.from({length:Math.min(8,Math.max(1,concurrency))},()=>worker()));
    await persist();
    return {status:failed?'partial':'completed',inputHash:fingerprint,count:items.length,
      done,resumed,failed,failedIds:Object.keys(snapshot.failures),checkpointPath:target};
  }finally{
    await pendingPersist.catch(()=>{});
    await lock.close();
    await unlink(target+'.lock').catch(()=>{});
  }
}
