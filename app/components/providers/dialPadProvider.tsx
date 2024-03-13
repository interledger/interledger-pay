import { ReactNode, useState } from "react";
import { DialPadContext } from "~/lib/context/dialpad";
import { getCurrencySymbol } from "~/utils/helpers";

type DialPadProviderProps = {
  children: ReactNode;
};

export const DialPadProvider = ({ children }: DialPadProviderProps) => {
  const [amountValue, setAmountValue] = useState("0");
  const [assetCode, setAssetCode] = useState(getCurrencySymbol("USD"));

  return (
    <DialPadContext.Provider
      value={{
        amountValue,
        setAmountValue,
        assetCode,
        setAssetCode,
      }}
    >
      {children}
    </DialPadContext.Provider>
  );
};
DialPadProvider.displayName = "DialPadProvider";
