/**
 * Test script for asset bundle generation
 * Run with: npx tsx scripts/test-bundle.ts
 */

import { createAssetBundleWithCounts } from '../src/lib/asset-generator/bundle-creator';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { execSync } from 'child_process';

async function test() {
  console.log('Loading lifeOS logo...');
  const logoBuffer = readFileSync('/Users/tywells/Downloads/lifeOS.png');

  console.log('Generating bundle...');
  const startTime = Date.now();

  const result = await createAssetBundleWithCounts(logoBuffer, {
    appName: 'LifeOS',
    themeColor: '#2E7D32',
    backgroundColor: '#ffffff',
  });

  const duration = Date.now() - startTime;

  console.log('\n✅ Bundle created!');
  console.log(`Duration: ${(duration / 1000).toFixed(1)}s`);
  console.log(`Total assets: ${result.platformCounts.total}`);
  console.log(`  iOS: ${result.platformCounts.ios}`);
  console.log(`  Android: ${result.platformCounts.android}`);
  console.log(`  Web: ${result.platformCounts.web}`);
  console.log(`  Social: ${result.platformCounts.social}`);

  // Save the ZIP
  const outDir = '/tmp/bundle-test';
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  const zipPath = `${outDir}/lifeos-assets.zip`;
  writeFileSync(zipPath, result.buffer);
  console.log(`\nSaved to: ${zipPath}`);
  console.log(`Size: ${(result.buffer.length / 1024).toFixed(1)} KB`);

  // Extract
  execSync(`cd ${outDir} && rm -rf extracted && mkdir extracted && cd extracted && unzip -q ../lifeos-assets.zip`);

  console.log('\n📁 Bundle structure:');
  const tree = execSync(`cd ${outDir}/extracted && find . -type d | sort`).toString();
  console.log(tree);

  console.log('\n📄 Key files:');
  const files = execSync(`cd ${outDir}/extracted && ls -la original/ light-mode/ dark-mode/ 2>/dev/null | head -30`).toString();
  console.log(files);

  console.log('\n🔗 View extracted files:');
  console.log(`  file://${outDir}/extracted/`);
}

test().catch(console.error);
