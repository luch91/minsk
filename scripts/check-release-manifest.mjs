import {readFileSync} from 'node:fs';
import {manifest,renderReleaseReference} from './release-manifest.mjs';

const fail=message=>{throw new Error(`Release manifest check failed: ${message}`);};
const requiredDeployments=['production','releaseCandidate','historicalDeterministicReview'];
if(manifest.schemaVersion!==1||manifest.product?.name!=='Minsk')fail('unexpected schema or product name');
for(const key of requiredDeployments)if(!manifest.deployments?.[key])fail(`missing deployment ${key}`);
if(manifest.deployments.production.status!=='current'||manifest.deployments.historicalDeterministicReview.status!=='historical')fail('deployment status is ambiguous');
if(!manifest.deployments.production.liveProviders||manifest.deployments.historicalDeterministicReview.liveProviders)fail('provider modes are incorrect');

const systems=new Map(manifest.systems.map(item=>[item.id,item]));
for(const id of ['workflow-extraction','investigation-assistance','complex-investigation','challenger-analysis','policy-evaluation','safeguard-verification','certificate'])if(!systems.has(id))fail(`missing system ${id}`);
if(systems.get('workflow-extraction').modelIdentifier!=='muse-spark-1.3')fail('Spark identifier drift');
if(systems.get('complex-investigation').modelIdentifier!=='muse-wonder-1.0')fail('Wonder identifier drift');
if(systems.get('challenger-analysis').modelIdentifier!=='meta-models/muse-spark-open-1026')fail('Baseten identifier drift');

const modelSource=readFileSync(new URL('../apps/api/src/models.ts',import.meta.url),'utf8');
const challengerSource=readFileSync(new URL('../apps/api/src/challenger.ts',import.meta.url),'utf8');
for(const id of ['workflow-extraction','complex-investigation'])if(!modelSource.includes(`'${systems.get(id).modelIdentifier}'`))fail(`${id} does not match API source`);
if(!challengerSource.includes(`'${systems.get('challenger-analysis').modelIdentifier}'`))fail('challenger does not match API source');

const wrangler=readFileSync(new URL('../apps/api/wrangler.preview.jsonc',import.meta.url),'utf8');
for(const key of ['production','releaseCandidate']){
  const deployment=manifest.deployments[key];
  if(!wrangler.includes(`"name": "${deployment.workerName}"`))fail(`${key} Worker name drift`);
  if(!wrangler.includes(deployment.frontendUrl))fail(`${key} origin drift`);
}

const workbench=readFileSync(new URL('../apps/web/src/workbench/Workbench.jsx',import.meta.url),'utf8');
if(!workbench.includes("release-manifest.json"))fail('workbench does not consume the manifest');
for(const identifier of manifest.systems.map(item=>item.modelIdentifier))if(workbench.includes(`<td>${identifier}</td>`))fail(`hard-coded UI identifier ${identifier}`);

const generated=readFileSync(new URL('../docs/release-reference.md',import.meta.url),'utf8');
if(generated!==renderReleaseReference(manifest))fail('docs/release-reference.md is stale; run pnpm release:sync');

console.log('Release manifest, runtime identifiers, deployment origins, UI and generated documentation agree.');
