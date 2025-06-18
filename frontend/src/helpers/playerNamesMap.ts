import { transliterate } from './transliterate';

export class PlayerNamesMap {
  map: Map<string, Map<string, number>>;

  constructor(map?: Map<string, Map<string, number>>) {
    this.map = map ?? new Map();
  }

  getNames(playerId: string): string[] {
    const inner = this.map.get(playerId);
    if (!inner) return [];

    return [...inner.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name);
  }

  getNamesMap(playerId: string): Map<string, number> {
    return this.map.get(playerId) ?? new Map();
  }

  nameMatches(playerId: string, query: string): boolean {
    const normalizedQuery = transliterate(query.toLowerCase());

    return this.getNames(playerId).some((name) =>
      transliterate(name.toLowerCase()).includes(normalizedQuery)
    );
  }

  incrementPlayerNameCount = (playerId: string, usedName: string) => {
    if (this.map.has(playerId)) {
      const nameMap = this.getNamesMap(playerId);

      nameMap.set(usedName, (nameMap.get(usedName) || 0) + 1);
    } else {
      this.map.set(playerId, new Map([[usedName, 1]]));
    }
  };

  getPlayerCommonName = (playerId: string): string => {
    const namesMap = this.getNamesMap(playerId);
    if (namesMap.size === 0) {
      return 'Unknown';
    }

    const sortedNames = [...namesMap.entries()].sort((a, b) => b[1] - a[1]);
    return sortedNames[0][0];
  };
}
