import { type ReactNode, useState } from 'react'
import { BackdropContext } from '~/lib/context/backdrop'

type BackdropProviderProps = {
  children: ReactNode
}

export const BackdropProvider = ({ children }: BackdropProviderProps) => {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <BackdropContext.Provider
      value={{
        isLoading,
        setIsLoading
      }}
    >
      {children}
    </BackdropContext.Provider>
  )
}
BackdropProvider.displayName = 'BackdropProvider'
