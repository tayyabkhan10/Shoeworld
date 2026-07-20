export function formatPKR(amount: number): string {
  return `Rs. ${Math.round(amount).toLocaleString("en-PK")}`;
}

export const FREE_SHIPPING_THRESHOLD = 28000;
export const SHIPPING_COST = 300;
