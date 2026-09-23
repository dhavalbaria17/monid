// Format number as Indian Rupee currency (e.g. ₹ 1,450)
export function formatCurrency(amount: number): string {
  if (isNaN(amount)) return '₹ 0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount).replace('INR', '₹');
}

// Format date into natural Gujarati format
export const GUJARATI_MONTHS = [
  'જાન્યુઆરી',
  'ફેબ્રુઆરી',
  'માર્ચ',
  'એપ્રિલ',
  'મે',
  'જૂન',
  'જુલાઈ',
  'ઓગસ્ટ',
  'સપ્ટેમ્બર',
  'ઓક્ટોબર',
  'નવેમ્બર',
  'ડિસેમ્બર',
];

export const GUJARATI_DAYS = [
  'રવિવાર',
  'સોમવાર',
  'મંગળવાર',
  'બુધવાર',
  'ગુરુવાર',
  'શુક્રવાર',
  'શનિવાર',
];

export function formatGujaratiDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const day = d.getDate();
    const month = GUJARATI_MONTHS[d.getMonth()];
    const year = d.getFullYear();
    const dayName = GUJARATI_DAYS[d.getDay()];
    return `${day} ${month} ${year}, ${dayName}`;
  } catch {
    return dateString;
  }
}

export function formatShortDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const day = d.getDate();
    const month = GUJARATI_MONTHS[d.getMonth()];
    return `${day} ${month}`;
  } catch {
    return dateString;
  }
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Export data to CSV
export function exportToCSV(filename: string, rows: (string | number)[][]) {
  const processRow = (row: (string | number)[]) => {
    let finalVal = '';
    for (let j = 0; j < row.length; j++) {
      let innerValue = row[j] === null || row[j] === undefined ? '' : row[j].toString();
      let result = innerValue.replace(/"/g, '""');
      if (result.search(/("|,|\n)/g) >= 0) {
        result = '"' + result + '"';
      }
      if (j > 0) finalVal += ',';
      finalVal += result;
    }
    return finalVal + '\n';
  };

  let csvFile = '\uFEFF'; // UTF-8 BOM for Gujarati characters in Excel
  for (let i = 0; i < rows.length; i++) {
    csvFile += processRow(rows[i]);
  }

  const blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Export full backup as JSON
export function exportToJSON(filename: string, data: unknown) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
