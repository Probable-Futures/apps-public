export function isDateString(str: string) {
  // Regular expression to check if the string is in ISO 8601 format
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

  if (iso8601Regex.test(str)) {
    const date = new Date(str);
    return !isNaN(date.getTime());
  }

  return false;
}
