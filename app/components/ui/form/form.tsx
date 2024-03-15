import { type InputHTMLAttributes, useId, type ReactNode } from "react";
import { Input } from "./input";
import { Label } from "./label";
import { cx } from "class-variance-authority";

type Errors = Array<string | null | undefined> | null | undefined;

export function ErrorList({ id, errors }: { errors?: Errors; id?: string }) {
  const filteredErrors = errors?.filter(Boolean);
  if (!filteredErrors?.length) return null;

  return (
    <ul id={id} className="flex flex-col gap-1">
      {filteredErrors.map((e) => (
        <li key={e} className="text-destructive text-sm">
          {e}
        </li>
      ))}
    </ul>
  );
}

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  errors?: Errors;
  className?: string;
  variant?: "default" | "info" | "highlight";
  trailing?: ReactNode;
}

export const Field = ({
  label,
  errors,
  className,
  variant,
  trailing,
  ...props
}: FieldProps) => {
  const fallbackId = useId();
  const id = props.id ?? fallbackId;
  const errorId = errors?.length ? `${id}-error` : undefined;

  return (
    <div className={cx(className, "flex flex-col gap-3")}>
      <Label className="pl-2" htmlFor={id}>
        {label}
      </Label>
      <Input
        id={id}
        aria-invalid={errorId ? true : undefined}
        aria-describedby={errorId}
        variant={variant ? variant : "default"}
        trailing={trailing}
        {...props}
      />
      <div className="pb-3">
        {errorId ? <ErrorList id={errorId} errors={errors} /> : null}
      </div>
    </div>
  );
};
