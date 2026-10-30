import type { ImgHTMLAttributes } from 'react'

export const InterledgerLogo = ({
  alt = 'Interledger',
  ...props
}: Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'>) => {
  return (
    <img
      src="/interledger-logo.png"
      alt={alt}
      width={201}
      height={200}
      {...props}
    />
  )
}
