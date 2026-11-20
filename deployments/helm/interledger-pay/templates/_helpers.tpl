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

{{- define "interledger-pay.configMapName" -}}
{{- printf "%s-config" (include "common.fullname" .) -}}
{{- end -}}

{{- define "interledger-pay.secretName" -}}
{{- .Values.secretsExternal | default (printf "%s-secret" (include "common.fullname" .)) -}}
{{- end -}}

{{/*
interledger-pay.config validates .Values.config and returns the config file.
*/}}
{{- define "interledger-pay.config" -}}
{{- $config := .Values.config | default dict -}}
{{- include "interledger-pay.checkKeys" (list $config "config" (list "host" "redirectUrl" "walletAddress" "stripe")) -}}
{{- $walletAddress := $config.walletAddress | default dict -}}
{{- include "interledger-pay.checkKeys" (list $walletAddress "config.walletAddress" (list "url" "keyId")) -}}
{{- $stripe := $config.stripe | default dict -}}
{{- include "interledger-pay.checkKeys" (list $stripe "config.stripe" (list "publishableKey")) -}}

{{- $host := required "config.host is required" $config.host -}}
{{- if not (regexMatch "^https://[^/?#\\s]+/?$" $host) -}}
{{- fail (printf "config.host must be an https origin without a path, got %q" $host) -}}
{{- end -}}
{{- $url := required "config.walletAddress.url is required" $walletAddress.url -}}
{{- include "interledger-pay.httpsUrl" (list $url "config.walletAddress.url") -}}
{{- $keyId := required "config.walletAddress.keyId is required" $walletAddress.keyId -}}
{{- $publishableKey := required "config.stripe.publishableKey is required" $stripe.publishableKey -}}
{{- if not (regexMatch "^pk_(test|live)_\\w+$" $publishableKey) -}}
{{- fail "config.stripe.publishableKey must be a Stripe publishable key (pk_test_… or pk_live_…)" -}}
{{- end -}}

{{- $file := dict "host" $host "walletAddress" (dict "url" $url "keyId" $keyId) "stripe" (dict "publishableKey" $publishableKey) -}}
{{- with $config.redirectUrl -}}
{{- include "interledger-pay.httpsUrl" (list . "config.redirectUrl") -}}
{{- $_ := set $file "redirectUrl" . -}}
{{- end -}}
{{- toYaml $file -}}
{{- end -}}

{{/*
interledger-pay.secret validates .Values.secret against secretsExternal.
*/}}
{{- define "interledger-pay.secret" -}}
{{- $secret := .Values.secret | default dict -}}
{{- $fields := dict "walletAddress" "privateKey" "session" "cookieSecret" "stripe" "secretKey" -}}
{{- include "interledger-pay.checkKeys" (list $secret "secret" (keys $fields | sortAlpha)) -}}
{{- range $group, $key := $fields -}}
{{- $map := index $secret $group | default dict -}}
{{- include "interledger-pay.checkKeys" (list $map (printf "secret.%s" $group) (list $key)) -}}
{{- $value := index $map $key -}}
{{- if $.Values.secretsExternal -}}
{{- if $value -}}
{{- fail (printf "secret.%s.%s is set, but secretsExternal names an existing Secret; set the key there instead" $group $key) -}}
{{- end -}}
{{- else if not $value -}}
{{- fail (printf "secret.%s.%s is required unless secretsExternal is set" $group $key) -}}
{{- end -}}
{{- end -}}
{{- if and (not .Values.secretsExternal) (lt (len .Values.secret.session.cookieSecret) 32) -}}
{{- fail "secret.session.cookieSecret must be at least 32 characters" -}}
{{- end -}}
{{- end -}}

{{/*
interledger-pay.port is the containerPort of the port named http.
*/}}
{{- define "interledger-pay.port" -}}
{{- $port := 0 -}}
{{- range .Values.app.ports -}}
{{- if eq .name "http" -}}
{{- $port = .containerPort -}}
{{- end -}}
{{- end -}}
{{- if eq (int $port) 0 -}}
{{- fail "app.ports must contain a port named http" -}}
{{- end -}}
{{- int $port -}}
{{- end -}}
