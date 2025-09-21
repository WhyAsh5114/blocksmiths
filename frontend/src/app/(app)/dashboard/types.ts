export interface Market {
  id: number;
  repo: string;
  prNumber: number;
  title: string;
  author: string;
  probability: number;
  price: number;
  change: number;
  volume: number;
  status: "open" | "review" | "merged" | "closed";
  tags: string[];
  timeLeft: string;
  participants: number;
}