import type { LoaderFunctionArgs } from '@remix-run/node'
import { json, useLoaderData } from '@remix-run/react'
import { useEffect, useState } from 'react'
import { retrievePaymentIntent } from '../lib/stripe.server'

export async function loader({ request }: LoaderFunctionArgs) {
  const params = new URL(request.url).searchParams
  const paymentIntentId = params.get('payment_intent')
  const clientSecret = params.get('payment_intent_client_secret')

  const paymentIntent = await retrievePaymentIntent(paymentIntentId!)

  return json({
    id: paymentIntentId,
    paymentIntent,
    clientSecret
  })
}

export default function SuccessPage() {
  const [paymentIntent, setPaymentIntent] = useState(null)
  const data = useLoaderData<typeof loader>() as any

  useEffect(() => {
    if (data.paymentIntent) {
      setPaymentIntent(data.paymentIntent)
    }
  }, [data.paymentIntent])

  if (!paymentIntent) {
    return <div className="text-center text-gray-500">Loading...</div>
  }

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-green-600 mb-4">
        Payment Successful
      </h1>
      <div className="text-left">
        <p className="mb-2">
          <strong>Payment Intent ID:</strong> {(paymentIntent as any).id}
        </p>
        <p className="mb-2">
          <strong>Status:</strong> {(paymentIntent as any).status}
        </p>
        <p className="mb-2">
          <strong>Amount:</strong> {(paymentIntent as any).amount}
        </p>
        <p className="mb-2">
          <strong>Currency:</strong> {(paymentIntent as any).currency}
        </p>
        <p className="mb-2">
          <strong>Payment Method:</strong>{' '}
          {(paymentIntent as any).payment_method}
        </p>
      </div>
    </div>
  )
}
