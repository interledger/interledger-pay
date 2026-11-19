{{/*
interledger-pay.checkKeys fails when a map holds a key outside the allowed
list. Call it with (list <map> <path> <allowed keys>).
*/}}
{{- define "interledger-pay.checkKeys" -}}
{{- $map := index . 0 -}}
{{- $path := index . 1 -}}
{{- $allowed := index . 2 -}}
{{- if not (kindIs "map" $map) -}}
{{- fail (printf "%s must be a map" $path) -}}
{{- end -}}
{{- range $key, $_ := $map -}}
{{- if not (has $key $allowed) -}}
{{- fail (printf "%s.%s is not a known key; known keys are %s" $path $key (join ", " $allowed)) -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
interledger-pay.httpsUrl fails unless the value is an https URL. Call it with
(list <value> <path>).
*/}}
{{- define "interledger-pay.httpsUrl" -}}
{{- $value := index . 0 -}}
{{- $path := index . 1 -}}
{{- if not (regexMatch "^https://[^/?#\\s]+(/[^\\s]*)?$" $value) -}}
{{- fail (printf "%s must be an https URL, got %q" $path $value) -}}
{{- end -}}
{{- end -}}

{{- define "interledger-pay.secretKeys" -}}
{{- list "key.privateKey" "sessionCookieKey" "stripe.secretKey" | toJson -}}
{{- end -}}

{{- define "interledger-pay.secretName" -}}
{{- .Values.secretsExternal | default (printf "%s-secret" (include "common.fullname" .)) -}}
{{- end -}}

{{/*
interledger-pay.config validates .Values.config and returns it as JSON, with
redirectUrl filled in.
*/}}
{{- define "interledger-pay.config" -}}
{{- $config := deepCopy (.Values.config | default dict) -}}
{{- include "interledger-pay.checkKeys" (list $config "config" (list "host" "redirectUrl" "walletAddress" "stripe")) -}}
{{- $walletAddress := $config.walletAddress | default dict -}}
{{- include "interledger-pay.checkKeys" (list $walletAddress "config.walletAddress" (list "url" "keyId")) -}}
{{- $stripe := $config.stripe | default dict -}}
{{- include "interledger-pay.checkKeys" (list $stripe "config.stripe" (list "publishableKey")) -}}

{{- $host := required "config.host is required" $config.host -}}
{{- if not (regexMatch "^https://[^/?#\\s]+/?$" $host) -}}
{{- fail (printf "config.host must be an https origin without a path, got %q" $host) -}}
{{- end -}}
{{- $host = trimSuffix "/" $host -}}
{{- $redirectUrl := $config.redirectUrl | default (printf "%s/finish" $host) -}}
{{- include "interledger-pay.httpsUrl" (list $redirectUrl "config.redirectUrl") -}}
{{- $url := required "config.walletAddress.url is required" $walletAddress.url -}}
{{- include "interledger-pay.httpsUrl" (list $url "config.walletAddress.url") -}}
{{- $keyId := required "config.walletAddress.keyId is required" $walletAddress.keyId -}}
{{- $publishableKey := required "config.stripe.publishableKey is required" $stripe.publishableKey -}}
{{- if not (regexMatch "^pk_(test|live)_\\w+$" $publishableKey) -}}
{{- fail "config.stripe.publishableKey must be a Stripe publishable key (pk_test_… or pk_live_…)" -}}
{{- end -}}

{{- dict "host" $host "redirectUrl" $redirectUrl "walletAddress" (dict "url" $url "keyId" $keyId) "stripe" (dict "publishableKey" $publishableKey) | toJson -}}
{{- end -}}

{{/*
interledger-pay.secret validates .Values.secret against secretsExternal.
*/}}
{{- define "interledger-pay.secret" -}}
{{- $secret := .Values.secret | default dict -}}
{{- $keys := include "interledger-pay.secretKeys" . | fromJsonArray -}}
{{- include "interledger-pay.checkKeys" (list $secret "secret" $keys) -}}
{{- if .Values.secretsExternal -}}
{{- range $key, $value := $secret -}}
{{- if $value -}}
{{- fail (printf "secret.%s is set, but secretsExternal names an existing Secret; set the key there instead" $key) -}}
{{- end -}}
{{- end -}}
{{- else -}}
{{- range $key := $keys -}}
{{- if not (index $secret $key) -}}
{{- fail (printf "secret.%s is required unless secretsExternal is set" $key) -}}
{{- end -}}
{{- end -}}
{{- if lt (len (index $secret "sessionCookieKey")) 32 -}}
{{- fail "secret.sessionCookieKey must be at least 32 characters" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
interledger-pay.env is the environment the application reads its settings
from, followed by app.env.
*/}}
{{- define "interledger-pay.env" -}}
{{- $config := include "interledger-pay.config" . | fromJson -}}
{{- $secretName := include "interledger-pay.secretName" . -}}
{{- $port := 0 -}}
{{- range .Values.app.ports -}}
{{- if eq .name "http" -}}
{{- $port = .containerPort -}}
{{- end -}}
{{- end -}}
{{- if eq (int $port) 0 -}}
{{- fail "app.ports must contain a port named http" -}}
{{- end -}}
{{- $env := list
  (dict "name" "NODE_ENV" "value" "production")
  (dict "name" "PORT" "value" (toString (int $port)))
  (dict "name" "INTERLEDGER_PAY_HOST" "value" $config.host)
  (dict "name" "REDIRECT_URL" "value" $config.redirectUrl)
  (dict "name" "WALLET_ADDRESS" "value" $config.walletAddress.url)
  (dict "name" "KEY_ID" "value" $config.walletAddress.keyId)
  (dict "name" "STRIPE_PUBLIC_KEY" "value" $config.stripe.publishableKey)
  (dict "name" "PRIVATE_KEY" "valueFrom" (dict "secretKeyRef" (dict "name" $secretName "key" "key.privateKey")))
  (dict "name" "SESSION_COOKIE_SECRET_KEY" "valueFrom" (dict "secretKeyRef" (dict "name" $secretName "key" "sessionCookieKey")))
  (dict "name" "STRIPE_SECRET_KEY" "valueFrom" (dict "secretKeyRef" (dict "name" $secretName "key" "stripe.secretKey")))
-}}
{{- concat $env (.Values.app.env | default list) | toJson -}}
{{- end -}}
