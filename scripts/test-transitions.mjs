// Test script to verify TransitionSeries and spring animations work correctly
import { renderMediaOnLambda, getRenderProgress } from '@remotion/lambda/client';

const testScript = {
  style: 'modern',
  colors: {
    primary: '#6366f1',
    secondary: '#a5b4fc',
    accent: '#818cf8',
    background: '#0f0f23',
    text: '#ffffff'
  },
  logoUrl: null,
  scenes: [
    {
      type: 'intro',
      headline: 'Testing Remotion Skills',
      duration: 60
    },
    {
      type: 'feature',
      title: 'Smooth Transitions',
      description: 'Fade transitions between scenes using TransitionSeries',
      duration: 90
    },
    {
      type: 'feature',
      title: 'Spring Animations',
      description: 'Natural motion with spring physics',
      duration: 90
    },
    {
      type: 'cta',
      headline: 'Ready for Production',
      buttonText: 'Get Started',
      url: 'mytrimmy.com',
      duration: 60
    }
  ]
};

console.log('Starting test render with TransitionSeries...');
console.log('Scenes:', testScript.scenes.length);
console.log('Expected: fade transitions between each scene\n');

const { renderId, bucketName } = await renderMediaOnLambda({
  serveUrl: 'https://remotionlambda-useast1-pco1r2buee.s3.us-east-1.amazonaws.com/sites/mytrimmy-promo-videos/index.html',
  composition: 'PromoVideo-Landscape',
  codec: 'h264',
  region: 'us-east-1',
  functionName: 'remotion-render-4-0-407-mem2048mb-disk2048mb-120sec',
  inputProps: {
    script: testScript,
    format: 'landscape',
    falAssets: {}
  }
});

console.log('Render started:', renderId);
console.log('Bucket:', bucketName);
console.log('');

// Poll for progress
let done = false;
while (!done) {
  const progress = await getRenderProgress({
    renderId,
    bucketName,
    region: 'us-east-1',
    functionName: 'remotion-render-4-0-407-mem2048mb-disk2048mb-120sec'
  });

  const pct = Math.round(progress.overallProgress * 100);
  process.stdout.write('\rProgress: ' + pct + '%   ');

  if (progress.done) {
    done = true;
    console.log('\n\n✅ Render complete!');
    console.log('Output:', progress.outputFile);
  } else if (progress.fatalErrorEncountered) {
    console.error('\n\n❌ Render failed:', progress.errors);
    process.exit(1);
  } else {
    await new Promise(r => setTimeout(r, 2000));
  }
}
