import { Clipboard, getSelectedText, showHUD } from '@raycast/api';
import { ACTION_CONFIGS } from './constants/prompts';
import { requestLLMRewrite } from './services/llm';

export default async function Command() {
  let text = '';

  try {
    text = await getSelectedText();
  } catch {
    // If getSelectedText fails, check clipboard
    const clip = await Clipboard.readText();
    if (clip && clip.trim()) {
      text = clip;
    }
  }

  const trimmed = text.trim();
  if (!trimmed) {
    await showHUD('⚠️ No text selected. Highlight your draft in Slack first.');
    return;
  }

  await showHUD('✨ Writo: Polishing draft...');

  try {
    const prompt = ACTION_CONFIGS.improve.promptTemplate(trimmed);
    const rewritten = await requestLLMRewrite(prompt);

    if (!rewritten || !rewritten.trim()) {
      await showHUD('❌ Model returned empty text.');
      return;
    }

    // Paste directly into the active app (e.g. Slack)
    await Clipboard.paste(rewritten);
    await showHUD('✨ Draft polished & replaced!');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await showHUD(`❌ Writo: ${msg}`);
  }
}
