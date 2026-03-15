import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Server, LogIn, AlertCircle, Sun, Moon } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const success = await login(email, password);
    setLoading(false);

    if (success) {
      navigate("/dashboard", { replace: true });
    } else {
      setError("Invalid email or password. Try admin@company.com / admin123");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      {/* KAVITECH logo — top left */}
      <div className="absolute top-4 left-5 flex items-center">
        <svg width="200" height="64" viewBox="0 0 200 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Connecting lines */}
          <line x1="32" y1="18" x2="20" y2="38" stroke="#888" strokeWidth="1.8" />
          <line x1="20" y1="38" x2="30" y2="52" stroke="#888" strokeWidth="1.8" />
          {/* Large yellow circle (top) */}
          <circle cx="36" cy="14" r="13" fill="#F9C12E" />
          {/* Medium cyan circle (left) */}
          <circle cx="16" cy="38" r="9" fill="#4FC3C8" />
          {/* Small blue circle (bottom) */}
          <circle cx="31" cy="53" r="6.5" fill="#3B9EE4" />
          {/* KAVITECH text */}
          <text x="56" y="44" fontFamily="Arial, sans-serif" fontWeight="800" fontSize="22" letterSpacing="1" fill="currentColor">KAVITECH</text>
        </svg>
      </div>

      {/* Theme toggle — top right corner */}
      <button
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="absolute top-4 right-4 p-2 rounded-lg border border-border/50 bg-card/80 hover:bg-muted hover:border-primary/40 transition-all duration-200 shadow-sm"
      >
        {theme === "dark" ? (
          <Sun className="h-4 w-4 text-yellow-400" />
        ) : (
          <Moon className="h-4 w-4 text-primary" />
        )}
      </button>
      <Card className="w-full max-w-md border-border/50 shadow-lg">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
            <Server className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-xl font-bold text-foreground">Azure Cost Intel</CardTitle>
          <CardDescription className="text-muted-foreground">
            Sign in to access your FinOps dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" /> Sign In
                </span>
              )}
            </Button>
            <div className="text-xs text-muted-foreground text-center space-y-1 pt-2">
              <p className="font-medium">Demo accounts:</p>
              <p>admin@company.com · admin123</p>
              <p>sarah@company.com · editor123</p>
              <p>ajay@company.com · viewer123</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
