export interface Market {
  id: number;
  repo: string;
  prNumber: number;
  title: string;
  author: string;
  probability: number; // Keep for now but will show as N/A in UI
  price: number; // Keep for now but will show as N/A in UI
  change: number; // Keep for now but will show as N/A in UI
  volume: number; // Keep for now but will show as N/A in UI
  status: "open" | "review" | "merged" | "closed";
  tags: string[];
  timeLeft: string; // Will show real time data
  participants: number; // Keep for now but will show as N/A in UI
}