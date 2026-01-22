import { getRenderProgress } from '@remotion/lambda/client';

const progress = await getRenderProgress({
  renderId: process.argv[2] || '3q4y6llcmj',
  bucketName: 'remotionlambda-useast1-pco1r2buee',
  region: 'us-east-1',
  functionName: 'remotion-render-4-0-407-mem2048mb-disk2048mb-120sec'
});

console.log(JSON.stringify({
  done: progress.done,
  overallProgress: progress.overallProgress,
  outputFile: progress.outputFile,
  fatalErrorEncountered: progress.fatalErrorEncountered,
  errors: progress.errors?.map(e => e.message)
}, null, 2));
