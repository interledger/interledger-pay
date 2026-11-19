# interledger-pay Helm chart

Deploys Interledger Pay: one Deployment and its Service. Each release publishes
the chart with the same version as the application:

```sh
helm install interledger-pay oci://ghcr.io/interledger/charts/interledger-pay \
  --version <version> --values values.yaml
```

## Values

`config` holds the settings, `secret` the secrets. The chart rejects unknown
keys and invalid values when it renders.

| Key | Description |
| --- | --- |
| `config.host` | Public URL of Interledger Pay, an https origin without a path |
| `config.redirectUrl` | Where the identity provider returns the user. Defaults to `<host>/finish` |
| `config.walletAddress.url` | The wallet address Interledger Pay signs its Open Payments requests as |
| `config.walletAddress.keyId` | The key ID of that wallet address |
| `config.stripe.publishableKey` | Stripe publishable key |
| `secret.key.privateKey` | Base64 encoded Ed25519 private key (PEM) of `config.walletAddress.keyId` |
| `secret.sessionCookieKey` | Signs the session cookie, at least 32 characters |
| `secret.stripe.secretKey` | Stripe secret key |
| `secretsExternal` | Name of an existing Secret with the three `secret` keys. The chart then creates no Secret |
| `app` | The Deployment and Service, see [values.yaml](values.yaml) |

A minimal values file with an existing Secret:

```yaml
config:
  host: https://pay.example.com
  walletAddress:
    url: https://wallet.example.com/interledger-pay
    keyId: 0b5c6a1e-1c4d-4b0e-9a8f-2f1d3c4b5a6e
  stripe:
    publishableKey: pk_live_...
secretsExternal: interledger-pay-secret
```

The Service is `<fullname>-service`, with the port `http`.
