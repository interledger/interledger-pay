export const decompressCss = (value: string) => {
  const decoded = atob(value.replaceAll('-', '+').replaceAll('_', '/'))
  const u8 = new Uint8Array(decoded.length)
  for (let i = 0; i < decoded.length; i++) {
    u8[i] = decoded.charCodeAt(i)
  }
  const stream = new Blob([u8])
    .stream()
    .pipeThrough(new DecompressionStream('gzip'))
  return new Response(stream).text()
}
