import type { LoaderFunctionArgs } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { useEffect, useState } from 'react'
import { createPaymentIntent } from '../lib/stripe.server'
import { getSession } from '../session'
import { Header } from '~/components/header'
import { BackNav } from '~/components/icons'
import { Button } from '~/components/ui/button'

const stripePromise = loadStripe('pk_test_B4Mlg9z1svOsuVjovpcLaK0d00lWym58fF')

export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState('')

  const paymentIntent: any = useLoaderData()
  const options = {
    clientSecret: paymentIntent.client_secret
  }

  useEffect(() => {
    if (paymentIntent && paymentIntent.client_secret) {
      setClientSecret(paymentIntent.client_secret)
    }
  }, [paymentIntent])

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm clientSecret={clientSecret} />
    </Elements>
  )
}

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get('Cookie'))
  const amount = session.get('amount')
  return await createPaymentIntent(amount)
}

type CheckoutFormProps = {
  clientSecret: string
}

function CheckoutForm({ clientSecret }: CheckoutFormProps) {
  console.log('clientSecret', clientSecret)
  // Client secret might still need to be passed down as props in case of using the CardElement instead of PaymentElement (which allows for full customization)
  /*
		stripe.confirmCardPayment.(clientSecret, {
			payment_method: {card: cardElement}
		})`
	*/
  // Leaving it as frontend's choice

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
        <form onSubmit={handleSubmit}>
          <PaymentElement />
          <Button
            aria-label="pay"
            type="submit"
            disabled={!stripe || !elements}
            size="xl"
            className="mt-5"
          >
            Pay
          </Button>
        </form>
      </div>
    </>
  )
}
