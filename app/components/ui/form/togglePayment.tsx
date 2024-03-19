import { Switch } from "@headlessui/react";
import { cx } from "class-variance-authority";
import { useState, useEffect } from "react";

const PAYMENT_RECEIVE = "receive";
const PAYMENT_SEND = "send";

const TYPES = {
  send: { text: "text-destructive", bg: "bg-destructive" },
  receive: { text: "text-green-1", bg: "bg-green-1" },
} as const;

type ToggleTypes = keyof typeof TYPES;

type ToggleProps = {
  type: ToggleTypes;
  disabled?: boolean;
  onChange?: (value: boolean) => void;
};

export const TogglePayment = ({
  type,
  disabled = false,
  onChange,
}: ToggleProps) => {
  const value = type !== PAYMENT_SEND;
  const [enabled, setEnabled] = useState(value);

  useEffect(() => {
    setEnabled(value);
  }, [value]);

  const handleOnChange = () => {
    if (!disabled) {
      setEnabled(!enabled);
      onChange && onChange(!enabled);
    }
  };

  return (
    <Switch.Group>
      <div className="flex gap-2 mb-4">
        <Switch.Label className="pr-1 pl-2 text-sm font-lightcursor-pointer text-destructive">
          {PAYMENT_SEND}
        </Switch.Label>
        <Switch
          id="sendReceive"
          checked={enabled || disabled}
          onChange={handleOnChange}
          className={cx(
            "relative inline-flex h-5 w-10 items-center rounded-full outline-none",
            TYPES[type].bg
          )}
        >
          <span
            className={cx(
              "inline-block h-4 w-4 transform rounded-full bg-white transition",
              enabled || disabled ? "translate-x-5" : "translate-x-1"
            )}
          />
        </Switch>
        <Switch.Label className="pl-1 text-sm font-light cursor-pointer text-green-1">
          {PAYMENT_RECEIVE}
        </Switch.Label>
      </div>
    </Switch.Group>
  );
};
