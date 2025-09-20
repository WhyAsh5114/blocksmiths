"use client";

import TypographyH1 from "@/components/typography/h1";
import { DeployContract } from "./components/deploy-contract";
import { InteractWithContract } from "./components/interact-with-contract";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Geist, Geist_Mono } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"] });
const geistMono = Geist_Mono({ subsets: ["latin"] });

function App() {
  return (
    <>
      <TypographyH1>Lock contract testing</TypographyH1>
      <p className={cn("max-w-sm", geist.className)}>
        The lock contract is the default contract created by running{" "}
        <code className={cn("px-2", geistMono.className)}>
          npx hardhat init
        </code>
        <br />
        <br />
        It basically takes some amount of ETH and an{" "}
        <code className={geistMono.className}>unlockTime</code> during
        deployment, and <i>locks</i> it till said unlockTime.
        <br />
        <br />
        After the unlockTime has passed, the owner can call the{" "}
        <code className={geistMono.className}>withdraw()</code> function to get
        the locked ETH back.
      </p>
      <Tabs defaultValue="deploy" className="w-full max-w-sm">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="deploy">Deploy</TabsTrigger>
          <TabsTrigger value="interact">Interact</TabsTrigger>
        </TabsList>
        <TabsContent value="deploy">
          <DeployContract />
        </TabsContent>
        <TabsContent value="interact">
          <InteractWithContract />
        </TabsContent>
      </Tabs>
    </>
  );
}

export default App;
