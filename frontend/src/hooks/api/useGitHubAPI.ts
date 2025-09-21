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

  // Get token from environment if not provided
  const token = options.token || process.env.NEXT_PUBLIC_GITHUB_TOKEN;
  
  const baseHeaders = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(token && { 'Authorization': `Bearer ${token}` }),
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
        if (response.status === 403) {
          throw new Error('GitHub API rate limit exceeded. Please add a GitHub token to your .env.local file.');
        } else if (response.status === 404) {
          throw new Error(`Repository ${owner}/${repo} not found.`);
        } else {
          throw new Error(`GitHub API error: ${response.status} - ${response.statusText}`);
        }
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
        if (response.status === 403) {
          throw new Error('GitHub API rate limit exceeded. Please add a GitHub token to your .env.local file.');
        } else if (response.status === 404) {
          throw new Error(`Repository ${owner}/${repo} not found.`);
        } else {
          throw new Error(`GitHub API error: ${response.status} - ${response.statusText}`);
        }
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
        if (response.status === 403) {
          throw new Error('GitHub API rate limit exceeded. Please add a GitHub token to your .env.local file.');
        } else if (response.status === 422) {
          throw new Error('Invalid search query. Please try a different search term.');
        } else {
          throw new Error(`GitHub API error: ${response.status} - ${response.statusText}`);
        }
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
  // Create a deterministic seed based on PR ID to ensure consistent values
  const seed = pr.id;
  const seedRandom = (multiplier: number) => {
    const x = Math.sin(seed * multiplier) * 10000;
    return x - Math.floor(x);
  };

  // Calculate probability based on real PR characteristics
  let probability = 45; // Base probability
  
  // Increase probability based on real indicators:
  if (pr.comments > 5) probability += 10;
  if (pr.comments > 10) probability += 5;
  if (pr.comments > 20) probability += 5;
  
  // Check for positive indicators in labels
  const positiveLabels = ['enhancement', 'feature', 'bug', 'documentation', 'good first issue'];
  const negativeLabels = ['wip', 'draft', 'blocked', 'needs-review'];
  
  const hasPositiveLabel = pr.labels.some(label => 
    positiveLabels.some(pos => label.name.toLowerCase().includes(pos))
  );
  const hasNegativeLabel = pr.labels.some(label => 
    negativeLabels.some(neg => label.name.toLowerCase().includes(neg))
  );
  
  if (hasPositiveLabel) probability += 10;
  if (hasNegativeLabel) probability -= 5;
  if (!pr.draft) probability += 5;
  if (pr.assignees.length > 0) probability += 5;
  
  // Factor in PR age - newer PRs might be more likely to be merged
  const createdDate = new Date(pr.created_at);
  const daysSinceCreated = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysSinceCreated < 7) probability += 5; // Fresh PRs
  if (daysSinceCreated > 30) probability -= 10; // Old PRs might be stale
  
  // Ensure probability stays within bounds
  probability = Math.max(5, Math.min(90, probability));
  
  // Calculate realistic volume based on repository activity and PR engagement (deterministic)
  const baseVolume = Math.max(100, pr.comments * 50);
  const volumeVariation = seedRandom(1.23) * 0.5 + 0.75; // 75% to 125% variation, but consistent
  const volume = Math.floor(baseVolume * volumeVariation);
  
  // Calculate change percentage based on recent activity (deterministic)
  const updatedDate = new Date(pr.updated_at);
  const hoursSinceUpdated = Math.floor((Date.now() - updatedDate.getTime()) / (1000 * 60 * 60));
  
  let change = 0;
  if (hoursSinceUpdated < 24) {
    change = Math.floor(seedRandom(2.34) * 15) + 5; // Recent activity = positive change
  } else if (hoursSinceUpdated < 72) {
    change = Math.floor(seedRandom(3.45) * 10) - 5; // Moderate change
  } else {
    change = Math.floor(seedRandom(4.56) * 8) - 4; // Older = smaller change
  }
  
  // Calculate realistic time left based on PR age and activity
  let estimatedDaysLeft = 7; // Default estimate
  if (daysSinceCreated < 3) estimatedDaysLeft = 10; // Fresh PRs have more time
  else if (daysSinceCreated < 14) estimatedDaysLeft = 7;
  else if (daysSinceCreated < 30) estimatedDaysLeft = 3;
  else estimatedDaysLeft = 1; // Old PRs should resolve soon
  
  // Calculate participants based on engagement
  const participants = Math.max(1, Math.floor(pr.comments * 0.3) + pr.assignees.length + 1);

  return {
    id: pr.id,
    repo: repoName,
    prNumber: pr.number,
    title: pr.title,
    author: pr.user.login,
    probability,
    price: probability / 100,
    change,
    volume,
    status: pr.state === 'open' ? (pr.draft ? 'open' : 'review') : 'closed',
    tags: pr.labels.map(label => label.name).slice(0, 3), // First 3 labels
    timeLeft: `${estimatedDaysLeft}d`,
    participants,
  };
}

// Hook for managing GitHub-based markets
export function useGitHubMarkets() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const githubAPI = useGitHubAPI();

  // Predefined list of popular repositories with active PRs
  const popularRepos = [
    'facebook/react',
    'microsoft/typescript',
    'nodejs/node',
    'vercel/next.js',
    'microsoft/vscode',
    'angular/angular',
    'vuejs/vue',
    'tensorflow/tensorflow',
    'kubernetes/kubernetes',
    'golang/go',
    'rust-lang/rust',
    'python/cpython',
  ];

  // Load markets from popular repositories and trending repos
  const loadTrendingMarkets = async () => {
    try {
      const allMarkets: Market[] = [];

      // First, try to get some trending repositories
      const trendingRepos = await githubAPI.fetchTrendingRepositories();
      const reposToProcess = [...popularRepos];
      
      // Add some trending repos if we got them successfully
      if (trendingRepos.length > 0) {
        const trendingRepoNames = trendingRepos
          .slice(0, 5)
          .map(repo => repo.full_name);
        reposToProcess.push(...trendingRepoNames);
      }

      // Process repositories in smaller batches to avoid rate limiting
      const batchSize = 3;
      for (let i = 0; i < Math.min(reposToProcess.length, 9); i += batchSize) {
        const batch = reposToProcess.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (repoName) => {
          const [owner, repo] = repoName.split('/');
          if (!owner || !repo) return [];
          
          try {
            const prs = await githubAPI.fetchPullRequests(owner, repo, 'open', 3);
            return prs.map(pr => convertPRToMarket(pr, repoName));
          } catch (error) {
            console.warn(`Failed to fetch PRs for ${repoName}:`, error);
            return [];
          }
        });

        const batchResults = await Promise.all(batchPromises);
        const batchMarkets = batchResults.flat();
        allMarkets.push(...batchMarkets);

        // Add a small delay between batches to be nice to the API
        if (i + batchSize < reposToProcess.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      setMarkets(allMarkets);
      return allMarkets;
    } catch (error) {
      console.error('Error loading trending markets:', error);
      throw error;
    }
  };

  // Search for markets by repository with better error handling
  const searchMarkets = async (query: string): Promise<Market[]> => {
    try {
      // If query looks like a specific repo (owner/repo), fetch it directly
      if (query.includes('/') && query.split('/').length === 2) {
        const [owner, repo] = query.split('/');
        const prs = await githubAPI.fetchPullRequests(owner, repo, 'open', 10);
        return prs.map(pr => convertPRToMarket(pr, query));
      }

      // Otherwise, search for repositories and get their PRs
      const repos = await githubAPI.searchRepositories(query, 'stars', 10);
      const allMarkets: Market[] = [];

      // Process first 3 repositories to avoid rate limiting
      for (const repo of repos.slice(0, 3)) {
        try {
          const prs = await githubAPI.fetchPullRequests(repo.owner.login, repo.name, 'open', 5);
          const repoMarkets = prs.map(pr => convertPRToMarket(pr, repo.full_name));
          allMarkets.push(...repoMarkets);
        } catch (error) {
          console.warn(`Failed to fetch PRs for ${repo.full_name}:`, error);
        }
      }

      return allMarkets;
    } catch (error) {
      console.error('Error searching markets:', error);
      throw error;
    }
  };

  return {
    markets,
    isLoading: githubAPI.isLoading,
    error: githubAPI.error,
    loadTrendingMarkets,
    searchMarkets,
  };
}