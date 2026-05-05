import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/auth.service";

export default function SupportAccountsPage() {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supportAccounts = useQuery({
    queryKey: ["support-accounts"],
    queryFn: () => authService.listSupportAccounts(),
    retry: false,
  });

  const sorted = useMemo(
    () => [...(supportAccounts.data ?? [])].sort((a, b) => (a.id > b.id ? -1 : 1)),
    [supportAccounts.data],
  );

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !displayName.trim() || !password.trim()) {
      toast.error("Email, display name, and password are required.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    try {
      setIsSubmitting(true);
      await authService.createSupportAccount({
        email: email.trim().toLowerCase(),
        display_name: displayName.trim(),
        password: password.trim(),
      });
      toast.success("Support account created.");
      setEmail("");
      setDisplayName("");
      setPassword("");
      await supportAccounts.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create support account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <h1 className="font-heading text-2xl font-semibold text-foreground">Support accounts</h1>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Create support account</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-3" onSubmit={onCreate}>
              <div className="space-y-2">
                <Label htmlFor="support-email">Email</Label>
                <Input
                  id="support-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="support@atleetbuddy.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="support-name">Display name</Label>
                <Input
                  id="support-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Support Agent"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="support-password">Temporary password</Label>
                <Input
                  id="support-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 chars"
                />
              </div>
              <div className="md:col-span-3">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create support account"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Existing support accounts</CardTitle>
          </CardHeader>
          <CardContent>
            {supportAccounts.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : supportAccounts.error ? (
              <p className="text-sm text-destructive">{(supportAccounts.error as Error).message}</p>
            ) : sorted.length === 0 ? (
              <p className="text-sm text-muted-foreground">No support accounts yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="px-3 py-2 font-medium text-muted-foreground">Name</th>
                      <th className="px-3 py-2 font-medium text-muted-foreground">Email</th>
                      <th className="px-3 py-2 font-medium text-muted-foreground">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((acct) => (
                      <tr key={acct.id} className="border-b border-border last:border-0">
                        <td className="px-3 py-2 text-foreground">{acct.display_name}</td>
                        <td className="px-3 py-2 text-muted-foreground">{acct.email}</td>
                        <td className="px-3 py-2 text-foreground capitalize">{acct.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
