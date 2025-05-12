import { Button } from '~/components/ui/button'
import { DialPad, DialPadIds } from '~/components/dialpad'
import { Header } from '~/components/header'
import { Link, useLoaderData } from '@remix-run/react'
import { useDialPadContext } from '~/lib/context/dialpad'
import { BackNav, Card } from '~/components/icons'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { getSession } from '~/session'
import { useEffect } from 'react'
import { getValidWalletAddress } from '~/lib/validators.server'
import type { WalletAddress } from '@interledger/open-payments/dist/types'

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get('Cookie'))
  const walletAddressInfo = session.get('wallet-address')
  const searchParams = new URL(request.url).searchParams
  const receiver = searchParams.get('receiver') || ''

  let receiverWalletAddress = {} as WalletAddress
  let isPayWithCard = false

  if (receiver !== '') {
    try {
      receiverWalletAddress = await getValidWalletAddress(receiver)
      isPayWithCard = true
    } catch (error) {
      throw new Error(
        'Receiver Wallet Address is not valid. Please check and try again.'
      )
    }
  } else if (walletAddressInfo === undefined) {
    throw new Error('Payment session expired.')
  }

  return json({
    assetCode: isPayWithCard
      ? receiverWalletAddress.assetCode
      : walletAddressInfo.walletAddress.assetCode,
    isPayWithCard: isPayWithCard,
    receiver: receiverWalletAddress.id
  } as const)
}

export default function Ilpay() {
  const data = useLoaderData<typeof loader>()
  const { amountValue, setAmountValue, setAssetCode } = useDialPadContext()

  useEffect(() => {
    setAssetCode(data.assetCode)
  })

  return (
    <>
      <Header />
      <Link to="/" className="flex gap-2 items-center justify-end">
        <BackNav />
        <span className="hover:text-green-1">Home</span>
      </Link>
      <div className="flex justify-center items-center flex-col h-full px-5">
        <div className="h-2/3 items-center justify-center flex flex-col gap-10 w-full max-w-sm">
          <DialPad />
          {data.isPayWithCard ? (
            <Link
              to={`/checkout?receiver=${data.receiver}&amount=${amountValue}`}
              onClick={(e: React.MouseEvent<HTMLElement>) => {
                if (
                  amountValue.indexOf(DialPadIds.Dot) === -1 ||
                  amountValue.endsWith(DialPadIds.Dot)
                ) {
                  setAmountValue(Number(amountValue).toFixed(2).toString())
                }
                if (Number(amountValue) === 0) e.preventDefault()
              }}
            >
              <Button
                aria-label="pay with card"
                size={'sm'}
                disabled={Number(amountValue) === 0}
              >
                Pay with card
                <Card width="20" height="20" className="ml-2" />
              </Button>
            </Link>
          ) : (
            <div className="flex gap-2">
              <Link
                to={`/request`}
                onClick={(e: React.MouseEvent<HTMLElement>) => {
                  if (
                    amountValue.indexOf(DialPadIds.Dot) === -1 ||
                    amountValue.endsWith(DialPadIds.Dot)
                  ) {
                    setAmountValue(Number(amountValue).toFixed(2).toString())
                  }
                  if (Number(amountValue) === 0) e.preventDefault()
                }}
              >
                <Button
                  aria-label="request"
                  variant="outline"
                  size="sm"
                  disabled={Number(amountValue) === 0}
                >
                  Request
                </Button>
              </Link>
              <Link
                to={`/pay`}
                onClick={(e: React.MouseEvent<HTMLElement>) => {
                  if (
                    amountValue.indexOf(DialPadIds.Dot) === -1 ||
                    amountValue.endsWith(DialPadIds.Dot)
                  ) {
                    setAmountValue(Number(amountValue).toFixed(2).toString())
                  }
                  if (Number(amountValue) === 0) e.preventDefault()
                }}
              >
                <Button
                  aria-label="pay"
                  size={'sm'}
                  disabled={Number(amountValue) === 0}
                >
                  Pay
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
