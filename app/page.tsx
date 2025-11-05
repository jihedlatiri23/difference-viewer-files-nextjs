'use client';

import React, { useState, useEffect } from 'react';
import { parseRTF } from '@/lib/rtfParser';
import { getAlignedLines } from '@/lib/diffUtils';
import SideBySideView from '@/components/SideBySideView';
import InlineView from '@/components/InlineView';

export default function Home() {
  const [viewMode, setViewMode] = useState<'side-by-side' | 'inline'>('side-by-side');
  const [oldText, setOldText] = useState<string>('');
  const [newText, setNewText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load the RTF files
    const loadFiles = async () => {
      try {
        setLoading(true);
        
        // Fetch the RTF files
        const [oldResponse, newResponse] = await Promise.all([
          fetch('/version1.rtf'),
          fetch('/version2.rtf'),
        ]);

        if (!oldResponse.ok || !newResponse.ok) {
          throw new Error('Failed to load files');
        }

        const [oldRtf, newRtf] = await Promise.all([
          oldResponse.text(),
          newResponse.text(),
        ]);

        // Parse RTF to plain text
        const oldParsed = parseRTF(oldRtf);
        const newParsed = parseRTF(newRtf);

        // Validate parsed text
        if (!oldParsed || oldParsed.trim().length === 0) {
          throw new Error('Failed to parse version1.rtf - no text content found');
        }
        if (!newParsed || newParsed.trim().length === 0) {
          throw new Error('Failed to parse version2.rtf - no text content found');
        }

        setOldText(oldParsed);
        setNewText(newParsed);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load files';
        setError(errorMessage);
        console.error('Error loading files:', err);
        console.error('Error details:', {
          message: errorMessage,
          stack: err instanceof Error ? err.stack : undefined
        });
      } finally {
        setLoading(false);
      }
    };

    loadFiles();
  }, []);

  const handleFileUpload = async (file: File, type: 'old' | 'new') => {
    try {
      const text = await file.text();
      
      // Check if it's RTF (starts with RTF header) or plain text
      let parsed: string;
      if (text.trim().startsWith('{\\rtf')) {
        parsed = parseRTF(text);
      } else {
        // Plain text file - use as is
        parsed = text;
      }
      
      if (type === 'old') {
        setOldText(parsed);
      } else {
        setNewText(parsed);
      }
    } catch (err) {
      console.error('Error parsing file:', err);
      alert('Failed to parse file. Please ensure it is a valid RTF or text file.');
    }
  };

  if (loading) {
    return (
      <div 
        className="loading-container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          width: '100vw',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          position: 'relative',
          overflow: 'hidden',
          margin: 0,
          padding: 0
        }}
      >
        <div className="loading-wrapper">
          <div className="loading-spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
          <div className="loading-content">
            <h2>Loading Files</h2>
            <p>Preparing your diff view...</p>
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
        <style jsx>{`
          .loading-container {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            height: 100vh !important;
            width: 100vw !important;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            position: relative !important;
            overflow: hidden !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .loading-container::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
            background-size: 50px 50px;
            animation: drift 20s linear infinite;
          }

          @keyframes drift {
            0% { transform: translate(0, 0); }
            100% { transform: translate(50px, 50px); }
          }

          .loading-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 32px;
            z-index: 1;
            position: relative;
          }

          .loading-spinner {
            position: relative;
            width: 80px;
            height: 80px;
          }

          .spinner-ring {
            position: absolute;
            width: 100%;
            height: 100%;
            border: 4px solid transparent;
            border-top-color: #fff;
            border-radius: 50%;
            animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
          }

          .spinner-ring:nth-child(1) {
            animation-delay: -0.45s;
            border-top-color: #fff;
            opacity: 1;
          }

          .spinner-ring:nth-child(2) {
            animation-delay: -0.3s;
            border-top-color: rgba(255, 255, 255, 0.8);
            width: 80%;
            height: 80%;
            top: 10%;
            left: 10%;
          }

          .spinner-ring:nth-child(3) {
            animation-delay: -0.15s;
            border-top-color: rgba(255, 255, 255, 0.6);
            width: 60%;
            height: 60%;
            top: 20%;
            left: 20%;
          }

          .spinner-ring:nth-child(4) {
            border-top-color: rgba(255, 255, 255, 0.4);
            width: 40%;
            height: 40%;
            top: 30%;
            left: 30%;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .loading-content {
            text-align: center;
            color: #fff;
          }

          .loading-content h2 {
            font-size: 28px;
            font-weight: 600;
            margin: 0 0 8px 0;
            color: #fff;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }

          .loading-content p {
            font-size: 16px;
            color: rgba(255, 255, 255, 0.9);
            margin: 0 0 16px 0;
          }

          .loading-dots {
            display: flex;
            justify-content: center;
            gap: 8px;
            margin-top: 16px;
          }

          .loading-dots span {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #fff;
            animation: bounce 1.4s ease-in-out infinite both;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }

          .loading-dots span:nth-child(1) {
            animation-delay: -0.32s;
          }

          .loading-dots span:nth-child(2) {
            animation-delay: -0.16s;
          }

          .loading-dots span:nth-child(3) {
            animation-delay: 0;
          }

          @keyframes bounce {
            0%, 80%, 100% {
              transform: scale(0.8);
              opacity: 0.5;
            }
            40% {
              transform: scale(1.2);
              opacity: 1;
            }
          }
        `}</style>
        <style jsx global>{`
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <style jsx>{`
          .error-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            gap: 16px;
            padding: 32px;
          }

          h2 {
            color: #d32f2f;
          }

          p {
            color: #666;
          }
        `}</style>
      </div>
    );
  }

  // Only compute diff if we have valid text
  if (!oldText || !newText || oldText.trim().length === 0 || newText.trim().length === 0) {
    return (
      <div className="error-container">
        <h2>No Content</h2>
        <p>Failed to load or parse file content. Please try uploading files manually.</p>
        <style jsx>{`
          .error-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            gap: 16px;
            padding: 32px;
          }

          h2 {
            color: #d32f2f;
          }

          p {
            color: #666;
          }
        `}</style>
      </div>
    );
  }

  const alignedData = getAlignedLines(oldText, newText);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1>Diff Viewer</h1>
          <div className="header-controls">
            <div className="view-toggle">
              <button
                className={viewMode === 'side-by-side' ? 'active' : ''}
                onClick={() => setViewMode('side-by-side')}
              >
                Side-by-Side
              </button>
              <button
                className={viewMode === 'inline' ? 'active' : ''}
                onClick={() => setViewMode('inline')}
              >
                Inline
              </button>
            </div>
            <div className="file-upload">
              <label htmlFor="old-file" className="upload-label">
                Upload Original
                <input
                  id="old-file"
                  type="file"
                  accept=".rtf,.txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'old');
                  }}
                  style={{ display: 'none' }}
                />
              </label>
              <label htmlFor="new-file" className="upload-label">
                Upload Edited
                <input
                  id="new-file"
                  type="file"
                  accept=".rtf,.txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'new');
                  }}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>
        </div>
      </header>
      <main className="app-main">
        {viewMode === 'side-by-side' ? (
          <SideBySideView
            oldLines={alignedData.oldLines}
            newLines={alignedData.newLines}
            changes={alignedData.changes}
          />
        ) : (
          <InlineView oldText={oldText} newText={newText} />
        )}
      </main>
      <style jsx>{`
        .app-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          width: 100vw;
        }

        .app-header {
          background-color: #fff;
          border-bottom: 2px solid #ddd;
          padding: 16px 24px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 100%;
        }

        .header-content h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          color: #333;
        }

        .header-controls {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .view-toggle {
          display: flex;
          border: 1px solid #ddd;
          border-radius: 4px;
          overflow: hidden;
        }

        .view-toggle button {
          padding: 8px 16px;
          border: none;
          background-color: #fff;
          color: #666;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .view-toggle button:hover {
          background-color: #f5f5f5;
        }

        .view-toggle button.active {
          background-color: #3498db;
          color: #fff;
        }

        .file-upload {
          display: flex;
          gap: 8px;
        }

        .upload-label {
          padding: 8px 16px;
          background-color: #f8f9fa;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #333;
          transition: all 0.2s;
        }

        .upload-label:hover {
          background-color: #e9ecef;
        }

        .app-main {
          flex: 1;
          overflow: hidden;
        }

        @media (max-width: 768px) {
          .header-content {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
          }

          .header-controls {
            width: 100%;
            flex-direction: column;
            align-items: stretch;
          }

          .view-toggle {
            width: 100%;
          }

          .view-toggle button {
            flex: 1;
          }

          .file-upload {
            width: 100%;
            flex-direction: column;
          }

          .upload-label {
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}

