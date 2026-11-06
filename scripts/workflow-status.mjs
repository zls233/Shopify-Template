#!/usr/bin/env node
// Small checkpoint summary: never echo secrets, credentials, raw logs or full project memory.
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const p=process.argv.indexOf('--file');
const file=path.resolve(p>=0?process.argv[p+1]:'agent-evidence/stage-state.json');
try{
  const state=JSON.parse(await readFile(file,'utf8'));
  const counts={};
  for(const item of (Array.isArray(state.items)?state.items:[])){
    const status=item.status||'unknown';
    counts[status]=(counts[status]||0)+1;
  }
  console.log(JSON.stringify({stage:state.stage||null,status:state.status||null,store:state.store||null,
    inputHash:state.inputHash||state.promptCommit||null,draftThemeId:state.draftThemeId||null,
    statusCounts:counts,blockers:Array.isArray(state.blockers)?state.blockers.length:null,
    next:state.next||null,checkpoint:file}));
}catch(error){
  console.error(JSON.stringify({status:'unavailable',checkpoint:file,reason:error.code||error.message}));process.exitCode=2;
}
