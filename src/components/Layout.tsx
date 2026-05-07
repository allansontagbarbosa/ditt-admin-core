import { Link, useLocation, useNavigate } from "react-router-dom";
import { useStaffAuth } from "@/hooks/useStaffAuth";
import { Search, Bell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const NAV = [
  { path: "/", label: "Dashboard" },
  { path: "/clientes", label: "Clientes" },
  { path: "/billing", label: "Billing" },
  { path: "/tickets", label: "Tickets" },
  { path: "/audit", label: "Audit" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { staff, signOut } = useStaffAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const initials =
    staff?.nome
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "??";

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-primary" />
              <span className="font-semibold tracking-tight">ditt admin</span>
            </Link>
            <nav className="flex items-center gap-1">
              {NAV.map((item) => {
                const ativo =
                  pathname === item.path ||
                  (item.path !== "/" && pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      ativo
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                className="h-9 w-64 pl-8"
              />
            </div>
            <Button variant="ghost" size="icon" aria-label="Notificações">
              <Bell />
            </Button>
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              aria-label="Sair"
            >
              <LogOut />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-6 py-8">{children}</main>
    </div>
  );
}
