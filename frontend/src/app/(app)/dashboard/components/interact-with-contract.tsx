"use client";

import TypographyH2 from "@/components/typography/h2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lockAbi } from "@/lib/wagmi-generated";
import { useEffect, useState } from "react";
import { useReadContracts, useWriteContract } from "wagmi";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

export function InteractWithContract() {
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [canUnlock, setCanUnlock] = useState<boolean>(false);

  const contractBaseConfig = (() => {
    return {
      abi: lockAbi,
      address: contractAddress as `0x${string}`,
    } as const;
  })();

  const {
    data: readData,
    isLoading,
    error,
    isError,
  } = useReadContracts({
    contracts: [
      { ...contractBaseConfig, functionName: "unlockTime" },
      { ...contractBaseConfig, functionName: "owner" }
    ],
    query: { enabled: contractBaseConfig.address?.startsWith(`0x`) },
  });

  useEffect(() => {
    if (!readData) return;
    if (readData[0].error || readData[1].error) {
      toast.error("An error occurred reading contract");
      console.error("Read errors:", readData[0].error?.message, readData[1].error?.message);
      return;
    }

    const unlockTime = readData[0]?.result as bigint;
    const owner = readData[1]?.result as string;
    const unlockDate = new Date(Number(unlockTime) * 1000);
    setCanUnlock(unlockDate < new Date());

    toast.success("Read contract successfully", {
      description: (
        <div>
          <p><strong>Owner:</strong> {owner}</p>
          <p><strong>Unlock time:</strong> {unlockDate.toLocaleString()}</p>
          <p><strong>Status:</strong> {canUnlock ? "Can be unlocked now" : "Contract is still locked"}</p>
        </div>
      ),
    });
  }, [readData, canUnlock]);

  const { data: hash, writeContract, isPending } = useWriteContract();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const address = formData.get("contract-address") as string;

    if (!address?.startsWith("0x")) return;
    setContractAddress(address);
  }

  async function withdrawFromContract() {
    writeContract({
      address: contractAddress as `0x${string}`,
      abi: lockAbi,
      functionName: "withdraw",
    });
  }

  useEffect(() => {
    if (!hash) return;
    toast.success("Withdraw initiated", { description: hash });
  }, [hash]);

  return (
    <>
      <form
        className="grid w-full max-w-sm items-center gap-1.5"
        onSubmit={handleSubmit}
      >
        <Card>
          <CardHeader>
            <CardTitle>Interact with contract</CardTitle>
            <CardDescription>
              Call read functions for metadata using RPC, and also call withdraw
              function through wallet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <Label htmlFor="contract-address">Contract address</Label>
            <Input name="contract-address" />
          </CardContent>
          <CardFooter>
            <Button type="submit" variant="secondary" disabled={isLoading}>
              {isLoading ? (
                <>
                  <LoaderCircle className="animate-spin" />
                  Reading
                </>
              ) : (
                "Read data"
              )}
            </Button>
            <Button
              type="button"
              onClick={withdrawFromContract}
              className="ml-auto"
              disabled={isPending || !canUnlock}
            >
              {isPending ? (
                <>
                  <LoaderCircle className="animate-spin" />
                  Withdrawing
                </>
              ) : (
                "Withdraw"
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </>
  );
}
