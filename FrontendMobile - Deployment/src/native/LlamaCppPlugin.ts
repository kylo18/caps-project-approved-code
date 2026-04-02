import { registerPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';

export interface LlamaCppPlugin {
  loadModel(options: { modelPath: string; nCtx?: number; nThreads?: number }): Promise<{ success: boolean }>;
  generate(options: { prompt: string }): Promise<void>;
  abort(): Promise<void>;
  unload(): Promise<{ success: boolean }>;
  addListener(eventName: 'onToken', listenerFunc: (data: { token: string }) => void): Promise<PluginListenerHandle>;
  addListener(eventName: 'onComplete', listenerFunc: () => void): Promise<PluginListenerHandle>;
  addListener(eventName: 'onError', listenerFunc: (data: { error: string }) => void): Promise<PluginListenerHandle>;
}

const LlamaCpp = registerPlugin<LlamaCppPlugin>('LlamaCpp', {
  web: () => {
    throw new Error('LlamaCpp is only available on native platforms');
  },
});

export { LlamaCpp };
