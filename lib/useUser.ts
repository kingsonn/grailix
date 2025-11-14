import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import type { User } from "@/types/supabase";

/**
 * Fetch user profile from API
 */
async function fetchUserProfile(walletAddress: string): Promise<User> {
  const response = await fetch(`/api/profile?wallet_address=${walletAddress}`);
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || "Failed to fetch user profile");
  }

  return data.data.user;
}

/**
 * Custom hook to fetch and manage user profile
 * Automatically fetches user data when wallet is connected
 */
export function useUser() {
  const { address, isConnected } = useAccount();

  const query = useQuery({
    queryKey: ["user", address],
    queryFn: () => fetchUserProfile(address!),
    enabled: isConnected && !!address,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });

  return {
    user: query.data,
    isLoading: query.isLoading,
    error: query.error,
    isConnected,
    address,
    refetch: query.refetch,
  };
}
