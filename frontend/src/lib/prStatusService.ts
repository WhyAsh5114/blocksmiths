interface PRStatus {
  state: 'open' | 'closed';
  merged: boolean;
  merged_at: string | null;
  closed_at: string | null;
  updated_at: string;
}

interface RedemptionInfo {
  canRedeem: boolean;
  baseValue: number; // ETH value based on current token economics
  rewardMultiplier: number; // Multiplier based on PR outcome
  totalValue: number; // Total ETH user would receive
  prStatus: 'open' | 'merged' | 'closed';
  statusMessage: string;
}

export class PRStatusService {
  private static BASE_URL = 'https://api.github.com';
  private static token = process.env.NEXT_PUBLIC_GITHUB_TOKEN;

  private static getHeaders() {
    return {
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
    };
  }

  /**
   * Check the status of a specific PR
   */
  static async checkPRStatus(repo: string, prNumber: number): Promise<PRStatus | null> {
    try {
      const [owner, repoName] = repo.split('/');
      if (!owner || !repoName) {
        throw new Error('Invalid repository format');
      }

      const response = await fetch(
        `${this.BASE_URL}/repos/${owner}/${repoName}/pulls/${prNumber}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null; // PR not found
        }
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const pr = await response.json();
      return {
        state: pr.state,
        merged: pr.merged || false,
        merged_at: pr.merged_at,
        closed_at: pr.closed_at,
        updated_at: pr.updated_at
      };
    } catch (error) {
      console.error('Error checking PR status:', error);
      return null;
    }
  }

  /**
   * Calculate redemption value for tokens based on PR status
   */
  static calculateRedemptionValue(
    tokenBalance: number,
    avgTokenPrice: number,
    prStatus: PRStatus | null,
    totalSupply: number,
    estimatedRewardPool: number = 0
  ): RedemptionInfo {
    const baseValue = tokenBalance * avgTokenPrice;
    let rewardMultiplier = 1.0;
    let statusMessage = '';
    let prStatusString: 'open' | 'merged' | 'closed' = 'open';

    if (!prStatus) {
      // PR not found or API error - allow redemption at base value
      statusMessage = 'PR status unknown - base redemption available';
      rewardMultiplier = 1.0;
    } else if (prStatus.merged) {
      // PR was merged - successful prediction, higher rewards
      statusMessage = 'PR merged successfully! Bonus rewards available';
      rewardMultiplier = 1.5; // 50% bonus for correct prediction
      prStatusString = 'merged';
    } else if (prStatus.state === 'closed') {
      // PR was closed without merging - partial rewards
      statusMessage = 'PR closed without merge - reduced redemption value';
      rewardMultiplier = 0.8; // 20% reduction
      prStatusString = 'closed';
    } else {
      // PR still open - normal redemption
      statusMessage = 'PR still open - standard redemption available';
      rewardMultiplier = 1.0;
      prStatusString = 'open';
    }

    // Calculate reward share from pool (proportional to holdings)
    const rewardShare = totalSupply > 0 ? (tokenBalance / totalSupply) * estimatedRewardPool : 0;
    const totalValue = (baseValue * rewardMultiplier) + rewardShare;

    return {
      canRedeem: true,
      baseValue,
      rewardMultiplier,
      totalValue: Math.max(0, totalValue), // Ensure non-negative
      prStatus: prStatusString,
      statusMessage
    };
  }

  /**
   * Get repository information
   */
  static async getRepositoryInfo(repo: string) {
    try {
      const [owner, repoName] = repo.split('/');
      const response = await fetch(
        `${this.BASE_URL}/repos/${owner}/${repoName}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`Repository not found: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching repository info:', error);
      return null;
    }
  }

  /**
   * Check if any PRs are still active for a repository
   */
  static async getActivePRs(repo: string): Promise<number[]> {
    try {
      const [owner, repoName] = repo.split('/');
      const response = await fetch(
        `${this.BASE_URL}/repos/${owner}/${repoName}/pulls?state=open&per_page=100`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        return [];
      }

      const prs = await response.json();
      return prs.map((pr: any) => pr.number);
    } catch (error) {
      console.error('Error fetching active PRs:', error);
      return [];
    }
  }
}

export default PRStatusService;