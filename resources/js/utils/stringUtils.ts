/**
 * Utility functions for string processing and searching
 */

/**
 * Normalizes text by lowercasing, removing diacritics, and cleaning whitespace
 */
export function normalizeText(text: string): string {
  return text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^\w\s]/g, ' ') // Replace special chars with space
    .replace(/\s+/g, ' ') // Multiple spaces to single
    .trim();
}

/**
 * Calculates the Levenshtein distance between two strings
 * Used for fuzzy matching and typo tolerance
 */
export function calculateLevenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i += 1) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j += 1) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Calculates similarity score between two strings (0-1 range)
 * 1.0 means identical, 0.0 means completely different
 */
export function getSimilarityScore(text: string, query: string): number {
  const maxLen = Math.max(text.length, query.length);
  if (maxLen === 0) return 1.0;
  const distance = calculateLevenshteinDistance(text, query);
  return 1.0 - distance / maxLen;
}
