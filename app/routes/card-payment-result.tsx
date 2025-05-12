import type { LoaderFunctionArgs } from '@remix-run/node'
import { json, Link, useLoaderData } from '@remix-run/react'
import { useEffect, useState } from 'react'
import { retrievePaymentIntent } from '../lib/stripe.server'
import { FinishCheck, FinishError } from '~/components/icons'
import { formatAmount } from '~/utils/helpers'
import { Loader } from '~/components/loader'

export async function loader({ request }: LoaderFunctionArgs) {
  const params = new URL(request.url).searchParams
  const paymentIntentId = params.get('payment_intent')
  const clientSecret = params.get('payment_intent_client_secret')
  const errorMessage = params.get('error')

  let paymentIntent
  if (errorMessage === null) {
    paymentIntent = await retrievePaymentIntent(paymentIntentId!)
  }

  return json({
    id: paymentIntentId,
    paymentIntent,
    clientSecret,
    errorMessage
  })
}

export default function CardPaymentResult() {
  const [paymentIntent, setPaymentIntent] = useState(null)
  const data = useLoaderData<typeof loader>() as any
  const amount = formatAmount({
    value: data.paymentIntent.amount,
    assetCode: data.paymentIntent.currency,
    assetScale: 2
  })

  useEffect(() => {
    if (data.paymentIntent) {
      setPaymentIntent(data.paymentIntent)
    }
  }, [data.paymentIntent])

  if (!paymentIntent) {
    return (
      <div className="text-center text-gray-500">
        <Loader type="large" />
      </div>
    )
  }

  return (
    <div className="flex justify-center items-center flex-col h-full px-5 gap-8">
      {data.errorMessage ? (
        <>
          <FinishError />
          <div className="text-destructive uppercase sm:text-2xl font-medium text-center">
            {data.errorMessage}
          </div>
        </>
      ) : (
        <>
          <FinishCheck color="green-1" />
          <div className="text-green-1">
            Payment of {amount.amountWithCurrency} is successfully completed.
          </div>
        </>
      )}
      <Link
        to="/"
        className="flex gap-2 items-center justify-end border rounded-xl px-4 py-2"
      >
        <span className="hover:text-green-1">Close</span>
      </Link>
    </div>
  )
}
