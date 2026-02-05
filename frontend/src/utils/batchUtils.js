export const normalizeBatch = (batchName) => {
    if (!batchName) return batchName;
    // Check if it matches "Batch X" where X is a letter
    if (batchName.startsWith('Batch ') && /^[A-H]$/.test(batchName.split(' ')[1])) {
        const charCode = batchName.split(' ')[1].charCodeAt(0);
        return `Batch ${charCode - 64}`;
    }
    return batchName;
};

export const denormalizeBatch = (displayBatchName) => {
    if (!displayBatchName) return displayBatchName;
    // Check if it matches "Batch N" where N is a number
    const match = displayBatchName.match(/^Batch (\d+)$/);
    if (match) {
        const num = parseInt(match[1], 10);
        if (num >= 1 && num <= 8) {
            return `Batch ${String.fromCharCode(64 + num)}`; // 1 -> A, 2 -> B
        }
    }
    return displayBatchName;
};
