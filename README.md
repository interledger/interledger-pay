# Interledger Pay

<a href="#interledger-pay">
  <img src="https://github.com/interledger/testnet/assets/117268143/54e6478d-7c6e-4aa4-a325-ec0ea8f507bb" width="920" alt="Interledger Pay">
</a>

## What is Interledger Pay?

Interledger Pay is a simplified transactions platform, where you can easily send or request money from anyone anywhere in the world, if you own a wallet address.

See Interledger Pay in action [here](https://interledgerpay.com).

### New to Interledger?

Never heard of Interledger before, or you would like to learn more? Here are some good places to start:

- [Good first issues](https://github.com/interledger/testnet/contribute)
- [Interledger Explainer Video](https://twitter.com/Interledger/status/1567916000074678272)
- [Interledger Website](https://interledger.org)
- [Payment pointers](https://paymentpointers.org/)
- [Web monetization](https://webmonetization.org/)
- [Interledger Test Wallet](https://rafiki.money)
- [Interledger Boutique](https://rafiki.boutique)c

## Contributing

Please read the [contribution guidelines](.github/contributing.md) before submitting contributions. All contributions must adhere to our [code of conduct](.github/CODE_OF_CONDUCT.md).

## Local Development Environment

### Prerequisites

- [NVM](https://github.com/nvm-sh/nvm)

### Environment Setup

```sh
# Install Node > 20
nvm install lts/iron
nvm use lts/iron

# Install pnpm using Corepack
corepack enable
```

If you do not have `corepack` installed locally you can use `npm` or `yarn` to install `pnpm`:

```sh
npm install pnpm -g
# or
yarn install pnpm -g
```

For alternative methods of installing `pnpm`, you can refer to the [official `pnpm` documentation](https://pnpm.io/installation).

To install dependencies, execute:

```sh
pnpm i
```

### Local Interledger Pay

Navigate to the project's root directory and execute:

```sh
pnpm dev
```

Upon executing the above command, the following will be available

- Interledger Pay application at [http://localhost:3000](http://localhost:3000)
