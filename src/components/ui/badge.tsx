import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full font-headline font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-gray-100 text-charcoal",
        primary: "bg-navy text-chalk",
        secondary: "bg-gray-200 text-charcoal-dark",
        success: "bg-field text-chalk",
        warning: "bg-gold text-charcoal-dark",
        danger: "bg-cardinal text-chalk",
        outline: "border-2 border-gray-300 bg-transparent text-charcoal",
        gold: "bg-gold text-charcoal-dark uppercase tracking-wide",
        silver: "bg-gray-300 text-charcoal-dark uppercase tracking-wide",
        bronze: "bg-amber-600 text-chalk uppercase tracking-wide",
        live: "bg-cardinal text-chalk uppercase tracking-wide animate-pulse",
      },
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        default: "px-3 py-1 text-xs",
        lg: "px-4 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
