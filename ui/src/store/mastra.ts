import { createClient } from '@mastra/client-js';

// Mastraクライアントの設定
export const mastraClient = createClient({
  apiKey: import.meta.env.VITE_MASTRA_API_KEY,
});

// クライアントのエクスポート
export default mastraClient; 