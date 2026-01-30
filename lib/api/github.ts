/**
 * GitHub API integration for fetching issues and PRs
 * Handles rate limiting and error scenarios
 */

// GitHub API types
export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  labels: Array<{
    id: number;
    name: string;
    color: string;
  }>;
  assignee: {
    login: string;
  } | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  url: string;
  html_url: string;
  user: {
    login: string;
  };
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  labels: Array<{
    id: number;
    name: string;
    color: string;
  }>;
  assignee: {
    login: string;
  } | null;
  draft: boolean;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  url: string;
  html_url: string;
  user: {
    login: string;
  };
}

export interface GitHubApiError extends Error {
  status: number;
  rateLimitRemaining?: number;
  rateLimitReset?: number;
}

// Rate limit tracking
interface RateLimitInfo {
  remaining: number;
  reset: number;
  limit: number;
}

let rateLimitInfo: RateLimitInfo = {
  remaining: 60,
  reset: 0,
  limit: 60,
};

/**
 * Handle GitHub API response headers for rate limiting
 */
function updateRateLimit(headers: Headers): void {
  const remaining = headers.get('x-ratelimit-remaining');
  const reset = headers.get('x-ratelimit-reset');
  const limit = headers.get('x-ratelimit-limit');

  if (remaining !== null) {
    rateLimitInfo.remaining = parseInt(remaining, 10);
  }
  if (reset !== null) {
    rateLimitInfo.reset = parseInt(reset, 10) * 1000;
  }
  if (limit !== null) {
    rateLimitInfo.limit = parseInt(limit, 10);
  }
}

/**
 * Get current rate limit info
 */
export function getRateLimitInfo(): RateLimitInfo {
  return { ...rateLimitInfo };
}

/**
 * Check if rate limit is exceeded
 */
export function isRateLimited(): boolean {
  if (rateLimitInfo.remaining === 0) {
    const now = Date.now();
    return now < rateLimitInfo.reset;
  }
  return false;
}

/**
 * Make authenticated GitHub API request
 */
async function githubFetch<T>(
  endpoint: string,
  token?: string
): Promise<T> {
  if (isRateLimited()) {
    const resetTime = new Date(rateLimitInfo.reset).toLocaleTimeString();
    throw new Error(`Rate limit exceeded. Reset at ${resetTime}`);
  }

  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
  };

  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  const response = await fetch(`https://api.github.com${endpoint}`, {
    headers,
  });

  updateRateLimit(response.headers);

  if (!response.ok) {
    const error = new Error(
      `GitHub API error: ${response.statusText}`
    ) as GitHubApiError;
    error.status = response.status;
    error.rateLimitRemaining = rateLimitInfo.remaining;
    error.rateLimitReset = rateLimitInfo.reset;
    throw error;
  }

  return response.json() as Promise<T>;
}

/**
 * Fetch open issues from a GitHub repository
 */
export async function fetchIssues(
  owner: string,
  repo: string,
  token?: string,
  page: number = 1,
  perPage: number = 30
): Promise<GitHubIssue[]> {
  const endpoint = `/repos/${owner}/${repo}/issues?state=open&page=${page}&per_page=${perPage}`;
  return githubFetch<GitHubIssue[]>(endpoint, token);
}

/**
 * Fetch open pull requests from a GitHub repository
 */
export async function fetchPRs(
  owner: string,
  repo: string,
  token?: string,
  page: number = 1,
  perPage: number = 30
): Promise<GitHubPullRequest[]> {
  const endpoint = `/repos/${owner}/${repo}/pulls?state=open&page=${page}&per_page=${perPage}`;
  return githubFetch<GitHubPullRequest[]>(endpoint, token);
}

/**
 * Create a new issue in a GitHub repository
 */
export async function createIssue(
  owner: string,
  repo: string,
  title: string,
  body: string,
  labels: string[] = [],
  token?: string
): Promise<GitHubIssue> {
  const endpoint = `/repos/${owner}/${repo}/issues`;
  const payload = {
    title,
    body,
    labels,
  };

  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  if (isRateLimited()) {
    const resetTime = new Date(rateLimitInfo.reset).toLocaleTimeString();
    throw new Error(`Rate limit exceeded. Reset at ${resetTime}`);
  }

  const response = await fetch(`https://api.github.com${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  updateRateLimit(response.headers);

  if (!response.ok) {
    const error = new Error(
      `Failed to create issue: ${response.statusText}`
    ) as GitHubApiError;
    error.status = response.status;
    throw error;
  }

  return response.json() as Promise<GitHubIssue>;
}

/**
 * Update issue state (open/closed)
 */
export async function updateIssueState(
  owner: string,
  repo: string,
  issueNumber: number,
  state: 'open' | 'closed',
  token?: string
): Promise<GitHubIssue> {
  const endpoint = `/repos/${owner}/${repo}/issues/${issueNumber}`;
  const payload = { state };

  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  if (isRateLimited()) {
    const resetTime = new Date(rateLimitInfo.reset).toLocaleTimeString();
    throw new Error(`Rate limit exceeded. Reset at ${resetTime}`);
  }

  const response = await fetch(`https://api.github.com${endpoint}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload),
  });

  updateRateLimit(response.headers);

  if (!response.ok) {
    const error = new Error(
      `Failed to update issue: ${response.statusText}`
    ) as GitHubApiError;
    error.status = response.status;
    throw error;
  }

  return response.json() as Promise<GitHubIssue>;
}
