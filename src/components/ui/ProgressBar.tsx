import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const progressBarVariants = cva(
  'relative h-2 w-full overflow-hidden rounded-full bg-slate/10',
  {
    variants: {
      barSize: {
        sm: 'h-1',
        md: 'h-2',
        lg: 'h-4',
      },
    },
    defaultVariants: {
      barSize: 'md',
    },
  }
)

const indicatorVariants = cva(
  'h-full w-full flex-1 rounded-full transition-transform duration-500 ease-out',
  {
    variants: {
      color: {
        maple: 'bg-maple',
        forest: 'bg-forest-light',
        gold: 'bg-gold',
      },
    },
    defaultVariants: {
      color: 'maple',
    },
  }
)

export interface ProgressBarProps
  extends Omit<React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>, 'color'>,
    VariantProps<typeof progressBarVariants>,
    VariantProps<typeof indicatorVariants> {}

const ProgressBar = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressBarProps
>(({ className, value, color, barSize, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(progressBarVariants({ barSize }), className)}
    value={value}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(indicatorVariants({ color }))}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
ProgressBar.displayName = 'ProgressBar'

export { ProgressBar, progressBarVariants, indicatorVariants }
