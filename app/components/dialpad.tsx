import { cn } from "~/lib/cn";
import { useDialPadContext } from "~/lib/context/dialpad";
import { Select } from "./ui/form/select";

export const DialPad = () => {
  return (
    <div className="flex flex-col gap-6 text-xl w-2/3">
      <AmountDisplay />
      <div className="w-full flex justify-center items-center">
        <AssetSelect />
      </div>
      <DialPadRow first="1" second="2" third="3" />
      <DialPadRow first="4" second="5" third="6" />
      <DialPadRow first="7" second="8" third="9" />
      <DialPadRow first="." idFirst="dot" second="0" third="<" idThird="back" />
    </div>
  );
};
DialPad.displayName = "Dialpad";

type DialPadRowProps = {
  first: string;
  second: string;
  third: string;
  idFirst?: string;
  idSecond?: string;
  idThird?: string;
};
const DialPadRow = ({
  first,
  second,
  third,
  idFirst,
  idSecond,
  idThird,
}: DialPadRowProps) => {
  return (
    <ul>
      <div className="flex justify-between">
        <DialPadKey label={first} id={idFirst} />
        <DialPadKey label={second} id={idSecond} />
        <DialPadKey label={third} id={idThird} />
      </div>
    </ul>
  );
};
DialPadRow.displayName = "DialPadRow";

type DialPadKeyProps = {
  label: string;
  id?: string;
};
const DialPadKey = ({ label, id }: DialPadKeyProps) => {
  const { amountValue, setAmountValue } = useDialPadContext();
  return (
    <li
      className={cn(
        "cursor-pointer hover:text-green-1",
        id === "dot" ? "pl-1" : ""
      )}
      id={id ? id : `nr-${label}`}
      onClick={() => {
        if (id === "back") {
          setAmountValue(`${amountValue.substring(0, amountValue.length - 1)}`);
        } else if (amountValue === "0" && id !== "dot") {
          setAmountValue(
            `${amountValue.substring(0, amountValue.length - 1)}${label}`
          );
        } else if (
          (id === "dot" && amountValue.indexOf(".") === -1) ||
          id !== "dot"
        ) {
          setAmountValue(`${amountValue}${label}`);
        }
      }}
    >
      {label}
    </li>
  );
};
DialPadKey.displayName = "DialPadKey";

const AssetSelect = () => {
  const assets = [
    { label: "USD", value: "USD" },
    { label: "EUR", value: "EUR" },
    { label: "RON", value: "RON" },
  ];
  return (
    <Select
      options={assets.map((asset) => ({
        value: asset.value,
        label: asset.label,
      }))}
      name="asset"
      defaultValue={{ label: "USD", value: "USD" }}
    />
  );
};
AssetSelect.displayName = "AssetSelect";

const AmountDisplay = () => {
  const { amountValue, assetCode } = useDialPadContext();
  return (
    <div className="w-full whitespace-nowrap flex items-center justify-center text-5xl">
      {assetCode} {amountValue}
    </div>
  );
};
AmountDisplay.displayName = "AmountDisplay";
