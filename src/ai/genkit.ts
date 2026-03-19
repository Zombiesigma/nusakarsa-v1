'use server';
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

const googleAiPlugin = googleAI();

export const ai = genkit({
  plugins: [googleAiPlugin],
});

export { googleAiPlugin as googleAI };
