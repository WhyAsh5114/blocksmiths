"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lockAbi, lockBytecode } from "@/lib/wagmi-generated";
import { LoaderCircle } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { parseEther } from "viem";
import { useDeployContract } from "wagmi";

export function DeployContract() {
  const { isPending, data: hash, deployContractAsync } = useDeployContract();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const unlockTimeString = formData.get("unlockTime") as string;
    const unlockTime = new Date(unlockTimeString).getTime() / 1000;
    const amount = parseEther(formData.get("amount") as string);

    await deployContractAsync({
      abi: lockAbi,
      bytecode: lockBytecode,
      args: [BigInt(unlockTime)],
      value: amount,
    });
  }

  useEffect(() => {
    if (!hash) return;
    toast.success("Contract deployed", { description: hash });
  }, [hash]);

  return (
    <form onSubmit={submit} className="max-w-sm space-y-2">
      <Card>
        <CardHeader>
          <CardTitle>Deploy contract</CardTitle>
          <CardDescription>Enter the constructor parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="amount">Unlock time</Label>
            <Input name="unlockTime" type="datetime-local" required />
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="amount">Lock amount (in ETH)</Label>
            <Input
              name="amount"
              type="number"
              placeholder="0.01"
              step={0.00001}
              required
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="ml-auto" disabled={isPending} type="submit">
            {isPending ? (
              <>
                <LoaderCircle className="animate-spin" />
                Confirming
              </>
            ) : (
              "Deploy"
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
