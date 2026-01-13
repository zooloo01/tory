import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import React from "react";

export interface GlassInputProps
    extends HTMLMotionProps<"input"> {
    icon?: React.ReactNode;
    error?: boolean;
}

export const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
    ({ className, type, icon, error, ...props }, ref) => {
        return (
            <div className="relative w-full">
                <motion.input
                    initial={false}
                    animate={error ? { x: [-2, 2, -2, 2, 0] } : {}}
                    transition={{ duration: 0.4 }}
                    type={type}
                    className={cn(
                        "glass flex h-12 w-full rounded-xl bg-surface/50 px-4 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
                        icon && "pl-11",
                        error && "border-red-500 focus-visible:ring-red-500/50",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                        {icon}
                    </div>
                )}
            </div>
        );
    }
);
GlassInput.displayName = "GlassInput";
