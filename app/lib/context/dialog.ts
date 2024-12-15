import { createContext, useContext } from 'react'

type DialogContextProps = {
  open: boolean
  setOpen: (open: boolean) => void
}

export const DialogContext = createContext<DialogContextProps | null>(null)

export const useDialogContext = () => {
  const dialogContext = useContext(DialogContext)

  if (!dialogContext) {
    throw new Error(
      '"useDialogContext" is used outside the DialogContextProvider.'
    )
  }

  return dialogContext
}
