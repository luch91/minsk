import {writeFileSync} from 'node:fs';
import {manifest,renderReleaseReference} from './release-manifest.mjs';

writeFileSync(new URL('../docs/release-reference.md',import.meta.url),renderReleaseReference(manifest));
console.log('Generated docs/release-reference.md from config/release-manifest.json.');
