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

type FormatDateArgs = {
  date: string;
  time?: boolean;
  month?: Intl.DateTimeFormatOptions["month"];
};
export const formatDate = ({
  date,
  time = true,
  month = "short",
}: FormatDateArgs): string => {
  return new Date(date).toLocaleDateString("default", {
    day: "2-digit",
    month,
    year: "numeric",
    ...(time && { hour: "2-digit", minute: "2-digit" }),
  });
};
