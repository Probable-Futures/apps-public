export function cToF(value: number) {
  return Math.floor((value * 9) / 5 + 32);
}

export function convertCToF(values?: number | number[]) {
  if (values === undefined) {
    return values;
  }
  return Array.isArray(values) ? values.map(cToF) : cToF(values);
}

export function mmToin(value: number) {
  return parseFloat((value / 25.4).toFixed(1));
}

export function convertmmToin(values?: number | number[]) {
  if (values === undefined) {
    return values;
  }

  return Array.isArray(values) ? values.map(mmToin) : mmToin(values);
}
