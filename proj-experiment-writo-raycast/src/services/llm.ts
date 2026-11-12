import { getPreferenceValues } from '@raycast/api';
import { SYSTEM_PROMPT } from '../constants/prompts';
import { ExtensionPreferences } from '../types';

export function cleanLLMOutput(text: string): string {
  let cleaned = text.trim();

  // Remove markdown code fences if wrapped
  if (cleaned.startsWith('```') && cleaned.endsWith('```')) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '').trim();
  }

  // Remove common preambles like "Here is the rewritten text:" or "Rewritten text:"
  const preambleRegex = /^(here is (the|your)|rewritten text|improved version|here's the):?\s*\n*/i;
  cleaned = cleaned.replace(preambleRegex, '').trim();

  // Remove wrapping quotes if the whole text is enclosed in "..." or '...'
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.substring(1, cleaned.length - 1).trim();
  }

  return cleaned;
}

export async function requestLLMRewrite(prompt: string, signal?: AbortSignal): Promise<string> {
  const prefs = getPreferenceValues<ExtensionPreferences>();
  const provider = prefs.provider || 'ollama';

  if (provider === 'ollama') {
    return callOllama(prompt, prefs, signal);
  } else if (provider === 'gemini') {
    return callGemini(prompt, prefs, signal);
  } else {
    return callOpenAI(prompt, prefs, signal);
  }
}

async function callOllama(prompt: string, prefs: ExtensionPreferences, signal?: AbortSignal): Promise<string> {
  const host = (prefs.ollamaHost || 'http://localhost:11434').replace(/\/+$/, '');
  const model = prefs.ollamaModel || 'llama3.2';

  const endpoint = `${host}/api/generate`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt: `${SYSTEM_PROMPT}\n\n${prompt}`,
        system: SYSTEM_PROMPT,
        stream: false,
        options: {
          temperature: 0.3,
        },
      }),
      signal,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (errorMsg.includes('ECONNREFUSED') || errorMsg.includes('Failed to fetch') || errorMsg.includes('fetch failed')) {
      throw new Error(
        `Ollama is not running at ${host}. Start it in Terminal with 'ollama serve' or check preferences.`
      );
    }
    throw new Error(`Failed to connect to Ollama: ${errorMsg}`);
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    if (response.status === 404) {
      throw new Error(`Model '${model}' not found in Ollama. Pull it in Terminal: 'ollama run ${model}'`);
    }
    throw new Error(`Ollama Error (${response.status}): ${errText || response.statusText}`);
  }

  const data = (await response.json()) as { response?: string };
  if (!data || typeof data.response !== 'string') {
    throw new Error('Unexpected response format from Ollama.');
  }

  return cleanLLMOutput(data.response);
}

async function callOpenAI(prompt: string, prefs: ExtensionPreferences, signal?: AbortSignal): Promise<string> {
  const apiKey = prefs.apiKey?.trim();
  if (!apiKey) {
    throw new Error('API Key is missing. Please set it in Raycast Preferences (Cmd+,).');
  }

  const endpoint = (prefs.apiEndpoint || 'https://api.openai.com/v1').replace(/\/+$/, '') + '/chat/completions';
  const model = prefs.cloudModel || 'gpt-4o-mini';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
    }),
    signal,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`API Error (${response.status}): ${errText || response.statusText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response from AI Provider.');
  }

  return cleanLLMOutput(content);
}

async function callGemini(prompt: string, prefs: ExtensionPreferences, signal?: AbortSignal): Promise<string> {
  const apiKey = prefs.apiKey?.trim();
  if (!apiKey) {
    throw new Error('Gemini API Key is missing. Please set it in Raycast Preferences (Cmd+,).');
  }

  const model = prefs.cloudModel || 'gemini-1.5-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.3,
      },
    }),
    signal,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Gemini Error (${response.status}): ${errText || response.statusText}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    throw new Error('Empty response from Gemini.');
  }

  return cleanLLMOutput(content);
}
