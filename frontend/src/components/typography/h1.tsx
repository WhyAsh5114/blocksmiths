import type { ReactNode } from "react";

export default function TypographyH1({ children }: { children: ReactNode }) {
  return (
    <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight">
      {children}
    </h1>
  );
}
