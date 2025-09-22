import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { projectCoinFactoryAbi, projectCoinAbi } from "@/lib/wagmi-generated";
import { parseEther, formatEther } from "viem";
import { useEffect } from "react";

// Factory contract address (update this after deployment)
const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS;

export interface ProjectInfo {
  tokenAddress: string;
  name: string;
  symbol: string;
  githubOwner: string;
  githubRepo: string;
  creator: string;
  createdAt: bigint;
  isActive: boolean;
}

export function useProjectCoinFactory() {
  // Check if factory address is configured
  if (!FACTORY_ADDRESS) {
    return {
      allProjects: [],
      isLoadingProjects: false,
      isPending: false,
      isConfirming: false,
      isSuccess: false,
      createProjectCoin: () => {},
      searchProjectsByRepo: () => [],
      hash: undefined,
      contractError:
        "Factory contract address not configured. Please check your environment variables.",
      writeError: null,
    };
  }

  // Read functions - only if we have a valid factory address
  const {
    data: allProjectsData,
    isLoading: isLoadingProjects,
    error: contractError,
  } = useReadContract({
    address: FACTORY_ADDRESS as `0x${string}`,
    abi: projectCoinFactoryAbi,
    functionName: "getAllProjects",
    args: [BigInt(0), BigInt(100)], // offset: 0, limit: 100
    query: {
      // Handle empty contract state gracefully
      retry: false,
    },
  });

  // Extract projects array from the returned tuple, handle empty state gracefully
  const allProjects = allProjectsData
    ? (allProjectsData as readonly [ProjectInfo[], bigint])[0]
    : [];

  // Create a user-friendly error message for common issues
  const getUserFriendlyError = (error: any): string | null => {
    if (!error) return null;

    const errorMessage = error.message || error.toString();

    // Handle the specific case of no data returned (empty contract)
    if (
      errorMessage.includes('returned no data ("0x")') ||
      errorMessage.includes("getAllProjects")
    ) {
      return null; // This is normal when no projects exist yet
    }

    // Handle network connectivity issues
    if (
      errorMessage.includes("Failed to fetch") ||
      errorMessage.includes("network")
    ) {
      return "Unable to connect to the blockchain network. Please check your connection and try again.";
    }

    // Handle rate limiting
    if (errorMessage.includes("rate limit")) {
      return "Too many requests. Please wait a moment and try again.";
    }

    // Handle wallet connection issues
    if (errorMessage.includes("wallet") || errorMessage.includes("account")) {
      return "Wallet connection issue. Please check your wallet and try again.";
    }

    // For other errors, return a generic message
    return "Unable to load contract data. Please try again later.";
  };

  const friendlyError = getUserFriendlyError(contractError);

  const {
    writeContract,
    data: hash,
    isPending,
    error: writeError,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Create a new project coin
  const createProjectCoin = async (
    repository: string,
    name: string,
    symbol: string,
    treasury: string = "0x0000000000000000000000000000000000000000",
    rewardPool: string = "0x0000000000000000000000000000000000000000"
  ) => {
    const [owner, repo] = repository.split("/");

    writeContract({
      address: FACTORY_ADDRESS as `0x${string}`,
      abi: projectCoinFactoryAbi,
      functionName: "createProjectCoin",
      args: [
        name,
        symbol,
        owner,
        repo,
        treasury as `0x${string}`,
        rewardPool as `0x${string}`,
      ],
    });
  };

  // Search projects by repository
  const searchProjectsByRepo = (searchTerm: string): ProjectInfo[] => {
    if (!allProjects) return [];
    return allProjects.filter((project) =>
      `${project.githubOwner}/${project.githubRepo}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  };

  return {
    // Data
    allProjects: allProjects as ProjectInfo[] | undefined,

    // Loading states
    isLoadingProjects,
    isPending,
    isConfirming,
    isSuccess,

    // Functions
    createProjectCoin,
    searchProjectsByRepo,

    // Transaction hash
    hash,

    // Error handling - use friendly error messages
    contractError: friendlyError,
    writeError: writeError?.message,
  };
}

export function useProjectCoinContract(
  tokenAddress: string,
  mintAmount?: string
) {
  // Skip contract calls if no token address is provided
  const isValidAddress = Boolean(tokenAddress && tokenAddress !== "");
  const validMintAmount = Boolean(mintAmount && parseFloat(mintAmount) > 0);

  const { data: totalSupply, refetch: refetchTotalSupply } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: projectCoinAbi, // Use the individual token ABI
    functionName: "totalSupply",
    query: { enabled: isValidAddress },
  });

  const { data: name, refetch: refetchName } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: projectCoinAbi,
    functionName: "name",
    query: { enabled: isValidAddress },
  });

  const { data: symbol, refetch: refetchSymbol } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: projectCoinAbi,
    functionName: "symbol",
    query: { enabled: isValidAddress },
  });

  // Get current mint price from contract
  const { data: currentMintPrice, refetch: refetchMintPrice } = useReadContract(
    {
      address: tokenAddress as `0x${string}`,
      abi: projectCoinAbi,
      functionName: "mintPrice",
      query: { enabled: isValidAddress },
    }
  );

  // Calculate mint cost for the provided amount
  const { data: mintCost, refetch: refetchMintCost } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: projectCoinAbi,
    functionName: "calculateMintCost",
    args: [parseEther(mintAmount || "0")],
    query: { enabled: isValidAddress && validMintAmount },
  });

  const {
    writeContract,
    data: hash,
    isPending,
    error: writeError,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Refetch data when transaction is successful
  useEffect(() => {
    if (isSuccess) {
      refetchTotalSupply();
      refetchName();
      refetchSymbol();
      refetchMintPrice();
      refetchMintCost();
    }
  }, [
    isSuccess,
    refetchTotalSupply,
    refetchName,
    refetchSymbol,
    refetchMintPrice,
    refetchMintCost,
  ]);

  // Function to manually refresh all data
  const refreshData = () => {
    refetchTotalSupply();
    refetchName();
    refetchSymbol();
    refetchMintPrice();
    refetchMintCost();
  };

  // Mint tokens
  const mintTokens = async (amount: string) => {
    if (!isValidAddress) {
      throw new Error("No token address provided");
    }

    if (!amount || parseFloat(amount) <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    // Use the current mint cost if available, otherwise we need to fetch it
    if (!mintCost) {
      throw new Error("Unable to calculate mint cost");
    }

    writeContract({
      address: tokenAddress as `0x${string}`,
      abi: projectCoinAbi,
      functionName: "mintTokens",
      args: [parseEther(amount)],
      value: mintCost as bigint,
    });
  };

  return {
    // Token info
    totalSupply: totalSupply ? formatEther(totalSupply as bigint) : "0",
    name: name as string,
    symbol: symbol as string,
    mintCost: mintCost ? formatEther(mintCost as bigint) : "0",
    currentMintPrice: currentMintPrice
      ? formatEther(currentMintPrice as bigint)
      : "0.001",

    // Loading states
    isPending,
    isConfirming,
    isSuccess,

    // Functions
    mintTokens,
    refreshData,

    // Transaction hash
    hash,

    // Error handling
    writeError: writeError?.message,
  };
}
