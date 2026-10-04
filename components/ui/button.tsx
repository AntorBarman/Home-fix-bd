import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost";
};

export function Button({ className, variant = "default", ...props }: ButtonProps) {
  const variants = {
    default: "bg-accent text-accent-foreground hover:bg-accent/90",
    outline: "border border-border bg-transparent text-foreground hover:bg-muted",
    ghost: "bg-transparent text-foreground hover:bg-muted",
  };
  return <button className={cn("inline-flex min-h-11 items-center justify-center px-4 py-2 text-sm font-medium transition-colors", variants[variant], className)} {...props} />;
}
