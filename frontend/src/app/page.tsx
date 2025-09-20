"use client";

import TypographyH1 from "@/components/typography/h1";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col gap-4 items-center p-4">
      <TypographyH1>Landing page</TypographyH1>
      <Button asChild>
        <Link href="/dashboard">Enter the app</Link>
      </Button>
    </div>
  );
}
