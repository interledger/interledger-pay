import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { type WalletAddress } from '@interledger/open-payments'
import {
  type ActionFunctionArgs,
  json,
  redirect,
  type LoaderFunctionArgs
} from '@remix-run/node'
import { Form, Link, useActionData, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { AmountDisplay } from '~/components/dialpad'
import { Header } from '~/components/header'
import { BackNav } from '~/components/icons'
import Quote from '~/components/quoteDialog'
import { Button } from '~/components/ui/button'
import { Field } from '~/components/ui/form/form'
import { useDialogContext } from '~/lib/context/dialog'
import { useDialPadContext } from '~/lib/context/dialpad'
import { fetchQuote, initializePayment } from '~/lib/open-payments.server'
import { getValidWalletAddress } from '~/lib/validators.server'
import { commitSession, destroySession, getSession } from '~/session'
import { formatAmount } from '~/utils/helpers'

export async function loader({ request }: LoaderFunctionArgs) {
  const searchParams = new URL(request.url).searchParams
  const isQuote = searchParams.get('quote') || false

  const session = await getSession(request.headers.get('Cookie'))
  const walletAddressInfo = session.get('wallet-address')

  let receiverName = ''
  let receiveAmount = null
  let debitAmount = null

  if (walletAddressInfo === undefined) {
    throw new Error('Payment session expired.')
  }

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
    walletAddress: walletAddressInfo.walletAddress.id,
    receiveAmount: receiveAmount ? receiveAmount.amountWithCurrency : null,
    debitAmount: debitAmount ? debitAmount.amountWithCurrency : null,
    receiverName: receiverName,
    isQuote: isQuote
  } as const)
}

const schema = z.object({
  walletAddress: z.string(),
  receiver: z
    .string()
    .transform((val) => val.replace('$', 'https://'))
    .pipe(z.string().url({ message: 'The input is not a wallet address.' })),
  amount: z.coerce.number(),
  note: z.string().optional()
})

export default function Pay() {
  const data = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const { amountValue } = useDialPadContext()
  const { setOpen } = useDialogContext()
  const [form, fields] = useForm({
    id: 'pay-form',
    constraint: getFieldsetConstraint(schema),
    lastSubmission: actionData,
    shouldRevalidate: 'onSubmit'
  })

  data.isQuote ? setOpen(true) : setOpen(false)

  return (
    <>
      <Header />
      <Link to="/ilpay" className="flex gap-2 items-center justify-end">
        <BackNav />
        <span className="hover:text-green-1">Amount</span>
      </Link>
      <div className="flex h-full flex-col justify-center gap-10">
        <AmountDisplay />
        <div className="mx-auto w-full max-w-sm">
          <Form method="POST" {...form.props}>
            <div className="flex flex-col gap-4">
              <Field
                type="text"
                label="Pay from"
                variant="highlight"
                {...conform.input(fields.walletAddress)}
                value={data.walletAddress}
                readOnly
              />
              <Field
                label="Pay into"
                placeholder="Enter receiver wallet address"
                autoFocus={true}
                {...conform.input(fields.receiver)}
                errors={fields.receiver.errors}
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
                >
                  Pay with Interledger
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

  let receiver = {} as WalletAddress

  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'pay') {
    const submission = await parse(formData, {
      schema: schema.superRefine(async (data, context) => {
        try {
          receiver = await getValidWalletAddress(data.receiver)
          session.set('receiver-wallet-address', receiver)
        } catch (error) {
          context.addIssue({
            path: ['receiver'],
            code: z.ZodIssueCode.custom,
            message: 'Receiver wallet address is not valid.'
          })
        }
      }),
      async: true
    })

    if (!submission.value || submission.intent !== 'submit') {
      return json(submission)
    }

    const quote = await fetchQuote(submission.value, receiver)
    session.set('quote', quote)

    return redirect(`/pay?quote=true`, {
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
