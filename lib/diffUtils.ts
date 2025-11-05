import { diffWords, diffLines, Change } from 'diff';

export interface WordDiff {
  value: string;
  added?: boolean;
  removed?: boolean;
}

export interface LineDiff {
  lineNumber: number;
  oldLine?: string;
  newLine?: string;
  words: WordDiff[];
  type: 'equal' | 'added' | 'removed' | 'modified';
}

/**
 * Perform word-level diff on two texts
 */
export function getWordLevelDiff(oldText: string, newText: string): LineDiff[] {
  // Ensure we have valid text
  if (!oldText || !newText) {
    return [];
  }
  
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  
  const lineDiffs = diffLines(oldText, newText);
  const result: LineDiff[] = [];
  let oldLineNum = 1;
  let newLineNum = 1;

  for (const change of lineDiffs) {
    const lines = change.value.split('\n').filter(l => l.length > 0 || change.value.includes('\n'));
    
    if (change.added) {
      // Added lines
      for (const line of lines) {
        if (line.trim()) {
          const wordDiffs = diffWords('', line);
          result.push({
            lineNumber: newLineNum,
            newLine: line,
            words: wordDiffs.map(w => ({
              value: w.value,
              added: w.added || undefined,
              removed: w.removed || undefined,
            })),
            type: 'added',
          });
          newLineNum++;
        }
      }
    } else if (change.removed) {
      // Removed lines
      for (const line of lines) {
        if (line.trim()) {
          const wordDiffs = diffWords(line, '');
          result.push({
            lineNumber: oldLineNum,
            oldLine: line,
            words: wordDiffs.map(w => ({
              value: w.value,
              added: w.added || undefined,
              removed: w.removed || undefined,
            })),
            type: 'removed',
          });
          oldLineNum++;
        }
      }
    } else {
      // Equal or modified lines - need to check word-level changes
      for (const line of lines) {
        if (line.trim()) {
          // Find corresponding lines in old and new
          const oldLine = oldLines[oldLineNum - 1] || '';
          const newLine = newLines[newLineNum - 1] || '';
          
          if (oldLine === newLine) {
            // Completely equal
            result.push({
              lineNumber: oldLineNum,
              oldLine,
              newLine,
              words: [{ value: line, added: undefined, removed: undefined }],
              type: 'equal',
            });
          } else {
            // Modified - do word-level diff
            const wordDiffs = diffWords(oldLine, newLine);
            result.push({
              lineNumber: oldLineNum,
              oldLine,
              newLine,
              words: wordDiffs.map(w => ({
                value: w.value,
                added: w.added || undefined,
                removed: w.removed || undefined,
              })),
              type: 'modified',
            });
          }
          oldLineNum++;
          newLineNum++;
        }
      }
    }
  }

  return result;
}

/**
 * Get aligned line pairs for side-by-side view
 */
export function getAlignedLines(oldText: string, newText: string): {
  oldLines: (string | null)[];
  newLines: (string | null)[];
  changes: Array<{ type: 'equal' | 'added' | 'removed' | 'modified'; oldIndex: number; newIndex: number }>;
} {
  // Ensure we have valid text
  if (!oldText || !newText) {
    return { oldLines: [], newLines: [], changes: [] };
  }
  
  const oldLines = oldText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const newLines = newText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  const lineDiffs = diffLines(oldText, newText);
  
  const alignedOld: (string | null)[] = [];
  const alignedNew: (string | null)[] = [];
  const changes: Array<{ type: 'equal' | 'added' | 'removed' | 'modified'; oldIndex: number; newIndex: number }> = [];
  
  let oldLineIdx = 0;
  let newLineIdx = 0;

  for (const change of lineDiffs) {
    const lines = change.value.split('\n').filter(l => l.trim().length > 0);
    
    if (change.added) {
      // Added lines - only in new version
      for (const line of lines) {
        alignedOld.push(null);
        alignedNew.push(line);
        const idx = alignedOld.length - 1;
        changes.push({ type: 'added', oldIndex: idx, newIndex: idx });
        newLineIdx++;
      }
    } else if (change.removed) {
      // Removed lines - only in old version
      for (const line of lines) {
        alignedOld.push(line);
        alignedNew.push(null);
        const idx = alignedOld.length - 1;
        changes.push({ type: 'removed', oldIndex: idx, newIndex: idx });
        oldLineIdx++;
      }
    } else {
      // Equal or potentially modified lines
      for (const line of lines) {
        const oldLine = oldLines[oldLineIdx] || '';
        const newLine = newLines[newLineIdx] || '';
        
        if (oldLine === newLine) {
          alignedOld.push(oldLine);
          alignedNew.push(newLine);
          const idx = alignedOld.length - 1;
          changes.push({ type: 'equal', oldIndex: idx, newIndex: idx });
        } else {
          alignedOld.push(oldLine);
          alignedNew.push(newLine);
          const idx = alignedOld.length - 1;
          changes.push({ type: 'modified', oldIndex: idx, newIndex: idx });
        }
        oldLineIdx++;
        newLineIdx++;
      }
    }
  }

  return { oldLines: alignedOld, newLines: alignedNew, changes };
}

/**
 * Get word-level diff for a single line pair
 */
export function getWordDiffForLine(oldLine: string | null, newLine: string | null): WordDiff[] {
  if (oldLine === null && newLine === null) {
    return [];
  }
  
  if (oldLine === null) {
    // Added line
    const wordDiffs = diffWords('', newLine || '');
    return wordDiffs.map(w => ({
      value: w.value,
      added: w.added || undefined,
      removed: w.removed || undefined,
    }));
  }
  
  if (newLine === null) {
    // Removed line
    const wordDiffs = diffWords(oldLine, '');
    return wordDiffs.map(w => ({
      value: w.value,
      added: w.added || undefined,
      removed: w.removed || undefined,
    }));
  }
  
  // Both lines exist - compare them
  const wordDiffs = diffWords(oldLine, newLine);
  return wordDiffs.map(w => ({
    value: w.value,
    added: w.added || undefined,
    removed: w.removed || undefined,
  }));
}

