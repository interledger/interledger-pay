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

PR titles must follow [Conventional Commits](https://www.conventionalcommits.org/). Releases are created by running the `Release` workflow on `main`, which derives the next version from these titles.

## Deployment

Interledger Pay is deployed with its Helm chart, `oci://ghcr.io/interledger/charts/interledger-pay`. See [the chart README](deployments/helm/interledger-pay/README.md).

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

### Configuration

Interledger Pay reads its configuration from YAML files. It reads `CONFIG_FILE` (default `config.yaml`) and, if set, `SECRETS_FILE`, and merges them. A key must be set in one file only. The application validates the configuration at startup and does not start if it is not valid; it lists every problem it finds.

> **Note**
> `config.yaml` and `secrets.yaml` are **NOT** tracked in the version control system, and should **NOT** be included in any commits.

Copy the examples in the project's root directory:

```sh
cp config.example.yaml config.yaml
cp secrets.example.yaml secrets.yaml
```

You will need to create a USD wallet address in the [Test Wallet](https://wallet.interledger-test.dev) application, then generate public and private key for the wallet address in the `Developer Keys` found in the `Settings` menu of Interledger Test Wallet.

| Key | File | Description |
| --- | --- | --- |
| `host` | config | URL where Interledger Pay is hosted, locally `https://localhost:5200` |
| `redirectUrl` | config | URL of the finish page after the interaction with the identity provider. Optional, defaults to `<host>/finish` |
| `walletAddress.url` | config | The wallet address Interledger Pay uses as its client |
| `walletAddress.keyId` | config | The key id of the wallet address key |
| `walletAddress.privateKey` | secrets | The Ed25519 private key of the wallet address, in PEM (or the base64 encoded PEM that Test Wallet generates) |
| `session.cookieSecret` | secrets | Secret that signs the session cookie, at least 32 characters |
| `stripe.publishableKey` | config | Stripe publishable key (`pk_test_…` or `pk_live_…`) |
| `stripe.secretKey` | secrets | Stripe secret key, of the same mode as the publishable key |

In production (`NODE_ENV=production`) every URL must use `https`.

### Local Interledger Pay

Navigate to the project's root directory and execute:

```sh
docker compose -f docker-compose.dev.yml up
```

If you receive certificate error, then create a `.cert` folder in your `root` directory, and generate certificates `cert.pem` and `key.pem` that you need to copy into the created `.cert` directory. You can generate certificate files using [THIS](https://github.com/interledger/web-monetization-tools/tree/op-integration?tab=readme-ov-file#https-required) guideline.

Upon executing the docker command, the following will be available

- Interledger Pay application at [https://localhost:5200](https://localhost:5200)
