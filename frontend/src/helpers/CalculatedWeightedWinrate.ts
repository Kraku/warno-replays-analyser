export const calculateWeightedWinRate = (victories: number, games: number) => {
    if (games === 0) {
        return 0;
    }
    return (victories / games) * (1 - Math.exp(-games / 5));
};