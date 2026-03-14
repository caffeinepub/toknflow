import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, LogOut, User } from "lucide-react";
import type { UserProfile } from "../backend.d";

interface HeaderProps {
  title: string;
  subtitle?: string;
  userProfile: UserProfile | null;
  onLogout: () => void;
}

export function Header({
  title,
  subtitle,
  userProfile,
  onLogout,
}: HeaderProps) {
  const initials = userProfile?.name
    ? userProfile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-navy-900/50 backdrop-blur-sm sticky top-0 z-10">
      <div>
        <h1 className="text-lg font-bold font-display gradient-text">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground relative"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-teal-400 rounded-full" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-2 hover:bg-white/5"
            >
              <Avatar className="w-7 h-7">
                <AvatarFallback className="bg-teal-500/20 text-teal-400 text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden sm:block">
                {userProfile?.name ?? "User"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-navy-800 border-white/10"
          >
            <DropdownMenuItem className="gap-2 text-sm">
              <User className="w-3.5 h-3.5" />
              {userProfile?.name ?? "Unknown"}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              className="gap-2 text-sm text-rose-400 focus:text-rose-400 focus:bg-rose-400/10"
              onClick={onLogout}
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
