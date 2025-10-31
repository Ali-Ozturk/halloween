import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface AuthFormProps {
  onSuccess: () => void;
}

export default function AuthForm({ onSuccess }: AuthFormProps) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convert username to email format for Supabase auth
      const email = `${username.toLowerCase().trim()}@contest.app`;
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: username.toLowerCase().trim(), // Use username as password
      });
      
      if (error) throw error;
      toast.success("Welcome! You can now vote.");
      onSuccess();
    } catch (error: any) {
      toast.error("Username not found. Contact your administrator.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-[var(--shadow-card)]">
      <CardHeader>
        <CardTitle className="text-2xl bg-[var(--gradient-primary)] bg-clip-text text-transparent">
          Enter to Vote
        </CardTitle>
        <CardDescription>
          Enter your username provided by the administrator
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In & Vote"}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Don't have credentials? Contact your administrator.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
