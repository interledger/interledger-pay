import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { type WalletAddress } from '@interledger/open-payments'
import {
  type LoaderFunctionArgs,
  json,
  redirect,
  type ActionFunctionArgs
} from '@remix-run/node'
import { Form, useActionData, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { AmountDisplay } from '~/components/dialpad'
import { Header } from '~/components/header'
import Quote from '~/components/quoteDialog'
import { Button } from '~/components/ui/button'
import { Field } from '~/components/ui/form/form'
import { PayWithInterledgerMark } from '~/components/ui/logo'
import { useDialogContext } from '~/lib/context/dialog'
import {
  fetchRequestQuote,
  getRequestPaymentDetails,
  initializePayment
} from '~/lib/open-payments.server'
import { getValidWalletAddress } from '~/lib/validators.server'
import { commitSession, destroySession, getSession } from '~/session'
import { formatAmount, formatDate } from '~/utils/helpers'

export async function loader({ request }: LoaderFunctionArgs) {
  const searchParams = new URL(request.url).searchParams
  const isQuote = searchParams.get('quote') || false
  const paymentId = searchParams.get('url') || ''
  const receiver = searchParams.get('receiver') || ''

  const paymentDetails = await getRequestPaymentDetails(paymentId, receiver)
  const requestedAmount = paymentDetails.incomingAmount
    ? formatAmount({
        value: paymentDetails.incomingAmount?.value,
        assetCode: paymentDetails.incomingAmount?.assetCode,
        assetScale: paymentDetails.incomingAmount?.assetScale
      })
    : null

  const session = await getSession(request.headers.get('Cookie'))

  let receiverName = ''
  let receiveAmount = null
  let debitAmount = null

  if (isQuote) {
    const quote = session.get('quote')
    const receiver = session.get('receiver-wallet-address')

    if (quote === undefined) {
      throw new Error('Payment session expired.')
    }

    receiverName =
      receiver.publicName === undefined ? 'Recepient' : receiver.publicName

    receiveAmount = formatAmount({
      value: quote.receiveAmount.value,
      assetCode: quote.receiveAmount.assetCode,
      assetScale: quote.receiveAmount.assetScale
    })

    debitAmount = formatAmount({
      value: quote.debitAmount.value,
      assetCode: quote.debitAmount.assetCode,
      assetScale: quote.debitAmount.assetScale
    })
  }

  return json({
    receiver: paymentDetails.walletAddress,
    url: paymentId,
    requestedAmount: requestedAmount,
    note: paymentDetails.metadata
      ? paymentDetails.metadata.description + ''
      : '',
    date: formatDate({ date: paymentDetails.createdAt }),
    receiveAmount: receiveAmount ? receiveAmount.amountWithCurrency : null,
    debitAmount: debitAmount ? debitAmount.amountWithCurrency : null,
    receiverName: receiverName,
    isQuote: isQuote
  } as const)
}

const schema = z.object({
  walletAddress: z
    .string()
    .transform((val) => val.replace('$', 'https://'))
    .pipe(z.string().url({ message: 'The input is not a wallet address.' })),
  incomingPaymentUrl: z.string()
})

export default function PayRequest() {
  const data = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const { setOpen } = useDialogContext()
  const [form, fields] = useForm({
    id: 'payment-form',
    constraint: getFieldsetConstraint(schema),
    lastSubmission: actionData,
    shouldRevalidate: 'onSubmit'
  })

  data.isQuote ? setOpen(true) : setOpen(false)

  return (
    <>
      <Header />
      <div className="flex h-full flex-col justify-center gap-10">
        <AmountDisplay
          displayAmount={data.requestedAmount?.amountWithCurrency}
        />
        <div className="mx-auto w-full max-w-sm">
          <Form method="POST" {...form.props}>
            <Field
              label="Amount requested"
              defaultValue={data.requestedAmount?.amountWithCurrency}
              variant="highlight"
              readOnly
            ></Field>
            <Field
              label="Pay into Wallet Address"
              defaultValue={data.receiver}
              variant="highlight"
              readOnly
            ></Field>
            <Field
              label="Date requested"
              defaultValue={data.date}
              variant="highlight"
              readOnly
            ></Field>
            <Field
              label="Request note"
              defaultValue={data.note === 'undefined' ? '-' : data.note}
              variant="highlight"
              readOnly
            ></Field>
            <Field
              label="Pay from"
              type="text"
              placeholder="Enter your wallet address"
              {...conform.input(fields.walletAddress)}
              errors={fields.walletAddress.errors}
            ></Field>
            <input
              type="hidden"
              {...conform.input(fields.incomingPaymentUrl)}
              value={data.url || ''}
            />
            <div className="flex justify-center">
              <Button
                aria-label="pay"
                type="submit"
                name="intent"
                value="pay"
                size="xl"
              >
                <span className="text-md">Pay with</span>
                <PayWithInterledgerMark className="h-8 w-40 mx-2" />
              </Button>
            </div>
          </Form>
        </div>
        <Quote
          receiverName={data.receiverName}
          receiveAmount={data.receiveAmount || ''}
          debitAmount={data.debitAmount || ''}
        />
      </div>
    </>
  )
}

export async function action({ request }: ActionFunctionArgs) {
  const session = await getSession(request.headers.get('Cookie'))

  let walletAddress = {} as WalletAddress
  let receiverWalletAddress = {} as WalletAddress

  const formData = await request.formData()
  const intent = formData.get('intent')

  const searchParams = new URL(request.url).searchParams
  const paymentId = searchParams.get('url') || ''
  const receiver = searchParams.get('receiver') || ''

  if (intent === 'pay') {
    const submission = await parse(formData, {
      schema: schema.superRefine(async (data, context) => {
        try {
          walletAddress = await getValidWalletAddress(data.walletAddress)
          receiverWalletAddress = await getValidWalletAddress(receiver)
        } catch (error) {
          context.addIssue({
            path: ['walletAddress'],
            code: z.ZodIssueCode.custom,
            message: 'Your wallet address is not valid.'
          })
        }
      }),
      async: true
    })

    if (!submission.value || submission.intent !== 'submit') {
      return json(submission)
    }

    const quote = await fetchRequestQuote(submission.value)

    session.set('quote', quote)
    session.set('wallet-address', {
      walletAddress: walletAddress
    })
    session.set('receiver-wallet-address', receiverWalletAddress)
    session.set('isRequestPayment', true)

    return redirect(
      `/payment?url=${paymentId}&receiver=${receiver}&quote=true`,
      {
        headers: { 'Set-Cookie': await commitSession(session) }
      }
    )
  } else if (intent === 'confirm') {
    const quote = session.get('quote')
    const walletAddressInfo = session.get('wallet-address')

    if (quote === undefined || walletAddressInfo === undefined) {
      throw new Error('Payment session expired.')
    }

    const grant = await initializePayment({
      walletAddress: walletAddressInfo.walletAddress.id,
      quote: quote
    })

    session.set('payment-grant', grant)
    return redirect(grant.interact.redirect, {
      headers: { 'Set-Cookie': await commitSession(session) }
    })
  } else {
    return redirect('/', {
      headers: { 'Set-Cookie': await destroySession(session) }
    })
  }
}
