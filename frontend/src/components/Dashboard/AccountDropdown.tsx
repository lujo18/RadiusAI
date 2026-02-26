'use client';

import { useRouter, useParams } from 'next/navigation';
import { ChevronsUpDown, Settings, CreditCard, LogOut, Sparkles } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store';
import { logOut } from '@/lib/supabase/auth';
import { isAdminUser } from '@/features/user/hooks';
import { useIsMobile } from '@/hooks/use-mobile';

function getInitials(name?: string | null, email?: string | null): string {
  if (name) return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  if (email) return email[0].toUpperCase();
  return 'U';
}

export function AccountDropdown() {
  const router = useRouter();
  const params = useParams();
  const teamId = params?.teamId as string | undefined;
  const isMobile = useIsMobile();

  const user = useAuthStore((s) => s.user);
  const supabaseUser = useAuthStore((s) => s.supabaseUser);
  const logout = useAuthStore((s) => s.logout);
  const isAdmin = isAdminUser();

  const handleLogout = async () => {
    try {
      await logOut();
    } catch (_) {
      // best-effort
    } finally {
      logout();
      router.push('/login');
    }
  };

  const initials = getInitials(user?.name, user?.email);
  const avatarUrl = supabaseUser?.user_metadata?.avatar_url;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-9 items-center gap-2 px-2 rounded-lg"
          aria-label="Account menu"
        >
          <Avatar className="h-7 w-7 rounded-lg">
            <AvatarImage src={avatarUrl} alt={user?.name || user?.email || 'User'} />
            <AvatarFallback className="rounded-lg text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="hidden sm:grid text-left text-sm leading-tight">
            <span className="truncate font-semibold max-w-[120px]">
              {user?.name || 'Account'}
              {isAdmin && <Badge className="ml-1.5 text-[10px] px-1 py-0">Dev</Badge>}
            </span>
          </div>
          <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="min-w-56 rounded-lg"
        side={isMobile ? 'bottom' : 'bottom'}
        align="end"
        sideOffset={6}
      >
        {/* Identity label */}
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src={avatarUrl} alt={user?.name || user?.email || 'User'} />
              <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-sm leading-tight">
              <span className="truncate font-semibold">{user?.name || 'User'}</span>
              <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {user?.plan === null && (
            <>
              <DropdownMenuItem onClick={() => router.push(teamId ? `/${teamId}/settings/billing?upgrade=true` : '/pricing')}>
                <Sparkles className="mr-2 h-4 w-4" />
                Upgrade to Pro
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={() => router.push(teamId ? `/${teamId}/settings` : '/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(teamId ? `/${teamId}/settings/billing` : '/settings/billing')}>
            <CreditCard className="mr-2 h-4 w-4" />
            Billing
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
