const PROFANITY_LIST = [
  'ass',
  'asshole',
  'bastard',
  'bitch',
  'bollocks',
  'bullshit',
  'cock',
  'cocksucker',
  'coon',
  'crap',
  'cunt',
  'damn',
  'dick',
  'dickhead',
  'dyke',
  'fag',
  'faggot',
  'fuck',
  'fucker',
  'fucking',
  'goddamn',
  'homo',
  'jerkoff',
  'kike',
  'motherfucker',
  'nigga',
  'nigger',
  'piss',
  'prick',
  'pussy',
  'retard',
  'retarded',
  'shit',
  'shithead',
  'slut',
  'spic',
  'twat',
  'wanker',
  'whore',
  'wtf',
];

const PROFANITY_REGEX = new RegExp(
  `\\b(${PROFANITY_LIST.join('|')})\\b`,
  'gi',
);

export interface FilterResult {
  isClean: boolean;
  matchedWords: string[];
}

export function filterMessage(content: string): FilterResult {
  const matchedWords: string[] = [];

  content.replace(PROFANITY_REGEX, (match) => {
    matchedWords.push(match.toLowerCase());
    return match;
  });

  return {
    isClean: matchedWords.length === 0,
    matchedWords: [...new Set(matchedWords)],
  };
}
