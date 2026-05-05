import { Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { LogOut } from "lucide-react";

export function SiteHeader() {
  const { user, roles, signOut } = useAuth();
  const navigate = useNavigate();

  const dashHref =
    roles.includes("admin") ? "/admin"
    : roles.includes("delivery_agent") ? "/agent"
    : "/customer";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Logo />
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link to="/" className="hover:text-primary transition-colors" activeOptions={{ exact: true }}>Home</Link>
          <Link to="/how-it-works" className="hover:text-primary transition-colors">How it works</Link>
          <Link to="/drive" className="hover:text-primary transition-colors">Drive with us</Link>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate({ to: dashHref })}>Dashboard</Button>
              <Button variant="outline" size="sm" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/auth" })}>Log in</Button>
              <Button variant="hero" size="sm" onClick={() => navigate({ to: "/auth", search: { mode: "signup" } as never })}>Get started</Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
