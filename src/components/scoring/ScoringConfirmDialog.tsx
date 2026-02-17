"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DialogVariant = "danger" | "warning" | "info" | "success";

export interface ScoringConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
  isLoading?: boolean;
}

const variantConfig: Record<
  DialogVariant,
  { icon: React.ElementType; iconBg: string; iconColor: string; buttonVariant: "danger" | "success" | "default" }
> = {
  danger: {
    icon: AlertTriangle,
    iconBg: "bg-cardinal/10",
    iconColor: "text-cardinal",
    buttonVariant: "danger",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-gold/10",
    iconColor: "text-gold",
    buttonVariant: "default",
  },
  info: {
    icon: Info,
    iconBg: "bg-navy/10",
    iconColor: "text-navy",
    buttonVariant: "default",
  },
  success: {
    icon: CheckCircle,
    iconBg: "bg-field/10",
    iconColor: "text-field",
    buttonVariant: "success",
  },
};

/**
 * ScoringConfirmDialog Component
 * Modal dialog for confirming scoring actions
 *
 * Features:
 * - Animated entrance/exit with framer-motion
 * - Large touch targets for mobile use
 * - Multiple variants for different action types
 * - Loading state support
 *
 * @example
 * <ScoringConfirmDialog
 *   isOpen={showDialog}
 *   onClose={() => setShowDialog(false)}
 *   onConfirm={handleEndGame}
 *   title="End Game?"
 *   message="This will mark the game as final. This action cannot be undone."
 *   confirmText="End Game"
 *   variant="danger"
 * />
 */
export function ScoringConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "warning",
  isLoading = false,
}: ScoringConfirmDialogProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  // Prevent body scroll when dialog is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, isLoading, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-navy/60 backdrop-blur-sm"
            onClick={!isLoading ? onClose : undefined}
            aria-hidden="true"
          />

          {/* Dialog Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              disabled={isLoading}
              className={cn(
                "absolute top-4 right-4 p-2 rounded-lg transition-colors",
                "hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-navy/20",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "min-w-[48px] min-h-[48px] flex items-center justify-center"
              )}
              aria-label="Close dialog"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>

            {/* Content */}
            <div className="p-6 pt-8">
              {/* Icon */}
              <div
                className={cn(
                  "mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4",
                  config.iconBg
                )}
              >
                <Icon className={cn("h-8 w-8", config.iconColor)} />
              </div>

              {/* Title */}
              <h2
                id="dialog-title"
                className="text-xl font-headline font-semibold text-navy text-center mb-2"
              >
                {title}
              </h2>

              {/* Message */}
              <p className="text-gray-600 text-center mb-6">{message}</p>

              {/* Actions - Large touch targets */}
              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 min-h-[52px] text-base"
                >
                  {cancelText}
                </Button>
                <Button
                  variant={config.buttonVariant}
                  size="lg"
                  onClick={onConfirm}
                  disabled={isLoading}
                  className="flex-1 min-h-[52px] text-base"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    confirmText
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default ScoringConfirmDialog;
