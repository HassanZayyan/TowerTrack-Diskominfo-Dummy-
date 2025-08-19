import { useMemo } from 'react';
import { normalizeText, getSimilarityScore } from '@/utils/stringUtils';

/**
 * Custom hook for advanced tower filtering with fuzzy search
 * @param towers All available towers
 * @param searchTerm The search query entered by user
 * @returns Filtered towers based on relevance
 */
export function useTowerFilter(towers: Array<{
  id: number;
  site_name: string;
  alamat_menara?: string;
  latitude?: number;
  longitude?: number;
  [key: string]: any;
}>, searchTerm: string) {
  return useMemo(() => {
    const query = searchTerm.trim();
    if (!query || query.length === 0) return [];

    const normalizedQuery = normalizeText(query);
    const queryWords = normalizedQuery.split(/\s+/).filter(word => word.length > 0);

    const results: Array<{ 
      tower: typeof towers[0], 
      score: number, 
      matchType: string,
      matchedText: string 
    }> = [];

    for (const tower of towers) {
      const siteName = tower.site_name || '';
      const address = tower.alamat_menara || '';
      const normalizedSiteName = normalizeText(siteName);
      const normalizedAddress = normalizeText(address);
      const combinedText = `${normalizedSiteName} ${normalizedAddress}`;
      
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
          let bestMatchedWord = '';
          
          for (const textWord of allWords) {
            if (textWord === queryWord) {
              bestWordMatch = 1000; // Exact word match
              bestMatchedWord = textWord;
            } else if (textWord.startsWith(queryWord)) {
              const currentScore = 800 + (queryWord.length / textWord.length) * 200;
              if (currentScore > bestWordMatch) {
                bestWordMatch = currentScore;
                bestMatchedWord = textWord;
              }
            } else if (textWord.includes(queryWord) && queryWord.length >= 2) {
              const currentScore = 600 + (queryWord.length / textWord.length) * 100;
              if (currentScore > bestWordMatch) {
                bestWordMatch = currentScore;
                bestMatchedWord = textWord;
              }
            } else if (queryWord.length >= 3) {
              // Fuzzy matching untuk typo tolerance
              const similarity = getSimilarityScore(textWord, queryWord);
              if (similarity > 0.7) {
                const currentScore = 400 * similarity;
                if (currentScore > bestWordMatch) {
                  bestWordMatch = currentScore;
                  bestMatchedWord = textWord;
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
  }, [searchTerm, towers]);
}

/**
 * Hook to filter towers that have valid coordinates
 * @param towers All available towers
 * @returns Only towers with valid coordinates
 */
export function useTowersWithCoordinates(towers: Array<{
  latitude?: number;
  longitude?: number;
  [key: string]: any;
}>) {
  return useMemo(() => {
    return towers.filter(tower => 
      tower.latitude && 
      tower.longitude && 
      !isNaN(Number(tower.latitude)) && 
      !isNaN(Number(tower.longitude))
    );
  }, [towers]);
}
