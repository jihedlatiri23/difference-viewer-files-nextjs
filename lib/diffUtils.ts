import { diffWords, diffLines, Change } from 'diff';

export interface WordDiff {
  value: string;
  added?: boolean;
  removed?: boolean;
}

export interface LineDiff {
  lineNumber: number;
  oldLineNumber?: number;
  newLineNumber?: number;
  oldLine?: string;
  newLine?: string;
  words: WordDiff[];
  type: 'equal' | 'added' | 'removed' | 'modified' | 'context';
}

/**
 * Get aligned line pairs for side-by-side view
 * Only shows changed lines + context (like GitHub diff viewer)
 */
export function getAlignedLines(
  oldText: string, 
  newText: string,
  contextLines: number = 3
): {
  oldLines: (string | null)[];
  newLines: (string | null)[];
  changes: Array<{ type: 'equal' | 'added' | 'removed' | 'modified' | 'context'; oldIndex: number; newIndex: number; oldLineNumber?: number; newLineNumber?: number }>;
  blocks: any[];
} {
  if (!oldText || !newText) {
    return { oldLines: [], newLines: [], changes: [], blocks: [] };
  }
  
  const oldLines = oldText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const newLines = newText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  const lineDiffs = diffLines(oldText, newText);
  
  // Build result showing only changes + context
  const alignedOld: (string | null)[] = [];
  const alignedNew: (string | null)[] = [];
  const changes: Array<{ type: 'equal' | 'added' | 'removed' | 'modified' | 'context'; oldIndex: number; newIndex: number; oldLineNumber?: number; newLineNumber?: number }> = [];
  
  let oldIdx = 0;
  let newIdx = 0;
  let alignedIdx = 0;
  let lastShownIdx = -1;
  let contextBuffer: Array<{ oldLine: string; newLine: string; oldIdx: number; newIdx: number }> = [];
  
  const flushContext = () => {
    for (const ctx of contextBuffer) {
      alignedOld.push(ctx.oldLine);
      alignedNew.push(ctx.newLine);
      changes.push({
        type: 'equal',
        oldIndex: alignedIdx,
        newIndex: alignedIdx,
        oldLineNumber: ctx.oldIdx + 1,
        newLineNumber: ctx.newIdx + 1
      });
      alignedIdx++;
    }
    contextBuffer = [];
  };
  
  const addEllipsis = () => {
    if (alignedIdx > 0 && changes[alignedIdx - 1]?.type !== 'context') {
      alignedOld.push(null);
      alignedNew.push(null);
      changes.push({
        type: 'context',
        oldIndex: alignedIdx,
        newIndex: alignedIdx
      });
      alignedIdx++;
    }
  };
  
  for (const change of lineDiffs) {
    const lines = change.value.split('\n').filter(l => l.trim().length > 0);
    
    if (change.added) {
      // Flush context before showing added lines
      flushContext();
      
      // Add ellipsis if there's a gap
      if (lastShownIdx >= 0 && alignedIdx - lastShownIdx > contextLines + 1) {
        addEllipsis();
      }
      
      for (const line of lines) {
        alignedOld.push(null);
        alignedNew.push(line);
        changes.push({
          type: 'added',
          oldIndex: alignedIdx,
          newIndex: alignedIdx,
          newLineNumber: newIdx + 1
        });
        alignedIdx++;
        newIdx++;
        lastShownIdx = alignedIdx;
      }
      
      // Clear context buffer after changes
      contextBuffer = [];
      
    } else if (change.removed) {
      // Flush context before showing removed lines
      flushContext();
      
      // Add ellipsis if there's a gap
      if (lastShownIdx >= 0 && alignedIdx - lastShownIdx > contextLines + 1) {
        addEllipsis();
      }
      
      for (const line of lines) {
        alignedOld.push(line);
        alignedNew.push(null);
        changes.push({
          type: 'removed',
          oldIndex: alignedIdx,
          newIndex: alignedIdx,
          oldLineNumber: oldIdx + 1
        });
        alignedIdx++;
        oldIdx++;
        lastShownIdx = alignedIdx;
      }
      
      // Clear context buffer after changes
      contextBuffer = [];
      
    } else {
      // Equal lines - only keep context buffer, don't show all
      for (const line of lines) {
        const oldLine = oldLines[oldIdx] || '';
        const newLine = newLines[newIdx] || '';
        
        if (oldLine === newLine) {
          // Add to context buffer (only keep last N lines)
          contextBuffer.push({ oldLine, newLine, oldIdx, newIdx });
          if (contextBuffer.length > contextLines) {
            contextBuffer.shift();
          }
        } else {
          // Modified line - flush context and show it
          flushContext();
          
          // Add ellipsis if there's a gap
          if (lastShownIdx >= 0 && alignedIdx - lastShownIdx > contextLines + 1) {
            addEllipsis();
          }
          
          alignedOld.push(oldLine);
          alignedNew.push(newLine);
          changes.push({
            type: 'modified',
            oldIndex: alignedIdx,
            newIndex: alignedIdx,
            oldLineNumber: oldIdx + 1,
            newLineNumber: newIdx + 1
          });
          alignedIdx++;
          lastShownIdx = alignedIdx;
          contextBuffer = [];
        }
        oldIdx++;
        newIdx++;
      }
    }
  }
  
  // Flush any remaining context at the end
  flushContext();

  return { oldLines: alignedOld, newLines: alignedNew, changes, blocks: [] };
}

/**
 * Get word-level diff for a single line pair
 */
export function getWordDiffForLine(oldLine: string | null, newLine: string | null): WordDiff[] {
  if (oldLine === null && newLine === null) {
    return [];
  }
  
  if (oldLine === null) {
    const wordDiffs = diffWords('', newLine || '');
    return wordDiffs.map(w => ({
      value: w.value,
      added: w.added || undefined,
      removed: w.removed || undefined,
    }));
  }
  
  if (newLine === null) {
    const wordDiffs = diffWords(oldLine, '');
    return wordDiffs.map(w => ({
      value: w.value,
      added: w.added || undefined,
      removed: w.removed || undefined,
    }));
  }
  
  const wordDiffs = diffWords(oldLine, newLine);
  return wordDiffs.map(w => ({
    value: w.value,
    added: w.added || undefined,
    removed: w.removed || undefined,
  }));
}

/**
 * Get inline diff showing only changes (like GitHub unified diff)
 */
export function getInlineDiff(
  oldText: string, 
  newText: string,
  contextLines: number = 3
): LineDiff[] {
  if (!oldText || !newText) {
    return [];
  }
  
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const lineDiffs = diffLines(oldText, newText);
  
  const result: LineDiff[] = [];
  let oldLineNum = 1;
  let newLineNum = 1;
  let lastShownLine = -1;
  let contextBuffer: Array<{ line: string; oldNum: number; newNum: number }> = [];
  
  const flushContext = () => {
    for (const ctx of contextBuffer) {
      result.push({
        lineNumber: ctx.oldNum,
        oldLineNumber: ctx.oldNum,
        newLineNumber: ctx.newNum,
        oldLine: ctx.line,
        newLine: ctx.line,
        words: [{ value: ctx.line, added: undefined, removed: undefined }],
        type: 'equal',
      });
    }
    contextBuffer = [];
  };
  
  for (const change of lineDiffs) {
    const lines = change.value.split('\n').filter(l => l.length > 0 || change.value.includes('\n'));
    
    if (change.added) {
      flushContext();
      
      if (lastShownLine >= 0 && newLineNum - lastShownLine > contextLines + 1) {
        result.push({
          lineNumber: newLineNum,
          type: 'context',
          words: [{ value: '...', added: undefined, removed: undefined }],
        });
      }
      
      for (const line of lines) {
        if (line.trim()) {
          const wordDiffs = diffWords('', line);
          result.push({
            lineNumber: newLineNum,
            newLineNumber: newLineNum,
            newLine: line,
            words: wordDiffs.map(w => ({
              value: w.value,
              added: w.added || undefined,
              removed: w.removed || undefined,
            })),
            type: 'added',
          });
          newLineNum++;
          lastShownLine = newLineNum;
        }
      }
      contextBuffer = [];
      
    } else if (change.removed) {
      flushContext();
      
      if (lastShownLine >= 0 && oldLineNum - lastShownLine > contextLines + 1) {
        result.push({
          lineNumber: oldLineNum,
          type: 'context',
          words: [{ value: '...', added: undefined, removed: undefined }],
        });
      }
      
      for (const line of lines) {
        if (line.trim()) {
          const wordDiffs = diffWords(line, '');
          result.push({
            lineNumber: oldLineNum,
            oldLineNumber: oldLineNum,
            oldLine: line,
            words: wordDiffs.map(w => ({
              value: w.value,
              added: w.added || undefined,
              removed: w.removed || undefined,
            })),
            type: 'removed',
          });
          oldLineNum++;
          lastShownLine = oldLineNum;
        }
      }
      contextBuffer = [];
      
    } else {
      for (const line of lines) {
        if (line.trim()) {
          const oldLine = oldLines[oldLineNum - 1] || '';
          const newLine = newLines[newLineNum - 1] || '';
          
          if (oldLine === newLine) {
            contextBuffer.push({ line: oldLine, oldNum: oldLineNum, newNum: newLineNum });
            if (contextBuffer.length > contextLines) {
              contextBuffer.shift();
            }
          } else {
            flushContext();
            
            if (lastShownLine >= 0 && oldLineNum - lastShownLine > contextLines + 1) {
              result.push({
                lineNumber: oldLineNum,
                type: 'context',
                words: [{ value: '...', added: undefined, removed: undefined }],
              });
            }
            
            const wordDiffs = diffWords(oldLine, newLine);
            result.push({
              lineNumber: oldLineNum,
              oldLineNumber: oldLineNum,
              newLineNumber: newLineNum,
              oldLine,
              newLine,
              words: wordDiffs.map(w => ({
                value: w.value,
                added: w.added || undefined,
                removed: w.removed || undefined,
              })),
              type: 'modified',
            });
            lastShownLine = oldLineNum;
            contextBuffer = [];
          }
          oldLineNum++;
          newLineNum++;
        }
      }
    }
  }
  
  flushContext();
  return result;
}
