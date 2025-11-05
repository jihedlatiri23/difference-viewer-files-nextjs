'use client';

import React from 'react';
import { getWordLevelDiff, LineDiff } from '@/lib/diffUtils';

interface InlineViewProps {
  oldText: string;
  newText: string;
}

export default function InlineView({ oldText, newText }: InlineViewProps) {
  const lineDiffs = getWordLevelDiff(oldText, newText);

  const renderWord = (word: { value: string; added?: boolean; removed?: boolean }, lineType: string, idx: number) => {
    if (word.added) {
      return (
        <span key={`added-${idx}`} className="diff-added">
          {word.value}
        </span>
      );
    }
    if (word.removed) {
      return (
        <span key={`removed-${idx}`} className="diff-removed">
          {word.value}
        </span>
      );
    }
    return (
      <span key={`equal-${idx}`} className="diff-equal">
        {word.value}
      </span>
    );
  };

  const renderLine = (lineDiff: LineDiff, index: number) => {
    const lineClass = `line-${lineDiff.type}`;

    return (
      <div key={index} className={`inline-line ${lineClass}`}>
        <div className="line-header">
          <span className="line-type-badge">{lineDiff.type.toUpperCase()}</span>
          {lineDiff.type === 'removed' && (
            <span className="line-number">Line {lineDiff.lineNumber}</span>
          )}
          {lineDiff.type === 'added' && (
            <span className="line-number">Line {lineDiff.lineNumber}</span>
          )}
          {lineDiff.type === 'modified' && (
            <span className="line-number">Line {lineDiff.lineNumber}</span>
          )}
        </div>
        <div className="line-content">
          {lineDiff.type === 'removed' && (
            <div className="removed-content">
              {lineDiff.words.map((word, idx) => renderWord(word, 'removed', idx))}
            </div>
          )}
          {lineDiff.type === 'added' && (
            <div className="added-content">
              {lineDiff.words.map((word, idx) => renderWord(word, 'added', idx))}
            </div>
          )}
          {lineDiff.type === 'modified' && (
            <>
              <div className="removed-content">
                {lineDiff.words.map((word, idx) => 
                  word.removed ? renderWord(word, 'removed', idx) : null
                )}
              </div>
              <div className="added-content">
                {lineDiff.words.map((word, idx) => 
                  word.added ? renderWord(word, 'added', idx) : null
                )}
              </div>
            </>
          )}
          {lineDiff.type === 'equal' && (
            <div className="equal-content">
              {lineDiff.words.map((word, idx) => renderWord(word, 'equal', idx))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="inline-container">
      <div className="inline-header">
        <h3>Inline View - Changes Highlighted</h3>
      </div>
      <div className="inline-content">
        {lineDiffs.map((lineDiff, index) => renderLine(lineDiff, index))}
      </div>
      <style jsx>{`
        .inline-container {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
        }

        .inline-header {
          padding: 12px 16px;
          background-color: #f8f9fa;
          border-bottom: 2px solid #ddd;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .inline-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }

        .inline-content {
          flex: 1;
          overflow-y: auto;
          background-color: #fff;
          padding: 16px;
        }

        .inline-line {
          margin-bottom: 16px;
          border-radius: 4px;
          overflow: hidden;
        }

        .line-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 600;
          background-color: #f0f0f0;
        }

        .line-type-badge {
          padding: 2px 8px;
          border-radius: 3px;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .line-number {
          color: #666;
          font-weight: normal;
        }

        .line-content {
          padding: 8px 12px;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          line-height: 1.6;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .removed-content,
        .added-content,
        .equal-content {
          margin: 4px 0;
        }

        .line-removed .line-type-badge {
          background-color: #f8d7da;
          color: #721c24;
        }

        .line-added .line-type-badge {
          background-color: #d4edda;
          color: #155724;
        }

        .line-modified .line-type-badge {
          background-color: #fff3cd;
          color: #856404;
        }

        .line-equal .line-type-badge {
          background-color: #e2e3e5;
          color: #383d41;
        }

        .line-removed .line-header {
          background-color: #ffebee;
        }

        .line-added .line-header {
          background-color: #e8f5e9;
        }

        .line-modified .line-header {
          background-color: #fff3e0;
        }

        .line-equal {
          opacity: 0.6;
        }

        .line-equal .line-content {
          color: #999;
        }
      `}</style>
    </div>
  );
}

