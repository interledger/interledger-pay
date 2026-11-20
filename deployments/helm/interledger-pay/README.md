# interledger-pay Helm chart

Deploys Interledger Pay: one Deployment and its Service. Each release publishes
the chart with the same version as the application:

```sh
helm install interledger-pay oci://ghcr.io/interledger/charts/interledger-pay \
  --version <version> --values values.yaml
```

## Values

Interledger Pay reads a config file and a secrets file. The chart writes
`config` to a ConfigMap and `secret` to a Secret, mounts both, and points
`CONFIG_FILE` and `SECRETS_FILE` at them. Interledger Pay validates both files
when it starts, and does not start if either is not valid.

| Key | Description |
| --- | --- |
| `config.host` | Public URL of Interledger Pay, an https origin without a path |
| `config.redirectUrl` | Where the identity provider returns the user. Defaults to `<host>/finish` |
| `config.walletAddress.url` | The wallet address Interledger Pay signs its Open Payments requests as |
| `config.walletAddress.keyId` | The key ID of that wallet address |
| `config.stripe.publishableKey` | Stripe publishable key |
| `secret.walletAddress.privateKey` | Ed25519 private key (PEM, or base64 encoded PEM) of `config.walletAddress.keyId` |
| `secret.session.cookieSecret` | Signs the session cookie, at least 32 characters |
| `secret.stripe.secretKey` | Stripe secret key, of the same mode as the publishable key |
| `secretsExternal` | Name of an existing Secret that holds the secrets file under a `secrets.yaml` key. The chart then creates no Secret and ignores `secret` |
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

The `secrets.yaml` key of that Secret:

```yaml
walletAddress:
  privateKey: |
    -----BEGIN PRIVATE KEY-----
    ...
    -----END PRIVATE KEY-----
session:
  cookieSecret: ...
stripe:
  secretKey: sk_live_...
```

The Service is `<fullname>-service`, with the port `http`.
