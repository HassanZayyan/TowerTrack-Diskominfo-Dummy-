// Utility functions untuk pencarian dan filtering tower yang dapat digunakan bersama

export function normalizeText(text: string): string {
  return text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^\w\s]/g, ' ') // Replace special chars with space
    .replace(/\s+/g, ' ') // Multiple spaces to single
    .trim();
}

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

export function getSimilarityScore(text: string, query: string): number {
  const maxLen = Math.max(text.length, query.length);
  if (maxLen === 0) return 1.0;
  const distance = calculateLevenshteinDistance(text, query);
  return 1.0 - distance / maxLen;
}

// Function to find match positions for highlighting
export function findMatchPositions(text: string, query: string) {
  if (!query.trim()) return [];
  
  const normalizedText = normalizeText(text);
  const normalizedQuery = normalizeText(query);
  const queryWords = normalizedQuery.split(/\s+/).filter(word => word.length > 0);
  
  const matches: Array<{ start: number, end: number, word: string }> = [];
  
  // Find all matches
  queryWords.forEach(queryWord => {
    const textWords = normalizedText.split(/\s+/);
    let currentIndex = 0;
    
    for (const textWord of textWords) {
      const wordStartInOriginal = text.toLowerCase().indexOf(textWord, currentIndex);
      if (wordStartInOriginal === -1) continue;
      
      const wordEndInOriginal = wordStartInOriginal + textWord.length;
      
      // Check for exact, starts with, contains, or fuzzy match
      if (textWord === queryWord || 
          textWord.startsWith(queryWord) || 
          (queryWord.length >= 2 && textWord.includes(queryWord)) ||
          (queryWord.length >= 3 && getSimilarityScore(textWord, queryWord) > 0.7)) {
        
        matches.push({
          start: wordStartInOriginal,
          end: wordEndInOriginal,
          word: queryWord
        });
      }
      
      currentIndex = wordEndInOriginal;
    }
  });
  
  if (matches.length === 0) {
    // Fallback: highlight any substring matches
    queryWords.forEach(queryWord => {
      const escapedWord = queryWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedWord})`, 'gi');
      const match = text.match(regex);
      if (match) {
        const index = text.toLowerCase().indexOf(queryWord);
        if (index !== -1) {
          matches.push({
            start: index,
            end: index + queryWord.length,
            word: queryWord
          });
        }
      }
    });
  }
  
  if (matches.length === 0) return [];
  
  // Sort matches by position and merge overlapping
  matches.sort((a, b) => a.start - b.start);
  const mergedMatches = [];
  let current = matches[0];
  
  for (let i = 1; i < matches.length; i++) {
    if (matches[i].start <= current.end) {
      current.end = Math.max(current.end, matches[i].end);
    } else {
      mergedMatches.push(current);
      current = matches[i];
    }
  }
  mergedMatches.push(current);
  
  return mergedMatches;
}

export interface Tower {
  id: number;
  site_name: string;
  alamat_menara?: string;
}

// Fungsi filtering tower yang akurat dengan fuzzy search
export function filterTowers(towers: Tower[], searchTerm: string) {
  const query = searchTerm.trim();
  if (!query || query.length === 0) return [];

  const normalizedQuery = normalizeText(query);
  const queryWords = normalizedQuery.split(/\s+/).filter(word => word.length > 0);

  const results: Array<{ 
    tower: Tower, 
    score: number, 
    matchType: string,
    matchedText: string 
  }> = [];

  for (const tower of towers) {
    const siteName = tower.site_name || '';
    const address = tower.alamat_menara || '';
    const normalizedSiteName = normalizeText(siteName);
    const normalizedAddress = normalizeText(address);
    
    let score = 0;
    let matchType = '';
    let matchedText = '';
    let matchFound = false;

    // 1. EXACT MATCH (Perfect Score)
    if (normalizedSiteName === normalizedQuery) {
      score = 10000;
      matchType = 'exact_name';
      matchedText = siteName;
      matchFound = true;
    }
    else if (normalizedAddress === normalizedQuery) {
      score = 9000;
      matchType = 'exact_address';
      matchedText = address;
      matchFound = true;
    }
    
    // 2. STARTS WITH (Very High Score)
    else if (normalizedSiteName.startsWith(normalizedQuery)) {
      score = 8000 + (normalizedQuery.length / normalizedSiteName.length) * 1000;
      matchType = 'starts_with_name';
      matchedText = siteName;
      matchFound = true;
    }
    else if (normalizedAddress.startsWith(normalizedQuery)) {
      score = 7000 + (normalizedQuery.length / normalizedAddress.length) * 1000;
      matchType = 'starts_with_address';
      matchedText = address;
      matchFound = true;
    }
    
    // 3. WORD-LEVEL MATCHING
    else if (queryWords.length > 0) {
      const siteWords = normalizedSiteName.split(/\s+/);
      const addressWords = normalizedAddress.split(/\s+/);
      const allWords = [...siteWords, ...addressWords];
      
      let wordMatchScore = 0;
      let matchedWords = 0;
      
      // Check each query word against all text words
      for (const queryWord of queryWords) {
        let bestWordMatch = 0;
        
        for (const textWord of allWords) {
          if (textWord === queryWord) {
            bestWordMatch = 1000; // Exact word match
          } else if (textWord.startsWith(queryWord)) {
            const currentScore = 800 + (queryWord.length / textWord.length) * 200;
            if (currentScore > bestWordMatch) {
              bestWordMatch = currentScore;
            }
          } else if (textWord.includes(queryWord) && queryWord.length >= 2) {
            const currentScore = 600 + (queryWord.length / textWord.length) * 100;
            if (currentScore > bestWordMatch) {
              bestWordMatch = currentScore;
            }
          } else if (queryWord.length >= 3) {
            // Fuzzy matching untuk typo tolerance
            const similarity = getSimilarityScore(textWord, queryWord);
            if (similarity > 0.7) {
              const currentScore = 400 * similarity;
              if (currentScore > bestWordMatch) {
                bestWordMatch = currentScore;
              }
            }
          }
        }
        
        if (bestWordMatch > 0) {
          wordMatchScore += bestWordMatch;
          matchedWords++;
        }
      }
      
      // All words must be found for multi-word queries
      if (queryWords.length === 1 || matchedWords === queryWords.length) {
        score = wordMatchScore;
        matchType = `word_match_${matchedWords}`;
        matchedText = siteName;
        matchFound = true;
      }
    }
    
    // 4. SUBSTRING MATCHING (fallback)
    if (!matchFound && normalizedQuery.length >= 2) {
      if (normalizedSiteName.includes(normalizedQuery)) {
        score = 300 + (normalizedQuery.length / normalizedSiteName.length) * 200;
        matchType = 'substring_name';
        matchedText = siteName;
        matchFound = true;
      }
      else if (normalizedAddress.includes(normalizedQuery)) {
        score = 200 + (normalizedQuery.length / normalizedAddress.length) * 100;
        matchType = 'substring_address';
        matchedText = address;
        matchFound = true;
      }
    }
    
    // 5. FUZZY MATCHING (untuk typo)
    if (!matchFound && normalizedQuery.length >= 3) {
      const nameSimilarity = getSimilarityScore(normalizedSiteName, normalizedQuery);
      const addressSimilarity = getSimilarityScore(normalizedAddress, normalizedQuery);
      
      if (nameSimilarity > 0.6) {
        score = 150 * nameSimilarity;
        matchType = 'fuzzy_name';
        matchedText = siteName;
        matchFound = true;
      } else if (addressSimilarity > 0.6) {
        score = 100 * addressSimilarity;
        matchType = 'fuzzy_address';
        matchedText = address;
        matchFound = true;
      }
    }

    // Boost score untuk hasil yang lebih pendek (lebih relevan)
    if (matchFound) {
      const lengthPenalty = Math.max(0, 1 - (siteName.length / 50));
      score = score + (score * lengthPenalty * 0.1);
      
      results.push({ tower, score, matchType, matchedText });
    }
  }

  // Sort berdasarkan score tertinggi, lalu alphabetically
  results.sort((a, b) => {
    if (Math.abs(a.score - b.score) < 10) {
      return a.tower.site_name.localeCompare(b.tower.site_name);
    }
    return b.score - a.score;
  });
  
  // Return maksimal 15 hasil teratas
  return results.slice(0, 15).map(result => result.tower);
}
