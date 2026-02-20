import { filterMessage } from '../../src/services/wordFilter';

describe('wordFilter', () => {
  describe('filterMessage', () => {
    it('returns clean for normal text', () => {
      const result = filterMessage('My dog loves the park!');
      expect(result.isClean).toBe(true);
      expect(result.matchedWords).toEqual([]);
    });

    it('detects profanity', () => {
      const result = filterMessage('This is damn annoying');
      expect(result.isClean).toBe(false);
      expect(result.matchedWords).toContain('damn');
    });

    it('is case-insensitive', () => {
      const result = filterMessage('DAMN this');
      expect(result.isClean).toBe(false);
      expect(result.matchedWords).toContain('damn');
    });

    it('detects multiple profane words', () => {
      const result = filterMessage('What the hell, this crap is shit');
      expect(result.isClean).toBe(false);
      expect(result.matchedWords.length).toBeGreaterThanOrEqual(2);
    });

    it('deduplicates matched words', () => {
      const result = filterMessage('damn damn damn');
      expect(result.isClean).toBe(false);
      expect(result.matchedWords).toEqual(['damn']);
    });

    it('does not flag partial word matches (word boundary)', () => {
      // "assistant" contains "ass" but should not be flagged
      const result = filterMessage('My assistant helped me');
      expect(result.isClean).toBe(true);
    });

    it('returns clean for empty string', () => {
      const result = filterMessage('');
      expect(result.isClean).toBe(true);
      expect(result.matchedWords).toEqual([]);
    });
  });
});
