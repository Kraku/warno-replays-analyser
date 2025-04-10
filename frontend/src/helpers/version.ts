export const parseVersion = (version: string): number[] =>
  version
    .replace('v', '')
    .split('.')
    .map((num) => parseInt(num, 10));

export const versionOutdated = (currentVersion: string, latestVersion: string): boolean => {
  const [currentMajor, currentMinor, currentPatch] = parseVersion(currentVersion);
  const [latestMajor, latestMinor, latestPatch] = parseVersion(latestVersion);

  return (
    currentMajor < latestMajor ||
    (currentMajor === latestMajor && currentMinor < latestMinor) ||
    (currentMajor === latestMajor && currentMinor === latestMinor && currentPatch < latestPatch)
  );
};
