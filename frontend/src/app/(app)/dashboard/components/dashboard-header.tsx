export function DashboardHeader() {
  return (
    <div className="space-y-2">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        GitHub PR Markets
      </h1>
      <p className="text-muted-foreground">
        Create tokens for GitHub pull requests and track repository activity
      </p>
    </div>
  );
}