import type { LoaderFunctionArgs } from '@remix-run/node'
import { json, Link, redirect, useLoaderData } from '@remix-run/react'
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { createPaymentIntent } from '../lib/stripe.server'
import { Header } from '~/components/header'
import { BackNav, Card } from '~/components/icons'
import { Button } from '~/components/ui/button'
import type { WalletAddress } from '@interledger/open-payments/dist/types'
import { getValidWalletAddress } from '~/lib/validators.server'
import { AmountDisplay } from '~/components/dialpad'
import { formatAmount } from '~/utils/helpers'
import { useEffect, useState } from 'react'

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const searchParams = url.searchParams
  const receiver = searchParams.get('receiver') || ''
  const amount = searchParams.get('amount') || ''

  let receiverWalletAddress = {} as WalletAddress

  if (receiver !== '') {
    try {
      receiverWalletAddress = await getValidWalletAddress(receiver)
    } catch (error) {
      throw new Error(
        'Receiver Wallet Address is not valid. Please check and try again.'
      )
    }
  }
  return json({
    paymentIntent: await createPaymentIntent(
      Number(amount) * 100,
      receiverWalletAddress.assetCode,
      {
        receiving_address: receiver
      }
    ),
    amountWithCurrency: formatAmount({
      value: (Number(amount) * 100).toString(),
      assetCode: receiverWalletAddress.assetCode,
      assetScale: receiverWalletAddress.assetScale
    }).amountWithCurrency,
    finishUrl: `${url.protocol}//${url.host}/card-payment-result`
  })
}

export default function CheckoutPage() {
  const data = useLoaderData<typeof loader>()
  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null)

  useEffect(() => {
    setStripePromise(loadStripe(window.ENV?.STRIPE_PUBLIC_KEY || ''))
  }, [])

  if (!stripePromise) {
    return null
  }

  const options = {
    clientSecret: data.paymentIntent.client_secret || undefined
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm
        amountWithCurrency={data.amountWithCurrency}
        finishUrl={data.finishUrl}
      />
    </Elements>
  )
}

type CheckoutFormProps = {
  amountWithCurrency: string
  finishUrl: string
}

function CheckoutForm({ amountWithCurrency, finishUrl }: CheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!stripe || !elements) return

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: finishUrl
      }
    })
    if (error) {
      redirect(`/card-payment-result?error=${error.message}`)
    }
  }

  return (
    <>
      <Header />
      <Link to="/" className="flex gap-2 items-center justify-end">
        <BackNav />
        <span className="hover:text-green-1">Home</span>
      </Link>
      <div className="flex mt-10 items-center flex-col h-full">
        <AmountDisplay displayAmount={amountWithCurrency} />
        <form
          onSubmit={handleSubmit}
          className="flex flex-col items-center border-light-green border-4 rounded-lg p-10 mt-10"
        >
          <PaymentElement />
          <Button
            aria-label="pay"
            type="submit"
            disabled={!stripe || !elements}
            size="xl"
            className="mt-5"
          >
            Pay with card
            <Card width="20" height="20" className="ml-2" />
          </Button>
        </form>
      </div>
    </>
  )
}
