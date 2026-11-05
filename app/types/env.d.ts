declare global {
  interface Window {
    ENV: {
      STRIPE_PUBLIC_KEY: string
    }
  }
}

export {}
