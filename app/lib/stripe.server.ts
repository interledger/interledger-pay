import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function createPaymentIntent(amount: number, assetCode: string, metadata?: Record<string, string>) {
  try{
    return await stripe.paymentIntents.create({
      amount,
      currency: assetCode,
      automatic_payment_methods: {
        enabled: true
      },
      metadata
    })
  }catch(e){
    console.error(e)
    throw new Error('Failed to create payment intent')
  }
}

export async function retrievePaymentIntent(id: string) {
  return await stripe.paymentIntents.retrieve(id)
}
