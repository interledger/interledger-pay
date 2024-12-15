import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { Button } from './button'
import { Share } from '../icons'

export interface ShareButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  url: string
  size?: string
  variant?: 'default' | 'outline' | 'input'
}

export const ShareButton = forwardRef<HTMLButtonElement, ShareButtonProps>(
  ({ url, size, variant, ...props }, ref) => {
    return (
      <Button
        size="sm"
        variant={variant}
        onClick={(e: any) => {
          e.preventDefault()
          navigator.share({
            title: 'Payment link',
            text: 'Interledger Pay payment link:',
            url: url
          })
        }}
        {...props}
      >
        {' '}
        <div className="flex items-center justify-center">
          <Share className="m-0.5 h-5 w-5" />
        </div>
      </Button>
    )
  }
)
ShareButton.displayName = 'ShareButton'
