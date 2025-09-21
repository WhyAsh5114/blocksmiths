import { useState, useEffect } from 'react';
import { Market } from '@/app/(app)/dashboard/types';

export interface GitHubPR {
  id: number;
  number: number;
  title: string;
  user: {
    login: string;
    avatar_url: string;
  };
  state: 'open' | 'closed';
  merged_at: string | null;
  created_at: string;
  updated_at: string;
  repository_url: string;
  html_url: string;
  draft: boolean;
  labels: Array<{
    name: string;
    color: string;
  }>;
  assignees: Array<{
    login: string;
    avatar_url: string;
  }>;
  comments: number;
  additions?: number;
  deletions?: number;
  changed_files?: number;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  description: string;
  stargazers_count: number;
  forks_count: number;
  language: string;
  topics: string[];
  updated_at: string;
}

interface UseGitHubAPIOptions {
  token?: string; // Optional GitHub personal access token for higher rate limits
}

export function useGitHubAPI(options: UseGitHubAPIOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseHeaders = {
    'Accept': 'application/vnd.github.v3+json',
    ...(options.token && { 'Authorization': `token ${options.token}` }),
  };

  // Fetch repository details
  const fetchRepository = async (owner: string, repo: string): Promise<GitHubRepo | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}`,
        { headers: baseHeaders }
      );
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch repository');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch pull requests for a repository
  const fetchPullRequests = async (
    owner: string, 
    repo: string, 
    state: 'open' | 'closed' | 'all' = 'open',
    per_page: number = 30
  ): Promise<GitHubPR[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls?state=${state}&per_page=${per_page}&sort=updated`,
        { headers: baseHeaders }
      );
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pull requests');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Search repositories
  const searchRepositories = async (
    query: string,
    sort: 'stars' | 'updated' | 'forks' = 'stars',
    per_page: number = 30
  ): Promise<GitHubRepo[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=${sort}&per_page=${per_page}`,
        { headers: baseHeaders }
      );
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.items || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search repositories');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Get trending repositories (using GitHub search with recent activity)
  const fetchTrendingRepositories = async (language?: string): Promise<GitHubRepo[]> => {
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dateStr = lastWeek.toISOString().split('T')[0];
    
    let query = `created:>${dateStr}`;
    if (language) {
      query += ` language:${language}`;
    }
    
    return await searchRepositories(query, 'stars');
  };

  return {
    isLoading,
    error,
    fetchRepository,
    fetchPullRequests,
    searchRepositories,
    fetchTrendingRepositories,
  };
}

// Convert GitHub PR data to our Market interface
export function convertPRToMarket(pr: GitHubPR, repoName: string): Market {
  // Calculate probability based on PR characteristics
  let probability = 50; // Base probability
  
  // Increase probability for:
  // - PRs with more comments (community engagement)
  // - PRs from repo owners/maintainers
  // - PRs with specific labels
  if (pr.comments > 5) probability += 15;
  if (pr.comments > 10) probability += 10;
  if (pr.labels.some(label => ['bug', 'enhancement', 'feature'].includes(label.name.toLowerCase()))) {
    probability += 10;
  }
  if (!pr.draft) probability += 10;
  
  // Calculate mock volume and change based on engagement
  const volume = Math.floor(Math.random() * 10000) + pr.comments * 100;
  const change = Math.floor(Math.random() * 50) + 10;
  
  // Calculate time left (mock implementation)
  const createdDate = new Date(pr.created_at);
  const daysSinceCreated = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  const estimatedDaysLeft = Math.max(1, 14 - daysSinceCreated); // Assume 2 week lifecycle
  
  return {
    id: pr.id,
    repo: repoName,
    prNumber: pr.number,
    title: pr.title,
    author: pr.user.login,
    probability: Math.min(95, probability),
    price: probability / 100,
    change,
    volume,
    status: pr.state === 'open' ? (pr.draft ? 'open' : 'review') : 'closed',
    tags: pr.labels.map(label => label.name).slice(0, 3), // First 3 labels
    timeLeft: `${estimatedDaysLeft}d`,
    participants: Math.floor(volume / 100), // Mock participants based on volume
  };
}

// Hook for managing GitHub-based markets
export function useGitHubMarkets() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const githubAPI = useGitHubAPI();

  // Load markets from popular repositories
  const loadTrendingMarkets = async () => {
    const trendingRepos = await githubAPI.fetchTrendingRepositories();
    const allMarkets: Market[] = [];

    for (const repo of trendingRepos.slice(0, 10)) { // Limit to 10 repos
      const prs = await githubAPI.fetchPullRequests(repo.owner.login, repo.name, 'open', 5);
      const repoMarkets = prs.map(pr => convertPRToMarket(pr, repo.full_name));
      allMarkets.push(...repoMarkets);
    }

    setMarkets(allMarkets);
    return allMarkets;
  };

  // Search for markets by repository
  const searchMarkets = async (query: string): Promise<Market[]> => {
    const repos = await githubAPI.searchRepositories(query);
    const allMarkets: Market[] = [];

    for (const repo of repos.slice(0, 5)) { // Limit to 5 repos
      const prs = await githubAPI.fetchPullRequests(repo.owner.login, repo.name, 'open', 5);
      const repoMarkets = prs.map(pr => convertPRToMarket(pr, repo.full_name));
      allMarkets.push(...repoMarkets);
    }

    return allMarkets;
  };

  return {
    markets,
    isLoading: githubAPI.isLoading,
    error: githubAPI.error,
    loadTrendingMarkets,
    searchMarkets,
  };
}