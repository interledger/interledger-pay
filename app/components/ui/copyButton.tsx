import { cx } from "class-variance-authority";
import {
  type ButtonHTMLAttributes,
  forwardRef,
  useState,
  useEffect,
} from "react";
import { Button } from "./button";
import { ClipboardCheck, Clipboard } from "../icons";

function copyToClipboard(value: string) {
  navigator.clipboard.writeText(value);
}

export interface CopyButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  size?: string;
  ctaText?: string;
  afterCtaText?: string;
  variant?: "default" | "outline" | "input";
}

export const CopyButton = forwardRef<HTMLButtonElement, CopyButtonProps>(
  ({ value, size, ctaText, afterCtaText, variant, ...props }, ref) => {
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
      setTimeout(() => {
        setIsCopied(false);
      }, 4000);
    }, [isCopied]);

    return (
      <Button
        size="sm"
        variant={variant}
        onClick={() => {
          copyToClipboard(value);
          setIsCopied(true);
        }}
        {...props}
      >
        {" "}
        <div className="flex items-center justify-center">
          <span className="sr-only">Copy</span>
          {isCopied ? (
            <ClipboardCheck
              className={cx("m-0.5", size === "sm" ? "h-5 w-5" : "h-7 w-7")}
            />
          ) : (
            <Clipboard
              className={cx("m-0.5", size === "sm" ? "h-5 w-5" : "h-7 w-7")}
            />
          )}
          {afterCtaText && isCopied ? afterCtaText : ctaText}
        </div>
      </Button>
    );
  }
);
CopyButton.displayName = "CopyButton";
