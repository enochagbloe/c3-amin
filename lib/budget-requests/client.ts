export async function budgetApi<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const result = await response.json();
  if (!response.ok || !result.success)
    throw new Error(result.error?.message || "Unable to load budget requests");
  return result.data as T;
}
export const budgetEndpoint = (organizationId: string) =>
  `/api/organizations/${organizationId}/budget-requests`;
