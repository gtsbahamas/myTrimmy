// src/remotion/entry.tsx
// Entry point for Remotion Lambda - calls registerRoot

import { registerRoot } from 'remotion';
import { RemotionRoot } from './Root';

registerRoot(RemotionRoot);
