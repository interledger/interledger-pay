export const getCurrencySymbol = (assetCode: string): string => {
  return new Intl.NumberFormat("en-US", {
    currency: assetCode,
    style: "currency",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  })
    .format(0)
    .replace(/0/g, "")
    .trim();
};
