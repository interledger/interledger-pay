import { useForm } from '@conform-to/react'
import { type LoaderFunctionArgs, redirect, defer } from '@remix-run/node'
import { Await, Form, useActionData, useLoaderData } from '@remix-run/react'
import { cx } from 'class-variance-authority'
import { Suspense } from 'react'
import { Header } from '~/components/header'
import { FinishCheck, FinishError } from '~/components/icons'
import { Fallback, Loader } from '~/components/loader'
import { Button } from '~/components/ui/button'
import { useBackdropContext } from '~/lib/context/backdrop'
import { useDialogContext } from '~/lib/context/dialog'
import {
  type PaymentResultType,
  finishPayment,
  checkOutgoingPayment
} from '~/lib/open-payments.server'
import { destroySession, getSession } from '~/session'
import { objectToUrlParams } from '~/utils/helpers'

export async function loader({ request }: LoaderFunctionArgs) {
  const searchParams = new URL(request.url).searchParams

  const paymentId = searchParams.get('paymentId') || ''
  const interactRef = searchParams.get('interact_ref') || ''
  const result = searchParams.get('result') || ''

  let paymentResult: PaymentResultType = {
    message: '',
    color: 'red',
    error: false
  }
  let notDefer = false

  if (result === 'grant_rejected') {
    paymentResult = {
      message: 'Payment was successfully declined',
      color: 'red',
      error: false
    }
    notDefer = true
  } else if (!paymentId || !interactRef) {
    paymentResult = {
      message: 'An Error occured. Please try again.',
      color: 'red',
      error: true
    }
    notDefer = true
  }

  if (!notDefer) {
    const session = await getSession(request.headers.get('Cookie'))
    const quote = session.get('quote')
    const grant = session.get('payment-grant')
    const walletAddressInfo = session.get('wallet-address')
    const isRequestPayment = session.get('isRequestPayment')
    const isFromExtension = session.get('fromExtension')

    if (quote === undefined) {
      throw new Error('Payment session expired.')
    }

    const finishPaymentResponse = await finishPayment(
      grant,
      quote,
      walletAddressInfo.walletAddress,
      interactRef
    )

    const checkOutgoingPaymentPromise = checkOutgoingPayment(
      finishPaymentResponse.url,
      finishPaymentResponse.accessToken,
      quote.incomingPaymentGrantToken,
      quote.receiver,
      isRequestPayment
    )

    return defer({
      checkOutgoingPayment: checkOutgoingPaymentPromise,
      isFromExtension
    })
  }

  return defer({
    checkOutgoingPayment: Promise.resolve(paymentResult),
    isFromExtension: false
  })
}

export default function Finish() {
  const data = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()

  const [form] = useForm({
    id: 'finish-form',
    lastSubmission: actionData
  })

  const { setOpen } = useDialogContext()
  setOpen(false)
  const { setIsLoading } = useBackdropContext()

  return (
    <>
      {!data.isFromExtension && <Header />}
      <div className="flex justify-center items-center flex-col h-full px-5 gap-8">
        <Loader type="large" />
        <Suspense fallback={<Fallback />}>
          <Await
            resolve={data.checkOutgoingPayment}
            errorElement={<FinishError />}
          >
            {(outgoingPaymentCheck) => (
              <>
                {setIsLoading(false)}
                {outgoingPaymentCheck.error ? (
                  <>
                    <FinishError />
                    <div className="text-destructive uppercase sm:text-2xl font-medium text-center">
                      {outgoingPaymentCheck.message}
                    </div>
                    <Form method="POST" {...form.props}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="wmt-formattable-button"
                        type="submit"
                      >
                        {data.isFromExtension ? 'Close' : 'Home'}
                      </Button>
                    </Form>
                  </>
                ) : (
                  <>
                    <FinishCheck color={outgoingPaymentCheck.color} />
                    <div
                      className={cx(
                        'uppercase sm:text-2xl font-medium text-center',
                        outgoingPaymentCheck.color === 'red'
                          ? 'text-destructive'
                          : 'text-green-1'
                      )}
                    >
                      {outgoingPaymentCheck.message}
                    </div>
                    <Form method="POST" {...form.props}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="wmt-formattable-button"
                        type="submit"
                      >
                        {data.isFromExtension ? 'Close' : 'Home'}
                      </Button>
                    </Form>
                  </>
                )}
              </>
            )}
          </Await>
        </Suspense>
      </div>
    </>
  )
}

export async function action({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get('Cookie'))
  const isFromExtension = session.get('fromExtension')
  const submission = session.get('submission')
  if (submission?.value?.walletAddress) {
    delete submission.value.walletAddress
  }
  const params = submission?.value ? objectToUrlParams(submission?.value) : ''
  const path = isFromExtension ? `/extension?${params}` : `/`

  return redirect(path, {
    headers: { 'Set-Cookie': await destroySession(session) }
  })
}
