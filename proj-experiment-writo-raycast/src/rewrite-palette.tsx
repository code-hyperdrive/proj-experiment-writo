import React, { useState, useEffect } from 'react';
import {
  List,
  ActionPanel,
  Action,
  Icon,
  getSelectedText,
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
  const [selectedText, setSelectedText] = useState<string>('');
  const [loadingText, setLoadingText] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [previewResult, setPreviewResult] = useState<{
    original: string;
    rewritten: string;
    actionLabel: string;
  } | null>(null);

  useEffect(() => {
    async function fetchSelection() {
      try {
        const text = await getSelectedText();
        if (text && text.trim()) {
          setSelectedText(text.trim());
        }
      } catch {
        // Fall back to clipboard if available
        try {
          const clip = await Clipboard.readText();
          if (clip && clip.trim()) {
            setSelectedText(clip.trim());
          }
        } catch {}
      } finally {
        setLoadingText(false);
      }
    }

    fetchSelection();
  }, []);

  // Execute rewrite and paste immediately
  const handleDirectPaste = async (actionKey: ActionType) => {
    const config = ACTION_CONFIGS[actionKey];
    if (!selectedText) {
      await showToast({
        style: Toast.Style.Failure,
        title: 'No text selected',
        message: 'Select your draft in Slack before opening Writo.',
      });
      return;
    }

    setIsProcessing(true);
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: `Applying ${config.label}...`,
    });

    try {
      const prompt = config.promptTemplate(selectedText);
      const result = await requestLLMRewrite(prompt);

      await Clipboard.paste(result);
      toast.style = Toast.Style.Success;
      toast.title = `Polished with ${config.label}!`;
      await closeMainWindow();
      await popToRoot();
    } catch (err: unknown) {
      toast.style = Toast.Style.Failure;
      toast.title = 'Rewrite failed';
      toast.message = err instanceof Error ? err.message : String(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Preview rewrite with diff and metrics before pasting
  const handlePreview = async (actionKey: ActionType) => {
    const config = ACTION_CONFIGS[actionKey];
    if (!selectedText) return;

    setIsProcessing(true);
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: `Generating ${config.label}...`,
    });

    try {
      const prompt = config.promptTemplate(selectedText);
      const result = await requestLLMRewrite(prompt);

      toast.style = Toast.Style.Success;
      toast.title = 'Ready for review';

      setPreviewResult({
        original: selectedText,
        rewritten: result,
        actionLabel: config.label,
      });
    } catch (err: unknown) {
      toast.style = Toast.Style.Failure;
      toast.title = 'Rewrite failed';
      toast.message = err instanceof Error ? err.message : String(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // If preview is active, render comparison view
  if (previewResult) {
    const origWords = previewResult.original.split(/\s+/).filter(Boolean).length;
    const newWords = previewResult.rewritten.split(/\s+/).filter(Boolean).length;
    const wordDiff = newWords - origWords;
    const diffText = wordDiff === 0 ? 'Same length' : wordDiff > 0 ? `+${wordDiff} words` : `${wordDiff} words`;

    const markdown = `
# ✍️ ${previewResult.actionLabel}

### ✨ Polished Result
> ${previewResult.rewritten}

---

### 📝 Original Draft
> ${previewResult.original}

---
*Stats: **${origWords}** words → **${newWords}** words (${diffText})*
`;

    return (
      <Detail
        markdown={markdown}
        actions={
          <ActionPanel>
            <Action
              title="Replace in Active App (Slack)"
              icon={Icon.Checkmark}
              onAction={async () => {
                await Clipboard.paste(previewResult.rewritten);
                await showToast({ style: Toast.Style.Success, title: 'Replaced in Slack!' });
                await closeMainWindow();
                await popToRoot();
              }}
            />
            <Action.CopyToClipboard
              title="Copy Polished Text"
              content={previewResult.rewritten}
              shortcut={{ modifiers: ['cmd'], key: 'c' }}
            />
            <Action
              title="Back to Tones"
              icon={Icon.ArrowLeft}
              shortcut={{ modifiers: ['cmd'], key: 'b' }}
              onAction={() => setPreviewResult(null)}
            />
          </ActionPanel>
        }
      />
    );
  }

  const actionKeys: ActionType[] = ['improve', 'professional', 'concise', 'grammar', 'simplify'];

  const getIconForAction = (key: ActionType) => {
    switch (key) {
      case 'improve':
        return Icon.Stars;
      case 'professional':
        return Icon.Briefcase;
      case 'concise':
        return Icon.Scissors;
      case 'grammar':
        return Icon.CheckCircle;
      case 'simplify':
        return Icon.Feather;
      default:
        return Icon.Pencil;
    }
  };

  return (
    <List
      isLoading={loadingText || isProcessing}
      searchBarPlaceholder={selectedText ? `Draft: "${selectedText.slice(0, 45)}..."` : 'Highlight text in Slack first...'}
    >
      <List.Section title={selectedText ? `Selected Draft (${selectedText.split(/\s+/).length} words)` : 'No Text Selected'}>
        {actionKeys.map((key) => {
          const config = ACTION_CONFIGS[key];
          return (
            <List.Item
              key={key}
              icon={getIconForAction(key)}
              title={config.label}
              subtitle={config.description}
              accessories={[{ text: 'Enter: Replace' }, { text: '⌘+P: Preview' }]}
              actions={
                <ActionPanel>
                  <Action
                    title={`Replace with ${config.label}`}
                    icon={Icon.Checkmark}
                    onAction={() => handleDirectPaste(key)}
                  />
                  <Action
                    title={`Preview & Compare`}
                    icon={Icon.Eye}
                    shortcut={{ modifiers: ['cmd'], key: 'p' }}
                    onAction={() => handlePreview(key)}
                  />
                  {selectedText && (
                    <Action.CopyToClipboard
                      title="Copy Original Text"
                      content={selectedText}
                      shortcut={{ modifiers: ['cmd', 'shift'], key: 'c' }}
                    />
                  )}
                </ActionPanel>
              }
            />
          );
        })}
      </List.Section>
    </List>
  );
}
