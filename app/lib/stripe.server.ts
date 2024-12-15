import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function createPaymentIntent(amount: number) {
  return await stripe.paymentIntents.create({
    amount,
    currency: 'eur',
    automatic_payment_methods: {
      enabled: true
    }
  })
}

export async function retrievePaymentIntent(id: string) {
  return await stripe.paymentIntents.retrieve(id)
}
