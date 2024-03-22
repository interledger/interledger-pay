import { Switch } from "@headlessui/react";
import { cx } from "class-variance-authority";
import { useState } from "react";

const PAYMENT_RECEIVE = "receive";
const PAYMENT_SEND = "send";

const TYPES = {
  send: { text: "text-destructive", bg: "bg-destructive" },
  receive: { text: "text-green-1", bg: "bg-green-1" },
} as const;

type ToggleProps = {
  onChange?: (value: boolean) => void;
};

export const TogglePayment = ({ onChange }: ToggleProps) => {
  const [enabled, setEnabled] = useState(false);

  const handleOnChange = () => {
    setEnabled(!enabled);
    onChange && onChange(!enabled);
  };

  return (
    <Switch.Group>
      <div className="flex gap-2 mb-4">
        <Switch.Label className="pr-1 pl-2 text-sm font-lightcursor-pointer text-destructive">
          {PAYMENT_SEND}
        </Switch.Label>
        <Switch
          id="sendReceive"
          checked={enabled}
          onChange={handleOnChange}
          className={cx(
            "relative inline-flex h-5 w-10 items-center rounded-full outline-none",
            TYPES[enabled ? "receive" : "send"].bg
          )}
        >
          <span
            className={cx(
              "inline-block h-4 w-4 transform rounded-full bg-white transition",
              enabled ? "translate-x-5" : "translate-x-1"
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
