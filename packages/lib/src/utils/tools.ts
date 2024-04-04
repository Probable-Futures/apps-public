/**
 * Find a value inside an obj based on a given path of the form obj.key.nestedKey
 */
const findValueByPath = <T>(path: string, obj: T): string => {
  return path.split(".").reduce((prev: any, cur: string) => (prev ? prev[cur] : null), obj);
};

/**
 * Receives an array and a field
 * Returns an object with all elements of the array "data" being grouped by "field"
 */
export const groupByfield = <T>(
  data: Array<T>,
  field: string,
): { [key: string]: { label: string; options: Array<T> } } =>
  data.reduce((grouped: { [key: string]: { label: string; options: Array<T> } }, element: T) => {
    const key = findValueByPath<T>(field, element);
    grouped[key] = grouped[key] || { label: key, options: [] };
    grouped[key]["options"] = [...(grouped[key]["options"] || []), element];
    return grouped;
  }, {});

export const degreeToString = (value: number) => {
  const parsedValue = value.toString().replaceAll(".", ",");

  return parsedValue === "0" ? "0,5" : parsedValue;
};
