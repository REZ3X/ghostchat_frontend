const getBlockedWords = () => {
  const blockedWordsEnv = process.env.NEXT_PUBLIC_BLOCKED_WORDS || '';
  return blockedWordsEnv
    .split(',')
    .map(word => word.trim().toLowerCase())
    .filter(word => word.length > 0);
};

const getFilterMode = () => {
  return process.env.NEXT_PUBLIC_FILTER_MODE || 'replace';
};

const createReplacement = (word) => {
  if (word.length <= 1) return '*';
  return word[0] + '*'.repeat(word.length - 2) + word[word.length - 1];
};

export const containsBlockedWords = (message) => {
  const blockedWords = getBlockedWords();
  const lowerMessage = message.toLowerCase();
  
  return blockedWords.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lowerMessage);
  });
};

export const getBlockedWordsInMessage = (message) => {
  const blockedWords = getBlockedWords();
  const lowerMessage = message.toLowerCase();
  const foundWords = [];
  
  blockedWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(lowerMessage)) {
      foundWords.push(word);
    }
  });
  
  return foundWords;
};

export const filterMessage = (message) => {
  const blockedWords = getBlockedWords();
  const filterMode = getFilterMode();
  
  if (blockedWords.length === 0) {
    return { filtered: message, blocked: false, words: [] };
  }
  
  const foundWords = getBlockedWordsInMessage(message);
  
  if (foundWords.length === 0) {
    return { filtered: message, blocked: false, words: [] };
  }
  
  switch (filterMode) {
    case 'block':
      return { 
        filtered: message, 
        blocked: true, 
        words: foundWords,
        reason: 'Message contains inappropriate language and cannot be sent.'
      };
      
    case 'warn':
      return { 
        filtered: message, 
        blocked: false, 
        words: foundWords,
        warning: 'Your message contains words that might be considered inappropriate.'
      };
      
    case 'replace':
    default:
      let filteredMessage = message;
      
      blockedWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        filteredMessage = filteredMessage.replace(regex, (match) => {
          return createReplacement(match);
        });
      });
      
      return { 
        filtered: filteredMessage, 
        blocked: false, 
        words: foundWords.length > 0 ? foundWords : []
      };
  }
};

export const validateFilterConfig = () => {
  const blockedWords = getBlockedWords();
  const filterMode = getFilterMode();
  
  const validModes = ['replace', 'block', 'warn'];
  
  return {
    isValid: validModes.includes(filterMode),
    blockedWordsCount: blockedWords.length,
    filterMode,
    blockedWords: blockedWords.slice(0, 5)}
};