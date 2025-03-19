import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { type WalletAddress } from '@interledger/open-payments'
import {
  type ActionFunctionArgs,
  json,
  redirect,
  type LoaderFunctionArgs
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
import { useDialPadContext } from '~/lib/context/dialpad'
import {
  createRequestPayment,
  fetchRequestQuote,
  initializePayment
} from '~/lib/open-payments.server'
import { getValidWalletAddress } from '~/lib/validators.server'
import { commitSession, destroySession, getSession } from '~/session'
import { formatAmount } from '~/utils/helpers'

export async function loader({ request }: LoaderFunctionArgs) {
  const searchParams = new URL(request.url).searchParams
  const isQuote = searchParams.get('quote') || false
  const receiver = searchParams.get('receiver') || ''
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
  } else if (receiver !== '') {
    try {
      await getValidWalletAddress(receiver)
    } catch (error) {
      throw new Error(
        'Receiver Wallet Address is not valid. Please check and try again.'
      )
    }
  } else {
    return redirect('/', {
      headers: { 'Set-Cookie': await destroySession(session) }
    })
  }

  return json({
    receiver: receiver,
    receiveAmount: receiveAmount ? receiveAmount.amountWithCurrency : null,
    debitAmount: debitAmount ? debitAmount.amountWithCurrency : null,
    receiverName: receiverName,
    isQuote: isQuote
  } as const)
}

const schema = z.object({
  receiver: z.string(),
  walletAddress: z
    .string()
    .transform((val) => val.replace('$', 'https://'))
    .pipe(z.string().url({ message: 'The input is not a wallet address.' })),
  amount: z.coerce.number(),
  note: z.string().optional()
})

export default function PayWithInterledger() {
  const data = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const { setOpen } = useDialogContext()
  const { amountValue } = useDialPadContext()
  const [form, fields] = useForm({
    id: 'pay-with-interledger-form',
    constraint: getFieldsetConstraint(schema),
    lastSubmission: actionData,
    shouldRevalidate: 'onSubmit'
  })

  data.isQuote ? setOpen(true) : setOpen(false)

  return (
    <>
      <Header />
      <div className="flex h-full flex-col justify-center gap-10">
        <AmountDisplay />
        <div className="mx-auto w-full max-w-sm">
          <Form method="POST" {...form.props}>
            <div className="flex flex-col gap-4">
              <Field
                label="Pay into Wallet Address"
                variant="highlight"
                {...conform.input(fields.receiver)}
                defaultValue={data.receiver}
                readOnly
              />
              <Field
                label="Pay from"
                placeholder="Enter your wallet address"
                {...conform.input(fields.walletAddress)}
                errors={fields.walletAddress.errors}
              />
              <Field
                label="Payment note"
                placeholder="Note"
                {...conform.input(fields.note)}
                errors={fields.note.errors}
              />
              <input
                type="hidden"
                {...conform.input(fields.amount)}
                value={Number(amountValue)}
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

  if (intent === 'pay') {
    const submission = await parse(formData, {
      schema: schema.superRefine(async (data, context) => {
        try {
          walletAddress = await getValidWalletAddress(data.walletAddress)
          receiverWalletAddress = await getValidWalletAddress(data.receiver)
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

    const incomingPayment = await createRequestPayment({
      walletAddress: submission.value.receiver,
      amount: submission.value.amount,
      note: submission.value.note
    })
    const quote = await fetchRequestQuote({
      walletAddress: submission.value.walletAddress,
      incomingPaymentUrl: incomingPayment.id
    })

    // const quote = await fetchQuote(submission.value, receiverWalletAddress)
    session.set('quote', quote)
    session.set('wallet-address', {
      walletAddress: walletAddress
    })
    session.set('receiver-wallet-address', receiverWalletAddress)

    return redirect(`/pay-with-interledger?quote=true`, {
      headers: { 'Set-Cookie': await commitSession(session) }
    })
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
