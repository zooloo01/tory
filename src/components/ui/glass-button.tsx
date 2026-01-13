import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import React from "react";
import { Loader2 } from "lucide-react";

interface GlassButtonProps extends HTMLMotionProps<"button"> {
    variant?: "primary" | "secondary" | "ghost" | "danger";
    size?: "sm" | "md" | "lg" | "icon";
    isLoading?: boolean;
    children?: React.ReactNode;
}

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
    ({ className, children, variant = "primary", size = "md", isLoading, disabled, ...props }, ref) => {
        const variants = {
            primary: "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90",
            secondary: "glass glass-hover text-foreground",
            ghost: "hover:bg-surface/50 text-foreground/80 hover:text-foreground",
            danger: "bg-red-500 text-white shadow-lg shadow-red-500/25 hover:bg-red-600",
        };

        const sizes = {
            sm: "h-9 px-4 text-xs rounded-lg",
            md: "h-12 px-6 text-sm rounded-xl",
            lg: "h-14 px-8 text-base rounded-2xl",
            icon: "h-12 w-12 p-0 rounded-xl flex items-center justify-center",
        };

        return (
            <motion.button
                ref={ref}
                whileTap={{ scale: 0.96 }}
                className={cn(
                    "relative inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50",
                    variants[variant],
                    sizes[size],
                    className
                )}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
                {/* Glossy highlight for primary buttons */}
                {variant === "primary" && (
                    <div className="absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/20 pointer-events-none">
                        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-50" />
                        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-black/10 to-transparent opacity-20" />
                    </div>
                )}
            </motion.button>
        );
    }
);
GlassButton.displayName = "GlassButton";
