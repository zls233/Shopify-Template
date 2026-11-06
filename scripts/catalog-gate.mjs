#!/usr/bin/env node
// Read-only pre-import gate. Source evidence must still be reviewed by the operator.
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const args={};
for(let i=2;i<process.argv.length;i++){
  const [k,v]=process.argv[i].replace(/^--/,'').split('=',2);
  args[k]=v??(process.argv[i+1]&&!process.argv[i+1].startsWith('--')?process.argv[++i]:true);
}
const manifestPath=path.resolve(args.manifest||'data/catalog/source-coverage.json');
const productsPath=path.resolve(args.products||'data/catalog/normalized.json');
const reportPath=path.resolve(args.report||'agent-evidence/catalog/discovery-gate.json');
const value=(x)=>String(x??'').trim();
const unique=(arr)=>[...new Set(arr)];
const sha=(x)=>createHash('sha256').update(x).digest('hex');
try{
  const [raw,normalizedRaw]=await Promise.all([readFile(manifestPath,'utf8'),readFile(productsPath,'utf8')]);
  const manifest=JSON.parse(raw), input=JSON.parse(normalizedRaw);
  const products=Array.isArray(input)?input:input.products;
  if(!Array.isArray(products))throw new Error('Expected a product array or {products: []}');
  const issues=[],warnings=[],discovery=manifest.discovery;
  if(!/^https:\/\//i.test(manifest.source||''))issues.push('source must be an HTTPS URL');
  if(!manifest.snapshotAt||Number.isNaN(Date.parse(manifest.snapshotAt)))issues.push('snapshotAt is missing or invalid');
  if(!Array.isArray(discovery)||!discovery.length)issues.push('At least one discovery source is required');
  for(const [i,d] of (Array.isArray(discovery)?discovery:[]).entries()){
    if(!value(d.kind)||!value(d.evidence))issues.push('discovery source '+i+' missing kind/evidence');
    if(d.status!=='complete'||d.terminal!==true)issues.push('discovery source '+i+' is not complete with terminal proof');
  }
  if(!Array.isArray(manifest.expectedHandles)||!manifest.expectedHandles.length)issues.push('expectedHandles missing or empty');
  if(manifest.failures?.length)issues.push('unresolved discovery failures: '+manifest.failures.length);
  const expected=(Array.isArray(manifest.expectedHandles)?manifest.expectedHandles:[]).map(value).filter(Boolean);
  const actual=products.map(p=>value(p?.handle)).filter(Boolean);
  const exclusions=Array.isArray(manifest.excluded)?manifest.excluded:[];
  const excluded=exclusions.map(x=>value(x?.handle)).filter(Boolean);
  for(const [name,arr] of [['expected',expected],['normalized',actual],['excluded',excluded]]){
    if(unique(arr).length!==arr.length)issues.push('duplicate handles in '+name);
  }
  const es=new Set(expected),as=new Set(actual),xs=new Set(excluded);
  for(const x of exclusions){
    if(!value(x?.reason))issues.push('excluded item missing a reason: '+value(x?.handle));
    if(!es.has(value(x?.handle)))issues.push('excluded item absent from expectedHandles: '+value(x?.handle));
  }
  const missing=unique(expected.filter(h=>!as.has(h)&&!xs.has(h)));
  const unexpected=unique(actual.filter(h=>!es.has(h)));
  const excludedImported=unique(excluded.filter(h=>as.has(h)));
  if(missing.length)issues.push('expected handles missing: '+missing.length);
  if(unexpected.length)issues.push('undiscovered handles present: '+unexpected.length);
  if(excludedImported.length)issues.push('excluded handles imported: '+excludedImported.length);
  let variants=0,sourceSku=0,missingSku=0;
  const missingVariants=[],duplicateOptions=[];
  for(const p of products){
    if(!value(p?.handle)){issues.push('normalized product missing handle');continue;}
    if(!Array.isArray(p.variants)||!p.variants.length){missingVariants.push(p.handle);continue;}
    const combos=new Set();
    for(const v of p.variants){
      variants++;
      if(value(v.sku))sourceSku++;else missingSku++;
      const options=v.optionValues||v.options;
      if(options){
        const key=JSON.stringify(Array.isArray(options)?options:Object.entries(options).sort());
        if(combos.has(key))duplicateOptions.push(p.handle);
        combos.add(key);
      }
    }
  }
  if(missingVariants.length)issues.push('products without variants: '+missingVariants.length);
  if(duplicateOptions.length)issues.push('duplicate option combinations: '+unique(duplicateOptions).length);
  if(missingSku)warnings.push('missing source SKUs: '+missingSku+' (do not invent)');
  const counts={discoverySources:discovery?.length||0,expected:expected.length,normalized:products.length,excluded:excluded.length,variants,sourceSku,missingSku};
  const report={stage:'3-1',gate:'pre_bulk_import',source:manifest.source||null,snapshotAt:manifest.snapshotAt||null,
    manifestSha256:sha(raw),productsSha256:sha(normalizedRaw),counts,missing,unexpected,excludedImported,
    missingVariants,duplicateOptions:unique(duplicateOptions),issues,warnings,
    canBulkImport:issues.length===0,status:issues.length?'blocked':'passed_declaration_gate',
    note:'A pass checks declared source coverage, not the actual correctness of the external index. Review original paging and terminal evidence.'};
  await mkdir(path.dirname(reportPath),{recursive:true});
  await writeFile(reportPath,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({status:report.status,canBulkImport:report.canBulkImport,counts,issueCount:issues.length,missing:missing.slice(0,20),warnings,reportPath}));
  if(issues.length)process.exitCode=2;
}catch(error){
  console.error(JSON.stringify({status:'failed',error:error.message,manifestPath,productsPath}));process.exitCode=2;
}
