export const parseIsoDate = (value: Date | string, field: string): Date => {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error(`Invalid date for ${field}`);
    }
    return value;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date for ${field}`);
  }
  return parsed;
};
