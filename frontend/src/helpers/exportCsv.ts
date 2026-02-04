type Primitive = string | number | boolean | null | undefined;

const escapeCsvCell = (value: Primitive): string => {
  const str = value === null || value === undefined ? '' : String(value);
  const escaped = str.replace(/\r\n|\r|\n/g, ' ').replace(/"/g, '""');
  return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
};

export const toCsv = (rows: Record<string, Primitive>[], columns: string[]): string => {
  const header = columns.map(escapeCsvCell).join(',');
  const lines = rows.map((row) => columns.map((c) => escapeCsvCell(row[c])).join(','));
  return [header, ...lines].join('\n');
};

export const downloadCsv = (filename: string, csv: string) => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  // Give the browser a tick before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 0);
};
