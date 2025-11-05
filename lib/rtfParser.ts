/**
 * RTF parser to extract plain text from RTF files
 * Handles RTF format where text appears after formatting codes and lines end with backslash
 */
export function parseRTF(rtfContent: string): string {
  let text = rtfContent;

  // Step 1: Decode Unicode escapes first (before other processing)
  // Handle \uc0\uXXXX sequences - these are often emoji pairs, handle them specially
  text = text.replace(/\\uc0\\u(\d+)\s*\\u(\d+)\s*/g, (match, code1, code2) => {
    try {
      const charCode1 = parseInt(code1, 10);
      const charCode2 = parseInt(code2, 10);
      // Try to create a surrogate pair for emojis
      if (charCode1 >= 0xD800 && charCode1 <= 0xDBFF && charCode2 >= 0xDC00 && charCode2 <= 0xDFFF) {
        // Valid surrogate pair
        const codePoint = 0x10000 + ((charCode1 - 0xD800) << 10) + (charCode2 - 0xDC00);
        return String.fromCodePoint ? String.fromCodePoint(codePoint) : '';
      }
      // Not a valid pair, skip
      return '';
    } catch {
      return '';
    }
  });
  
  // Handle remaining \uc0\uXXXX (single code)
  text = text.replace(/\\uc0\\u(\d+)\s*/g, (match, code) => {
    try {
      const charCode = parseInt(code, 10);
      // Skip surrogate pairs (they should have been handled above)
      if (charCode >= 0xD800 && charCode <= 0xDFFF) {
        return '';
      }
      if (charCode > 0xFFFF) {
        return '';
      }
      return String.fromCharCode(charCode);
    } catch {
      return '';
    }
  });

  // Handle standalone \uXXXX sequences
  text = text.replace(/\\u(\d+)\s*/g, (match, code) => {
    try {
      const charCode = parseInt(code, 10);
      // Skip surrogate pairs
      if (charCode >= 0xD800 && charCode <= 0xDFFF) {
        return '';
      }
      if (charCode > 0xFFFF) {
        return '';
      }
      return String.fromCharCode(charCode);
    } catch {
      return '';
    }
  });

  // Step 2: Extract text content
  // Strategy: Find content after \cf0 and then extract all text segments ending with \
  const lines: string[] = [];
  
  // Find the start of content (after \cf0)
  const cf0Index = text.indexOf('\\cf0');
  if (cf0Index === -1) {
    // No \cf0 found, try extracting from the whole file
    return extractTextFromRTF(text);
  }
  
  // Extract content from \cf0 onwards
  let contentSection = text.substring(cf0Index);
  
  // Remove the initial \cf0 marker
  contentSection = contentSection.replace(/\\cf0\s+/, '');
  
  // Split by backslash at end of line (indicates line break)
  // Pattern: text ending with \ (not followed by another letter)
  const linePattern = /([^\\{}]+?)\\$/gm;
  let match;
  
  while ((match = linePattern.exec(contentSection)) !== null) {
    let line = match[1];
    
    // Remove control groups (content in braces)
    line = line.replace(/\{[^}]*\}/g, ' ');
    
    // Remove RTF control words (like \f0, \fs24, \cf0, \pard, etc.)
    line = line.replace(/\\[a-z]+\d*\s*/gi, ' ');
    
    // Remove braces
    line = line.replace(/[{}]/g, ' ');
    
    // Remove hex character codes
    line = line.replace(/\\'[0-9a-f]{2}/gi, ' ');
    
    // Clean up whitespace
    line = line.replace(/\s+/g, ' ').trim();
    
    // Filter out metadata and very short lines
    if (line.length > 3 && line.match(/[a-zA-Z]/)) {
      const isMetadata = /^(rtf|ansi|ansicpg|cocoartf|cocoatextscaling|cocoaplatform|fonttbl|colortbl|expandedcolortbl|paperw|paperh|margl|margr|vieww|viewh|viewkind|pard|tx|pardirnatural|partightenfactor|f0|fs24|cf0)$/i.test(line);
      
      if (!isMetadata) {
        lines.push(line);
      }
    }
  }

  // If we still don't have enough lines, try extracting from the whole file
  if (lines.length < 5) {
    return extractTextFromRTF(text);
  }

  // Filter and deduplicate lines
  const filteredLines = lines.filter((line, index, self) => {
    return line.length > 5 && 
           !/^[\d\s]+$/.test(line) && // Not just numbers and spaces
           line.match(/[a-zA-Z]/) && // Contains at least one letter
           self.indexOf(line) === index; // Remove duplicates
  });

  const result = filteredLines.length > 0 ? filteredLines.join('\n') : lines.join('\n');
  return result.trim();
}

/**
 * Fallback method to extract text from RTF
 */
function extractTextFromRTF(text: string): string {
  const lines: string[] = [];
  
  // Extract all text segments ending with backslash
  const linePattern = /([^\\{}]+?)\\$/gm;
  let match;
  
  while ((match = linePattern.exec(text)) !== null) {
    let line = match[1];
    
    // Remove control groups
    line = line.replace(/\{[^}]*\}/g, ' ');
    
    // Remove RTF control words
    line = line.replace(/\\[a-z]+\d*\s*/gi, ' ');
    
    // Remove braces
    line = line.replace(/[{}]/g, ' ');
    
    // Remove hex codes
    line = line.replace(/\\'[0-9a-f]{2}/gi, ' ');
    
    // Clean up
    line = line.replace(/\s+/g, ' ').trim();
    
    // Filter
    if (line.length > 5 && line.match(/[a-zA-Z]/)) {
      const isMetadata = /^(rtf|ansi|ansicpg|cocoartf|cocoatextscaling|cocoaplatform|fonttbl|colortbl|expandedcolortbl|paperw|paperh|margl|margr|vieww|viewh|viewkind|pard|tx|pardirnatural|partightenfactor|f0|fs24|cf0)$/i.test(line);
      
      if (!isMetadata) {
        lines.push(line);
      }
    }
  }
  
  // Also try extracting readable text sequences
  const textMatches = text.match(/[a-zA-Z0-9\s.,;:!?'"()-]{15,}/g);
  if (textMatches && textMatches.length > lines.length) {
    const fallback = textMatches
      .map(m => m.trim())
      .filter(m => m.length > 10 && m.match(/[a-zA-Z]{3,}/))
      .slice(0, 100)
      .join('\n');
    if (fallback.length > 50) {
      return fallback;
    }
  }
  
  return lines.join('\n').trim() || text.substring(0, 500);
}

/**
 * Extract plain text lines from RTF content
 */
export function parseRTFToLines(rtfContent: string): string[] {
  const text = parseRTF(rtfContent);
  return text.split('\n').filter(line => line.trim().length > 0);
}
