import React, { useState } from 'react';
import {
  Form,
  ActionPanel,
  Action,
  Icon,
  Clipboard,
  showToast,
  Toast,
  popToRoot,
  closeMainWindow,
  Detail,
} from '@raycast/api';
import { ACTION_CONFIGS } from './constants/prompts';
import { ActionType } from './types';
import { requestLLMRewrite } from './services/llm';

export default function Command() {
  const [draft, setDraft] = useState<string>('');
  const [tone, setTone] = useState<ActionType>('improve');
  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = async () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      await showToast({
        style: Toast.Style.Failure,
        title: 'Empty Draft',
        message: 'Please write or paste something in the draft box.',
      });
      return;
    }

    setIsLoading(true);
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: 'Polishing draft...',
    });

    try {
      const config = ACTION_CONFIGS[tone];
      let prompt = config.promptTemplate(trimmed);

      if (customInstructions.trim()) {
        prompt += `\n\nAdditional user guidelines: ${customInstructions.trim()}`;
      }

      const rewritten = await requestLLMRewrite(prompt);
      toast.style = Toast.Style.Success;
      toast.title = 'Ready!';
      setResult(rewritten);
    } catch (err: unknown) {
      toast.style = Toast.Style.Failure;
      toast.title = 'Failed';
      toast.message = err instanceof Error ? err.message : String(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (result) {
    const origWords = draft.split(/\s+/).filter(Boolean).length;
    const newWords = result.split(/\s+/).filter(Boolean).length;

    const markdown = `
# ✍️ Writo Result (${ACTION_CONFIGS[tone].label})

### ✨ Polished Message
> ${result}

---

### 📝 Original Draft
> ${draft}

---
*Stats: **${origWords}** words → **${newWords}** words*
`;

    return (
      <Detail
        markdown={markdown}
        actions={
          <ActionPanel>
            <Action
              title="Paste into Slack"
              icon={Icon.Checkmark}
              onAction={async () => {
                await Clipboard.paste(result);
                await showToast({ style: Toast.Style.Success, title: 'Pasted into Slack!' });
                await closeMainWindow();
                await popToRoot();
              }}
            />
            <Action.CopyToClipboard
              title="Copy to Clipboard"
              content={result}
              shortcut={{ modifiers: ['cmd'], key: 'c' }}
            />
            <Action
              title="Edit Draft"
              icon={Icon.Pencil}
              shortcut={{ modifiers: ['cmd'], key: 'e' }}
              onAction={() => setResult(null)}
            />
          </ActionPanel>
        }
      />
    );
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Polish Draft" icon={Icon.Stars} onSubmit={handleSubmit} />
          <Action
            title="Paste Clipboard into Draft"
            icon={Icon.Clipboard}
            shortcut={{ modifiers: ['cmd'], key: 'v' }}
            onAction={async () => {
              const clip = await Clipboard.readText();
              if (clip) setDraft(clip);
            }}
          />
        </ActionPanel>
      }
    >
      <Form.TextArea
        id="draft"
        title="Draft Message"
        placeholder="Type or paste your rough thoughts, announcements, or Slack reply..."
        value={draft}
        onChange={setDraft}
        enableMarkdown
      />

      <Form.Dropdown
        id="tone"
        title="Writing Tone"
        value={tone}
        onChange={(val) => setTone(val as ActionType)}
      >
        <Form.Dropdown.Item value="improve" title="✨ Improve Writing (Clarity & Flow)" />
        <Form.Dropdown.Item value="professional" title="💼 Professional Tone (Workplace / Exec)" />
        <Form.Dropdown.Item value="concise" title="✂️ Make Concise (Trim fluff)" />
        <Form.Dropdown.Item value="grammar" title="🔍 Fix Grammar (Strict corrections only)" />
        <Form.Dropdown.Item value="simplify" title="🪶 Simplify (Plain English)" />
      </Form.Dropdown>

      <Form.TextField
        id="customInstructions"
        title="Extra Instructions (Optional)"
        placeholder="e.g. Add emojis, format with bullet points, keep under 50 words"
        value={customInstructions}
        onChange={setCustomInstructions}
      />
    </Form>
  );
}
