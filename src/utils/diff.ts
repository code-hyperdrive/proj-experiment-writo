export interface DiffPart {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
}

/**
 * Computes a clean word-level diff between original text and rewritten text.
 * Implements Longest Common Subsequence (LCS) for accurate side-by-side or inline highlighting.
 */
export function computeWordDiff(original: string, modified: string): DiffPart[] {
  if (!original && !modified) return [];
  if (!original) return [{ type: 'added', value: modified }];
  if (!modified) return [{ type: 'removed', value: original }];

  // Tokenize into words and punctuation
  const tokenRegex = /(\s+|[^\s\w]+|\w+)/g;
  const words1 = original.match(tokenRegex) || [original];
  const words2 = modified.match(tokenRegex) || [modified];

  const n = words1.length;
  const m = words2.length;

  // For very long texts, cap LCS matrix to avoid browser freeze
  if (n * m > 250000) {
    return [
      { type: 'removed', value: original },
      { type: 'added', value: modified },
    ];
  }

  // DP table for LCS
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (words1[i - 1] === words2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to build diff parts
  const parts: DiffPart[] = [];
  let i = n;
  let j = m;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && words1[i - 1] === words2[j - 1]) {
      parts.unshift({ type: 'unchanged', value: words1[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      parts.unshift({ type: 'added', value: words2[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      parts.unshift({ type: 'removed', value: words1[i - 1] });
      i--;
    }
  }

  // Group adjacent parts of same type
  const merged: DiffPart[] = [];
  for (const part of parts) {
    if (merged.length > 0 && merged[merged.length - 1].type === part.type) {
      merged[merged.length - 1].value += part.value;
    } else {
      merged.push({ ...part });
    }
  }

  return merged;
}
