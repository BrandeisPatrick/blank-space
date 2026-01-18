/**
 * File Formatters
 * Convert uploaded files to API-specific formats
 */

/**
 * Format files for Gemini API (inlineData format)
 * @param {Array} files - Array of {base64, mimeType} objects
 * @returns {Array|null} Formatted file parts or null if no files
 */
export function formatFilesForGemini(files) {
  if (!files || files.length === 0) return null;

  return files.map(file => ({
    inlineData: {
      mimeType: file.mimeType,
      data: file.base64
    }
  }));
}

/**
 * Format files for OpenAI API (content array format)
 * @param {string} textContent - Text message to include
 * @param {Array} files - Array of {base64, mimeType, filename?, path?} objects
 * @returns {Array} Content array with text and file parts
 */
export function formatFilesForOpenAI(textContent, files) {
  const content = [{ type: 'text', text: textContent }];

  if (!files || files.length === 0) return content;

  files.forEach(file => {
    if (file.mimeType.startsWith('image/')) {
      content.push({
        type: 'image_url',
        image_url: {
          url: `data:${file.mimeType};base64,${file.base64}`
        }
      });
    } else {
      content.push({
        type: 'file',
        file: {
          filename: file.filename || file.path || 'document',
          file_data: `data:${file.mimeType};base64,${file.base64}`
        }
      });
    }
  });

  return content;
}

/**
 * Analyze file types in a file array
 * @param {Array} files - Array of file objects with mimeType
 * @returns {Object} Analysis result with flags and types
 */
export function analyzeFileTypes(files) {
  if (!files || files.length === 0) {
    return { hasFiles: false, hasImages: false, hasDocs: false, types: [] };
  }

  const types = [...new Set(files.map(f => f.mimeType.split('/')[0]))];
  const hasImages = types.includes('image');
  const hasDocs = files.some(f =>
    f.mimeType === 'application/pdf' ||
    f.mimeType.includes('document') ||
    f.mimeType.includes('text')
  );

  return { hasFiles: true, hasImages, hasDocs, types };
}

/**
 * Get action text based on file types
 * @param {Object} analysis - Result from analyzeFileTypes
 * @returns {string} Action text for UI
 */
export function getFileActionText(analysis) {
  const { hasFiles, hasImages, hasDocs } = analysis;

  if (!hasFiles) return 'Searching and thinking...';
  if (hasImages && hasDocs) return 'Analyzing files...';
  if (hasImages) return 'Analyzing image...';
  if (hasDocs) return 'Reading document...';
  return 'Processing files...';
}

export default {
  formatFilesForGemini,
  formatFilesForOpenAI,
  analyzeFileTypes,
  getFileActionText
};
