import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md font-headline text-sm font-semibold tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-navy text-chalk shadow-sm hover:-translate-y-[1px] hover:shadow-md active:translate-y-0 active:scale-[0.98]",
        secondary:
          "bg-gray-100 text-charcoal shadow-sm hover:-translate-y-[1px] hover:bg-gray-200 hover:shadow-md active:translate-y-0 active:scale-[0.98]",
        outline:
          "border-2 border-navy bg-transparent text-navy hover:-translate-y-[1px] hover:bg-navy hover:text-chalk hover:shadow-md active:translate-y-0 active:scale-[0.98]",
        ghost:
          "bg-transparent text-charcoal hover:bg-gray-100 active:scale-[0.98]",
        danger:
          "bg-cardinal text-chalk shadow-sm hover:-translate-y-[1px] hover:bg-cardinal-light hover:shadow-md active:translate-y-0 active:scale-[0.98]",
        success:
          "bg-field text-chalk shadow-sm hover:-translate-y-[1px] hover:bg-field-light hover:shadow-md active:translate-y-0 active:scale-[0.98]",
        link:
          "text-navy underline-offset-4 hover:underline",
      },
      size: {
        xs: "h-7 px-2.5 text-xs",
        sm: "h-8 px-4 text-xs",
        default: "h-10 px-6 py-2",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
