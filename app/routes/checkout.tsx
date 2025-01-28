import type { LoaderFunctionArgs } from '@remix-run/node'
import { json, Link, useLoaderData } from '@remix-run/react'
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

const stripePromise = loadStripe('pk_test_B4Mlg9z1svOsuVjovpcLaK0d00lWym58fF')

export async function loader({ request }: LoaderFunctionArgs) {
  const searchParams = new URL(request.url).searchParams
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
      receiverWalletAddress.assetCode
    ),
    amountWithCurrency: formatAmount({
      value: (Number(amount) * 100).toString(),
      assetCode: receiverWalletAddress.assetCode,
      assetScale: receiverWalletAddress.assetScale
    }).amountWithCurrency
  })
}

export default function CheckoutPage() {
  const data: any = useLoaderData<typeof loader>()

  const options = {
    clientSecret: data.paymentIntent.client_secret
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm amountWithCurrency={data.amountWithCurrency} />
    </Elements>
  )
}

type CheckoutFormProps = {
  amountWithCurrency: string
}

function CheckoutForm({ amountWithCurrency }: CheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!stripe || !elements) return

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: 'http://localhost:3000/success' // TODO Success Page
      }
    })
    if (error) {
      console.error(error.message)
    }
  }

  return (
    <>
      <Header />
      <Link to="/" className="flex gap-2 items-center justify-end">
        <BackNav />
        <span className="hover:text-green-1">Home</span>
      </Link>
      <div className="flex justify-center items-center flex-col h-full">
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
