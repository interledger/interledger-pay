import { createContext, useContext } from "react";

type BackdropContextProps = {
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
};

export const BackdropContext = createContext<BackdropContextProps | null>(null);

export const useBackdropContext = () => {
  const backdropContext = useContext(BackdropContext);

  if (!backdropContext) {
    throw new Error(
      '"useBackdropContext" is used outside the BackdropContextProps.'
    );
  }

  return backdropContext;
};
