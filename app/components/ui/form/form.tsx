import { type InputHTMLAttributes, useId } from "react";
import { Input } from "./input";
import { Label } from "./label";

type Errors = Array<string | null | undefined> | null | undefined;

export function ErrorList({ id, errors }: { errors?: Errors; id?: string }) {
  const filteredErrors = errors?.filter(Boolean);
  if (!filteredErrors?.length) return null;

  return (
    <ul id={id} className="flex flex-col gap-1">
      {filteredErrors.map((e) => (
        <li key={e} className="text-destructive text-[12px]">
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
}

export const Field = ({ label, errors, className, ...props }: FieldProps) => {
  const fallbackId = useId();
  const id = props.id ?? fallbackId;
  const errorId = errors?.length ? `${id}-error` : undefined;
  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        aria-invalid={errorId ? true : undefined}
        aria-describedby={errorId}
        {...props}
      />
      <div className="min-h-[16px] px-4 pb-3 pt-1">
        {errorId ? <ErrorList id={errorId} errors={errors} /> : null}
      </div>
    </div>
  );
};
