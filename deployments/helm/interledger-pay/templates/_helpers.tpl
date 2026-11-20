{{- define "interledger-pay.configMapName" -}}
{{- printf "%s-config" (include "common.fullname" .) -}}
{{- end -}}

{{- define "interledger-pay.secretName" -}}
{{- .Values.secretsExternal | default (printf "%s-secret" (include "common.fullname" .)) -}}
{{- end -}}
