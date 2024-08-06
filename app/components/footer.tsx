import { Link } from "@remix-run/react";
import { Logo } from "./ui/logo";

export const Footer = () => {
  return (
    <Link to="/" target="_blank" className="flex items-center gap-1 mt-6 text-sm cursor-pointer">
        <span>by </span>
      <Logo className="h-5 w-5 flex-shrink-0 inline-flex" aria-label="Logo" />
      <span>Interledger</span>
      <span className="text-green-1 font-medium">Pay</span>
    </Link>
  );
};
Footer.displayName = "Footer";
