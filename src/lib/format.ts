/** Format ZAR with R prefix. Prototype prices stay editable seed values. */
export function formatZar(amount: number): string {
  if (Number.isInteger(amount)) {
    return `R${amount}`;
  }
  return `R${amount.toFixed(2)}`;
}
