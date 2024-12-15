import { type ReactNode, useState } from 'react'
import { DialPadContext } from '~/lib/context/dialpad'

type DialPadProviderProps = {
  children: ReactNode
}

export const DialPadProvider = ({ children }: DialPadProviderProps) => {
  const [amountValue, setAmountValue] = useState('0')
  const [assetCode, setAssetCode] = useState('USD')

  return (
    <DialPadContext.Provider
      value={{
        amountValue,
        setAmountValue,
        assetCode,
        setAssetCode
      }}
    >
      {children}
    </DialPadContext.Provider>
  )
}
DialPadProvider.displayName = 'DialPadProvider'
