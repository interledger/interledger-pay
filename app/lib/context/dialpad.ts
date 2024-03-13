import { createContext, useContext } from "react";

type DialPadContextProps = {
  amountValue: string;
  setAmountValue: (amount: string) => void;
  assetCode: string;
  setAssetCode: (assetCode: string) => void;
};

export const DialPadContext = createContext<DialPadContextProps | null>(null);

export const useDialPadContext = () => {
  const dialPadContext = useContext(DialPadContext);

  if (!dialPadContext) {
    throw new Error(
      '"useDialPadContext" is used outside the DialPadContextProvider.'
    );
  }

  return dialPadContext;
};
