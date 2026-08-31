import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    // Prevent forwarding non-standard props like `loading` to the DOM
    const { loading, children, ...restProps } = props as any
    const Comp = asChild ? Slot : "button"

    const spinner = loading ? (
      <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
      </svg>
    ) : null

    if (asChild) {
      // When using Slot, we must provide a single React element child. If loading is active
      // we clone that child and inject the spinner before its children.
      try {
        const child = React.Children.only(children) as React.ReactElement<any, any>
        if (loading) {
          const merged = React.cloneElement(child, undefined, <>{spinner}{(child.props as any).children}</>)
          return (
            <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...restProps}>
              {merged}
            </Comp>
          )
        }
        return (
          <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...restProps}>
            {child}
          </Comp>
        )
      } catch (e) {
        // If children is not a single element, fall back to rendering without Slot to avoid crash
        return (
          <button className={cn(buttonVariants({ variant, size, className }))} ref={ref as any} {...restProps}>
            {spinner}
            {children}
          </button>
        )
      }
    }

    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...restProps}>
        {spinner}
        {children}
      </Comp>
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
