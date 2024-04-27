import { useEffect } from "react";
import { cn } from "~/lib/cn";
import { useDialPadContext } from "~/lib/context/dialpad";
import { getCurrencySymbol } from "~/utils/helpers";

export const DialPad = () => {
  return (
    <div className="flex flex-col gap-10 text-xl w-2/3">
      <AmountDisplay />
      <DialPadRow first="1" second="2" third="3" />
      <DialPadRow first="4" second="5" third="6" />
      <DialPadRow first="7" second="8" third="9" />
      <DialPadRow first="." second="0" third="<" idThird="Backspace" />
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
        <DialPadKey label={first} id={idFirst ? idFirst : first} />
        <DialPadKey label={second} id={idSecond ? idSecond : second} />
        <DialPadKey label={third} id={idThird ? idThird : third} />
      </div>
    </ul>
  );
};
DialPadRow.displayName = "DialPadRow";

type DialPadKeyProps = {
  label: string;
  id: string;
};
const DialPadKey = ({ label, id }: DialPadKeyProps) => {
  const { amountValue, setAmountValue } = useDialPadContext();
  const idsList = [
    "Backspace",
    ".",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
  ];
  useEffect(() => {
    function handleKeyDown(e: any) {
      handleDialPadInputs(e.key);
    }

    document.addEventListener("keydown", handleKeyDown);

    return function cleanup() {
      document.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amountValue]);

  const handleDialPadInputs = (id: string) => {
    const label = id === "Backspace" ? "<" : id;
    if (idsList.indexOf(id) !== -1) {
      if (id === "Backspace") {
        setAmountValue(`${amountValue.substring(0, amountValue.length - 1)}`);
      } else if (amountValue === "0" && id !== ".") {
        setAmountValue(
          `${amountValue.substring(0, amountValue.length - 1)}${label}`
        );
      } else if (
        (id === "." &&
          amountValue.indexOf(".") === -1 &&
          amountValue.length !== 0) ||
        id !== "."
      ) {
        setAmountValue(`${amountValue}${label}`);
      }
    }
  };

  return (
    <li
      className={cn(
        "cursor-pointer hover:text-green-1",
        id === "." ? "pl-1" : ""
      )}
      tabIndex={0}
      id={id}
      onClick={() => handleDialPadInputs(id)}
    >
      {label}
    </li>
  );
};
DialPadKey.displayName = "DialPadKey";

type AmountDisplayProps = {
  displayAmount?: string;
};

export const AmountDisplay = (args: AmountDisplayProps) => {
  const { amountValue, assetCode } = useDialPadContext();

  const value = args.displayAmount
    ? args.displayAmount
    : `${getCurrencySymbol(assetCode)} ${amountValue}`;

  return (
    <div className="w-full whitespace-nowrap flex items-center justify-center text-5xl text-green-1">
      {value}
    </div>
  );
};
AmountDisplay.displayName = "AmountDisplay";
