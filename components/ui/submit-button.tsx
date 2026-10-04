"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SubmitButtonProps = ButtonProps & {
  pendingText?: string;
  children: React.ReactNode;
};

export function SubmitButton({ children, pendingText, className, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending} className={cn("relative", className)} aria-busy={pending} {...props}>
    {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
    {pending ? (pendingText ?? "অপেক্ষা করুন...") : children}
  </Button>;
}
