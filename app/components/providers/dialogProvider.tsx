import { type ReactNode, useState } from 'react'
import { DialogContext } from '~/lib/context/dialog'

type DialogProviderProps = {
  children: ReactNode
}

export const DialogProvider = ({ children }: DialogProviderProps) => {
  const [open, setOpen] = useState(false)

  return (
    <DialogContext.Provider
      value={{
        open,
        setOpen
      }}
    >
      {children}
    </DialogContext.Provider>
  )
}
DialogProvider.displayName = 'DialogProvider'
