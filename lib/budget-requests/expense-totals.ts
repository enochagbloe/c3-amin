export function expenseTotals(expenses: { amount: string | number; currency?: string }[]) {
  const groups = new Map<string, number>();
  for (const expense of expenses) { const currency = expense.currency || "USD"; groups.set(currency, (groups.get(currency) ?? 0) + Number(expense.amount)); }
  return [...groups].sort(([a], [b]) => a.localeCompare(b)).map(([currency, amount]) => new Intl.NumberFormat("en", { style: "currency", currency }).format(amount)).join(" · ") || "No expenses";
}
