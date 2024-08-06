import { useEffect } from "react";
import { cn } from "~/lib/cn";
import { useDialPadContext } from "~/lib/context/dialpad";

const presetPadKeyClasses = "cursor-pointer flex flex-wrap content-center justify-center items-center text-lg aspect-square rounded-full border border-gray-300 w-14"; 

type PresetPadKeyProps = {
  label: string;
  currency: string;
  id: string;
};
const PresetPadKey = ({ label, id, currency }: PresetPadKeyProps) => {
  const { amountValue, setAmountValue } = useDialPadContext();

  return (
    <li
      className={cn(
        presetPadKeyClasses,
        "hover:bg-green-2"
      )}
      id={id}
      onClick={() => {
        const formattedNumber = Number(id || 0).toFixed(2);
        setAmountValue(String(formattedNumber));
      }}
    >
      {currency}
      {label}
    </li>
  );
};
PresetPadKey.displayName = "PresetPadKey";

type PresetPadProps = {
  values: string[];
  currency: string;
  onMore: () => void
};
export const PresetPad = ({ values, currency, onMore }: PresetPadProps) => {

  return (
    <ul>
      <div className="flex justify-evenly">
        {values.map((value) => (
          <PresetPadKey
            label={value}
            id={value}
            currency={currency}
            key={value}
          />
        ))}
        <li
          className={cn(
            presetPadKeyClasses,
            "rotate-90 pb-2.5",
            "hover:bg-green-2"
          )}
          onClick={() => onMore()}
        >
          ...
        </li>
      </div>
    </ul>
  );
};
PresetPad.displayName = "PresetPad";
