export const removeItem = <T,>(arr: T[], index: number): T[] => arr.filter((_, i) => i !== index);
