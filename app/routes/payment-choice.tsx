import { Header } from '~/components/header'
import { Link, useLoaderData } from '@remix-run/react'
import { BackNav, Card } from '~/components/icons'
import { json, redirect, type LoaderFunctionArgs } from '@remix-run/node'
import { destroySession, getSession } from '~/session'
import { getValidWalletAddress } from '~/lib/validators.server'
import { InterledgerMark } from '~/components/ui/logo'
import { DialPad } from '~/components/dialpad'
import { Field } from '~/components/ui/form/form'
import { useDialPadContext } from '~/lib/context/dialpad'
import { useEffect } from 'react'
import type { WalletAddress } from '@interledger/open-payments'

type LoaderData = {
  receiver: string
  assetCode?: string | null
}

export async function loader({ request }: LoaderFunctionArgs) {
  const searchParams = new URL(request.url).searchParams
  const receiver = searchParams.get('receiver') || ''
  const session = await getSession(request.headers.get('Cookie'))
  let receiverWalletAddress = {} as WalletAddress

  if (receiver !== '') {
    try {
      receiverWalletAddress = await getValidWalletAddress(receiver)
    } catch (error) {
      // Prefer redirecting to home instead of throwing a 500.
      // You can customize this behavior (flash message, query param, etc.)
      return redirect('/', {
        headers: { 'Set-Cookie': await destroySession(session) }
      })
    }
  } else {
    return redirect('/', {
      headers: { 'Set-Cookie': await destroySession(session) }
    })
  }

  return json<LoaderData>({
    receiver,
    assetCode: receiverWalletAddress.assetCode ?? null
  })
}

export default function PaymentChoice() {
  const data = useLoaderData<typeof loader>() as LoaderData

  const { setAssetCode, amountValue } = useDialPadContext()

  // only set the asset code when it's available and avoid rerunning every render
  useEffect(() => {
    if (data?.assetCode) {
      setAssetCode(data.assetCode)
    }
  }, [data?.assetCode, setAssetCode])

  const encodedReceiver = encodeURIComponent(data.receiver)
  const encodedAmount = encodeURIComponent(String(amountValue ?? ''))
  const hasAmount = amountValue !== undefined && amountValue !== null && String(amountValue).trim() !== ''

  return (
    <>
      <Header />
      <Link to="/" className="flex gap-2 items-center justify-end">
        <BackNav />
        <span className="hover:text-green-1">Home</span>
      </Link>
      <div className="flex mt-10 items-center flex-col h-full px-5">
        <Field
          label="Pay into Wallet Address"
          variant="highlight"
          defaultValue={data.receiver}
          readOnly
          className="w-full max-w-sm"
        />
        <div className="h-2/3 items-center justify-center flex flex-col gap-10 w-full max-w-sm">
          <DialPad />
        </div>
        <div className="flex sm:justify-center items-center sm:items-start mt-20 flex-col w-full gap-10 sm:flex-row h-full px-5">
          <Link
            to={`/pay-with-interledger?receiver=${encodedReceiver}`}
            className={`w-48 h-24 text-right ease-in-out transition-[box-shadow,transform] duration-200 aspect-[5/3] rounded-lg flex flex-col p-3 border-2
          hover:scale-105 focus:scale-105 hover:bg-green-2 hover:border-green-2`}
          >
            <span className="h-6 flex justify-end text-green-1">
              <InterledgerMark />
            </span>
            <span className="mt-6 font-semibold -tracking-wider text-green-1 text-xl">
              Pay with Interledger
            </span>
          </Link>

          {/* If no amount is entered, disable the card checkout link */}
          {hasAmount ? (
            <Link
              to={`/checkout?receiver=${encodedReceiver}&amount=${encodedAmount}`}
              className={`w-48 h-24 text-right ease-in-out transition-[box-shadow,transform] duration-200 aspect-[5/3] rounded-lg flex flex-col p-3 border-2
            hover:scale-105 focus:scale-105 hover:bg-green-2 hover:border-green-2`}
            >
              <span className="h-6 flex justify-end text-[#222222]">
                <Card />
              </span>
              <span className="text-md mt-6 font-semibold -tracking-wider text-green-1 text-xl">
                Pay with card
              </span>
            </Link>
          ) : (
            <div
              role="button"
              aria-disabled="true"
              className="w-48 h-24 text-right ease-in-out transition-[box-shadow,transform] duration-200 aspect-[5/3] rounded-lg flex flex-col p-3 border-2 opacity-50 cursor-not-allowed"
              title="Enter an amount to enable this option"
            >
              <span className="h-6 flex justify-end text-[#222222]">
                <Card />
              </span>
              <span className="text-md mt-6 font-semibold -tracking-wider text-green-1 text-xl">
                Pay with card
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
