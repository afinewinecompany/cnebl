import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex h-10 w-full rounded-md border bg-chalk px-4 py-2 font-body text-sm text-charcoal transition-all placeholder:text-charcoal-light disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      state: {
        default:
          "border-gray-200 focus:border-accent focus:outline-none focus:[box-shadow:0_0_0_3px_rgb(var(--accent)/0.15)]",
        error:
          "border-cardinal focus:border-cardinal focus:outline-none focus:[box-shadow:0_0_0_3px_rgb(var(--cardinal)/0.15)]",
      },
    },
    defaultVariants: {
      state: "default",
    },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, state, error, ...props }, ref) => {
    const computedState = error ? "error" : state;
    return (
      <input
        type={type}
        className={cn(inputVariants({ state: computedState, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input, inputVariants };
