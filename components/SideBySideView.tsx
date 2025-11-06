'use client';

import React, { useState } from 'react';
import { getWordDiffForLine } from '@/lib/diffUtils';

interface SideBySideViewProps {
  oldLines: (string | null)[];
  newLines: (string | null)[];
  changes: Array<{ type: 'equal' | 'added' | 'removed' | 'modified' | 'context'; oldIndex: number; newIndex: number; oldLineNumber?: number; newLineNumber?: number }>;
}

export default function SideBySideView({ oldLines, newLines, changes }: SideBySideViewProps) {
  const [collapsedSections, setCollapsedSections] = useState<Set<number>>(new Set());

  const renderLine = (line: string | null, type: 'old' | 'new', idx: number, changeType: string, lineNumber?: number) => {
    if (line === null && changeType === 'context') {
      return (
        <div className="line-ellipsis">
          <span className="ellipsis-text">⋯</span>
          <span className="ellipsis-hint">Unchanged lines hidden</span>
        </div>
      );
    }
    
    if (line === null) {
      return <div className="line-empty"></div>;
    }

    // Get the corresponding line from the other side (lines are already aligned by index)
    const otherLine = type === 'old' ? newLines[idx] : oldLines[idx];
    
    // Get word-level diff
    const wordDiffs = type === 'old'
      ? getWordDiffForLine(line, changeType === 'modified' ? (otherLine || '') : (changeType === 'removed' ? null : otherLine))
      : getWordDiffForLine(changeType === 'modified' ? (otherLine || '') : (changeType === 'added' ? null : otherLine), line);

    const lineClass = `line-${changeType === 'equal' ? 'equal' : changeType}`;

    return (
      <div className={`line ${lineClass}`}>
        {wordDiffs.map((word, wordIdx) => {
          if (word.added && type === 'new') {
            return (
              <span key={wordIdx} className="diff-added">
                {word.value}
              </span>
            );
          }
          if (word.removed && type === 'old') {
            return (
              <span key={wordIdx} className="diff-removed">
                {word.value}
              </span>
            );
          }
          if (changeType === 'modified') {
            if (word.added && type === 'new') {
              return (
                <span key={wordIdx} className="diff-modified-added">
                  {word.value}
                </span>
              );
            }
            if (word.removed && type === 'old') {
              return (
                <span key={wordIdx} className="diff-modified-removed">
                  {word.value}
                </span>
              );
            }
          }
          return (
            <span key={wordIdx} className="diff-equal">
              {word.value}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="side-by-side-container">
      <div className="side-by-side-header">
        <div className="side-header">
          <h3>Original (version1.rtf)</h3>
        </div>
        <div className="side-header">
          <h3>Edited (version2.rtf)</h3>
        </div>
      </div>
      <div className="side-by-side-content">
        <div className="side-panel old-panel">
          {oldLines.map((line, idx) => {
            const change = changes[idx] || { type: 'equal' as const, oldIndex: idx, newIndex: idx };
            const isCollapsed = collapsedSections.has(idx);
            
            if (isCollapsed && change.type === 'equal') {
              return null; // Hide collapsed equal lines
            }
            
            return (
              <div key={`old-${idx}`} className="line-container">
                <span className="line-number" title={`Line ${change.oldLineNumber || idx + 1}`}>
                  {change.oldLineNumber || (change.type === 'added' ? '' : idx + 1)}
                </span>
                {renderLine(line, 'old', idx, change.type, change.oldLineNumber)}
              </div>
            );
          })}
        </div>
        <div className="side-panel new-panel">
          {newLines.map((line, idx) => {
            const change = changes[idx] || { type: 'equal' as const, oldIndex: idx, newIndex: idx };
            const isCollapsed = collapsedSections.has(idx);
            
            if (isCollapsed && change.type === 'equal') {
              return null; // Hide collapsed equal lines
            }
            
            return (
              <div key={`new-${idx}`} className="line-container">
                <span className="line-number" title={`Line ${change.newLineNumber || idx + 1}`}>
                  {change.newLineNumber || (change.type === 'removed' ? '' : idx + 1)}
                </span>
                {renderLine(line, 'new', idx, change.type, change.newLineNumber)}
              </div>
            );
          })}
        </div>
      </div>
      <style jsx>{`
        .side-by-side-container {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
        }

        .side-by-side-header {
          display: flex;
          border-bottom: 2px solid #ddd;
          background-color: #fff;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .side-header {
          flex: 1;
          padding: 12px 16px;
          background-color: #f8f9fa;
          border-right: 1px solid #ddd;
        }

        .side-header:last-child {
          border-right: none;
        }

        .side-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }

        .side-by-side-content {
          display: flex;
          flex: 1;
          overflow: auto;
        }

        .side-panel {
          flex: 1;
          border-right: 1px solid #ddd;
          overflow-y: auto;
          background-color: #fff;
        }

        .side-panel:last-child {
          border-right: none;
        }

        .line-container {
          display: flex;
          min-height: 24px;
          border-bottom: 1px solid #f0f0f0;
        }

        .line-number {
          display: inline-block;
          min-width: 50px;
          padding: 4px 8px;
          text-align: right;
          color: #999;
          background-color: #f8f9fa;
          border-right: 1px solid #e0e0e0;
          font-size: 12px;
          user-select: none;
        }

        .line {
          flex: 1;
          padding: 4px 8px;
          white-space: pre-wrap;
          word-wrap: break-word;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          line-height: 1.6;
        }

        .line-empty {
          flex: 1;
          padding: 4px 8px;
          background-color: #f5f5f5;
        }

        .line-ellipsis {
          flex: 1;
          padding: 12px 8px;
          text-align: center;
          background-color: #f8f9fa;
          border-top: 1px solid #e0e0e0;
          border-bottom: 1px solid #e0e0e0;
          cursor: pointer;
          user-select: none;
          transition: background-color 0.2s;
        }

        .line-ellipsis:hover {
          background-color: #e9ecef;
        }

        .ellipsis-text {
          font-size: 24px;
          color: #999;
          display: block;
          margin-bottom: 4px;
        }

        .ellipsis-hint {
          font-size: 12px;
          color: #666;
        }
      `}</style>
    </div>
  );
}

