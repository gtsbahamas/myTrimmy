// remotion.config.ts
import { Config } from '@remotion/cli/config';

Config.setEntryPoint('./src/remotion/Root.tsx');

// Enable webpack caching for faster rebuilds
Config.setCachingEnabled(true);

// Set output codec
Config.setCodec('h264');

// Set pixel format for better compatibility
Config.setPixelFormat('yuv420p');

// Chrome flags for headless rendering
Config.setChromiumOpenGlRenderer('angle');
