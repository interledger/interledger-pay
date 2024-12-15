import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '~/lib/cn'

const buttonVariants = cva(
  'inline-flex px-4 py-2 cursor-pointer rounded-full items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-green-1 text-white hover:bg-green-3 hover:text-green-4',
        destructive:
          'bg-destructive text-white hover:bg-destructive-1 hover:text-white',
        outline:
          'border border-green-1 text-green-1 bg-foreground hover:bg-green-3 hover:text-green-4 hover:border-green-3',
        outline_destructive:
          'border border-destructive text-destructive bg-foreground hover:bg-destructive hover:text-white',
        input: 'hover:bg-green-3 hover:text-green-4'
      },
      size: {
        default: 'w-48',
        sm: 'w-40',
        lg: 'w-48',
        xl: 'w-full',
        icon: 'h-10 w-10'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
