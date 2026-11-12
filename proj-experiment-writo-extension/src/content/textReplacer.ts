import { SelectionContext } from '../shared/types';

/**
 * Safely replaces selected text or full value in both native inputs and contenteditable elements.
 * Preserves the browser's native Undo/Redo stack where possible.
 */
export function replaceSelectedText(
  context: SelectionContext,
  newText: string
): boolean {
  const target = context.targetElement || (document.activeElement as HTMLElement | null);

  // 1. ContentEditable Elements (Gmail, Jira, Confluence, Slack, Notion)
  if (context.isContentEditable || (target && target.isContentEditable)) {
    const sel = window.getSelection();

    // Re-apply the captured range if focus was lost
    if (context.range && sel) {
      try {
        sel.removeAllRanges();
        sel.addRange(context.range);
      } catch (e) {
        console.warn('[Writo] Range re-selection failed, using active selection:', e);
      }
    }

    if (sel && sel.rangeCount > 0) {
      // execCommand preserves native undo/redo history in rich editors
      const success = document.execCommand('insertText', false, newText);
      if (!success && context.range) {
        // Fallback: direct range manipulation if execCommand is blocked
        context.range.deleteContents();
        const textNode = document.createTextNode(newText);
        context.range.insertNode(textNode);
        context.range.selectNodeContents(textNode);
        context.range.collapse(false);
      }

      if (target) {
        target.dispatchEvent(new Event('input', { bubbles: true }));
        target.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return true;
    }
  }

  // 2. Standard Textarea and Input
  if (target && (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement)) {
    const start = context.startOffset ?? target.selectionStart ?? 0;
    const end = context.endOffset ?? target.selectionEnd ?? 0;

    target.focus();
    target.setSelectionRange(start, end);

    // Try execCommand first for undo preservation
    const success = document.execCommand('insertText', false, newText);
    if (!success) {
      // Fallback for modern reactive bindings (React / Vue / Angular)
      const proto = target instanceof HTMLTextAreaElement 
        ? window.HTMLTextAreaElement.prototype 
        : window.HTMLInputElement.prototype;
      const nativeValueSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;

      const currentVal = target.value;
      const updatedVal = currentVal.substring(0, start) + newText + currentVal.substring(end);

      nativeValueSetter?.call(target, updatedVal);
      target.dispatchEvent(new Event('input', { bubbles: true }));
      target.dispatchEvent(new Event('change', { bubbles: true }));
      target.setSelectionRange(start + newText.length, start + newText.length);
    }
    return true;
  }

  return false;
}
