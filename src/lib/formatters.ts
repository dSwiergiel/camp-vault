const compactNumberFormat = new Intl.NumberFormat(undefined, {
  notation: "compact",
});

// formats a number to a compact number
export function formatCompactNumber(number: number) {
  return compactNumberFormat.format(number);
}
