export const transliterate = (text: string) => {
  const cyrillicToLatinMap: Record<string, string> = {
    а: 'a',
    б: 'b',
    в: 'b',
    г: 'r',
    д: 'a',
    е: 'e',
    ё: 'e',
    ж: 'x',
    з: '3',
    и: 'n',
    й: 'n',
    к: 'k',
    л: 'n',
    м: 'm',
    н: 'h',
    о: 'o',
    п: 'n',
    р: 'p',
    с: 'c',
    т: 't',
    у: 'y',
    ф: 'o',
    х: 'x',
    ц: 'u',
    ч: 'y',
    ш: 'w',
    щ: 'w',
    ы: 'b',
    э: 'e',
    ю: 'o',
    я: 'r'
  };

  return text
    .split('')
    .map((char) => cyrillicToLatinMap[char.toLowerCase()] || char)
    .join('');
};
