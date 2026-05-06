import { Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { LogOut, ShoppingBag } from "lucide-react";
import { dashboardFor } from "./RoleRouter";

export function SiteHeader() {
  const { user, roles, signOut } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Logo />
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link
            to="/"
            className="hover:text-primary transition-colors"
            activeOptions={{ exact: true }}
          >
            Home
          </Link>
          <Link to="/shop" className="hover:text-primary transition-colors">
            Shop
          </Link>
          <Link to="/why-us" className="hover:text-primary transition-colors">
            Why us
          </Link>
          <Link to="/become-rider" className="hover:text-primary transition-colors">
            Become a rider
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/cart" className="relative">
            <Button variant="ghost" size="icon">
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {count}
                </span>
              )}
            </Button>
          </Link>
          {user ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: dashboardFor(roles) })}
              >
                Dashboard
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/" });
                }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/auth" })}>
                Log in
              </Button>
              <Button
                variant="hero"
                size="sm"
                onClick={() => navigate({ to: "/auth", search: { mode: "signup" } as never })}
              >
                Get started
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
