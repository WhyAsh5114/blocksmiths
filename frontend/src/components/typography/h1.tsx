import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TypographyH1Props {
  children: ReactNode;
  className?: string;
}

export default function TypographyH1({ children, className }: TypographyH1Props) {
  return (
    <h1 className={cn("scroll-m-20 text-4xl font-extrabold tracking-tight", className)}>
      {children}
    </h1>
  );
}
