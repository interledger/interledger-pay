import { useEffect } from "react";
import { cn } from "~/lib/cn";
import { useDialPadContext } from "~/lib/context/dialpad";
import { getCurrencySymbol } from "~/utils/helpers";

enum DialPadIds {
  Backspace = "Backspace",
  Dot = ".",
  Zero = "0",
  One = "1",
  Two = "2",
  Three = "3",
  Four = "4",
  Five = "5",
  Six = "6",
  Seven = "7",
  Eight = "8",
  Nine = "9",
}

export const DialPad = () => {
  return (
    <div className="flex flex-col gap-10 text-xl w-2/3">
      <AmountDisplay />
      <DialPadRow
        first={DialPadIds.One}
        second={DialPadIds.Two}
        third={DialPadIds.Three}
      />
      <DialPadRow
        first={DialPadIds.Four}
        second={DialPadIds.Five}
        third={DialPadIds.Six}
      />
      <DialPadRow
        first={DialPadIds.Seven}
        second={DialPadIds.Eight}
        third={DialPadIds.Nine}
      />
      <DialPadRow
        first={DialPadIds.Dot}
        second={DialPadIds.Zero}
        third="<"
        idThird={DialPadIds.Backspace}
      />
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
    const label = id === DialPadIds.Backspace ? "<" : id;
    if (Object.values<string>(DialPadIds).includes(id)) {
      if (id === DialPadIds.Backspace) {
        setAmountValue(`${amountValue.substring(0, amountValue.length - 1)}`);
      } else if (amountValue === "0" && id !== DialPadIds.Dot) {
        setAmountValue(
          `${amountValue.substring(0, amountValue.length - 1)}${label}`
        );
      } else if (
        (id === DialPadIds.Dot &&
          amountValue.indexOf(DialPadIds.Dot) === -1 &&
          amountValue.length !== 0) ||
        id !== DialPadIds.Dot
      ) {
        setAmountValue(`${amountValue}${label}`);
      }
    }
  };

  return (
    <li
      className={cn(
        "cursor-pointer hover:text-green-1",
        id === DialPadIds.Dot ? "pl-1" : ""
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
