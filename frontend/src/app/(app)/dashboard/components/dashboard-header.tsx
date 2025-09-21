export function DashboardHeader() {
  return (
    <div className="space-y-2">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        🎯 GitHub PR Prediction Market
      </h1>
      <p className="text-muted-foreground">
        Create and trade prediction markets for GitHub pull requests
      </p>
    </div>
  );
}