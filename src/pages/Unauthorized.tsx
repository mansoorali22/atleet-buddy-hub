import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Unauthorized() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Access denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This page is only available to administrators.
        </p>
        <Button asChild className="mt-6">
          <Link to="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
