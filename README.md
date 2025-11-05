# Diff Viewer - Next.js File Comparison Tool

A Next.js application that displays differences between two text files (RTF supported) with side-by-side and inline viewing modes, featuring word-level diff highlighting.

## Features

### Core Features
- **Side-by-Side View**: Original file on the left, edited file on the right with corresponding lines aligned
- **Inline View**: Differences shown within a single text flow with insertions, deletions, and modifications highlighted
- **Word-Level Diffing**: Individual word changes within lines are highlighted, not just entire lines
- **File Upload Support**: Upload your own RTF or text files to compare dynamically
- **Distinct Styling**: Different colors for additions (green), deletions (red), and modifications (yellow/orange)

### Additional Enhancements
- File upload support for both original and edited files
- Responsive design that works on mobile and desktop
- Clean, modern UI with clear visual indicators

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

The application will automatically load `version1.rtf` and `version2.rtf` from the `public` directory for comparison.

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main page component
│   └── globals.css         # Global styles
├── components/
│   ├── SideBySideView.tsx  # Side-by-side diff view
│   └── InlineView.tsx      # Inline diff view
├── lib/
│   ├── rtfParser.ts        # RTF file parsing utility
│   └── diffUtils.ts        # Diff algorithm utilities
└── public/
    ├── version1.rtf        # Original file
    └── version2.rtf        # Edited file
```

## How It Works

1. **RTF Parsing**: The application parses RTF files to extract plain text content, handling Unicode escapes and formatting codes.

2. **Diff Algorithm**: Uses the `diff` library to perform line-level and word-level comparisons between the two files.

3. **View Modes**:
   - **Side-by-Side**: Lines are aligned using the diff algorithm, showing corresponding sections side-by-side
   - **Inline**: Shows all changes in a single flow, with removed content shown first, then added content

4. **Word-Level Highlighting**: Within each line, individual word changes are highlighted using different colors:
   - Green: Added words
   - Red: Removed words (with strikethrough)
   - Default: Unchanged words

## Usage

1. **Default View**: The application loads with the provided test files and displays them in side-by-side mode by default.

2. **Switch Views**: Use the toggle buttons in the header to switch between "Side-by-Side" and "Inline" views.

3. **Upload Files**: Click "Upload Original" or "Upload Edited" to upload your own RTF or text files for comparison.

## Technologies Used

- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- **diff** library for text comparison
- **CSS-in-JS** (styled-jsx) for component styling

## Future Enhancements

Potential future improvements:
- Collapsible unchanged sections for large files
- Search and navigation functionality
- Export diff results as HTML or PDF
- Syntax highlighting for code files
- Support for more file formats (PDF, DOCX, etc.)

## License

This project is created for testing purposes.

