import { cn } from '~/lib/cn'
import { type InputHTMLAttributes, forwardRef, type ReactNode } from 'react'
import { type VariantProps, cva, cx } from 'class-variance-authority'

const inputVariants = cva(
  'flex w-full text-foreground aria-[invalid]:border-destructive rounded-lg text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-placeholder placeholder:font-light disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        default:
          'h-10 px-3 py-2 border border-input bg-background ring-offset-background disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        info: 'h-4 bg-foreground disabled cursor-default focus:outline-none pl-2 font-semibold',
        highlight:
          'bg-green-2 h-10 px-3 disabled cursor-default focus:outline-none'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
)

type InputProps = InputHTMLAttributes<HTMLInputElement> &
  VariantProps<typeof inputVariants> & {
    trailing?: ReactNode
  }

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, type, trailing, ...props }, ref) => {
    return (
      <>
        <div className="flex">
          <input
            type={type}
            className={cx(
              trailing && 'rounded-r-none',
              cn(inputVariants({ variant, className }))
            )}
            ref={ref}
            {...props}
          />
          {trailing ? (
            <span className="inline-flex items-center whitespace-pre rounded-r-lg bg-green-2 px-3">
              {trailing}
            </span>
          ) : null}
        </div>
      </>
    )
  }
)
Input.displayName = 'Input'
