import Stripe from 'stripe'
import { config } from '~/lib/config.server'

const stripe = new Stripe(config.stripe.secretKey)

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
