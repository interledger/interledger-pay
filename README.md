# Interledger Pay

<a href="#interledger-pay">
  <img src="https://github.com/interledger/testnet/assets/117268143/54e6478d-7c6e-4aa4-a325-ec0ea8f507bb" width="920" alt="Interledger Pay">
</a>

## What is Interledger Pay?

Interledger Pay is a simplified payments platform, where you can easily send or request money from anyone anywhere in the world, if you own a Wallet Address.
A Wallet Address is a standardized identifier for a payment account. In the same way that an email address provides an identifier for a mailbox in the email ecosystem, a wallet address is used by an account holder to share the details of their account with a counter-party. If you don't already own one, you can create one at [Interledger Test Wallet](https://rafiki.money).

See Interledger Pay in action [here](https://interledgerpay.com).

### New to Interledger?

Never heard of Interledger before, or you would like to learn more? Here are some good places to start:

- [Interledger Website](https://interledger.org/)
- [Interledger Specs](https://interledger.org/developers/get-started/)
- [Interledger Explainer Video](https://twitter.com/Interledger/status/1567916000074678272)
- [Open Payments](https://openpayments.guide/)
- [Web monetization](https://webmonetization.org/)
- [Interledger Test Wallet](https://rafiki.money)
- [Interledger Boutique](https://rafiki.boutique)

## Contributing

Please read the [contribution guidelines](.github/contributing.md) before submitting contributions. All contributions must adhere to our [code of conduct](.github/CODE_OF_CONDUCT.md).

## Local Development Environment

### Prerequisites

- [NVM](https://github.com/nvm-sh/nvm)
- [Docker](https://docs.docker.com/get-docker/)

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

### Environment Variables

In order for the Interledger Pay to function, it is necessary to configure the environment variables appropriately. You must duplicate the example environment file, `.env.example`, into your local environment file, `.env`.

> **Note**
> The local environment file (`.env`) is **NOT** tracked in the version control system, and should **NOT** be included in any commits.

Navigate to the project's root directory and enter the following command:

```sh
cp ./docker/dev/.env.example ./docker/dev/.env
```

Using your preferred text editor, open the `./docker/dev/.env` file and configure the necessary environment variables.

You will need to create a USD wallet address in the [Test Wallet](https://wallet.interledger-test.dev) application, then generate public and private key for the wallet address in the `Developer Keys` found in the `Settings` menu of Interledger Test Wallet. With the generated values you can proceed to update the following environment variables: `PRIVATE_KEY` to the generated base64 encoded private key, `KEY_ID` to the wallet address key id, and `WALLET_ADDRESS` to the created wallet address.

`REDIRECT_URL` variable is the url for the interaction with the Identity Provider Page, in our case, localy this would be `https://localhost:5200/finish`. `INTERLEDGER_PAY_HOST` is the url where Interledger Pay is hosted, localy the value is `https://localhost:5200`. We are using cookies to store some data, so a cookie secret key needs to be set in `SESSION_COOKIE_SECRET_KEY`.

### Local Interledger Pay

Navigate to the project's root directory and execute:

```sh
docker compose -f docker-compose.dev.yml up
```

If you receive certificate error, then create a `.cert` folder in your `root` directory, and generate certificates `cert.pem` and `key.pem` that you need to copy into the created `.cert` directory. You can generate certificate files using [THIS](https://github.com/interledger/web-monetization-tools/tree/op-integration?tab=readme-ov-file#https-required) guideline.

Upon executing the docker command, the following will be available

- Interledger Pay application at [https://localhost:5200](https://localhost:5200)
