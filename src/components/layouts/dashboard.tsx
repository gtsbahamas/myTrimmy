/**
 * Dashboard Layout - myTrimmy
 *
 * Digital Darkroom aesthetic: Warm charcoal, amber accents, editorial typography.
 * Refined sidebar with subtle glow effects and smooth transitions.
 */

'use client';

import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-guard';
import { AuthGuard } from '@/components/auth-guard';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

// ============================================================
// TYPES
// ============================================================

interface NavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  requiredPermission?: string;
  children?: NavItem[];
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems?: NavItem[];
  showNotifications?: boolean;
  headerContent?: React.ReactNode;
  contentClassName?: string;
}

// ============================================================
// DEFAULT NAVIGATION ITEMS
// ============================================================

const defaultNavItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
  },
  {
    label: 'Video Bundles',
    href: '/video',
    icon: VideoIcon,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: SettingsIcon,
  },
];

// ============================================================
// ICON COMPONENTS
// ============================================================

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function VideoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m22 8-6 4 6 4V8Z" />
      <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
    </svg>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function UserAvatarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="5" />
      <path d="M20 21a8 8 0 0 0-16 0" />
    </svg>
  );
}

function LogOutIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}


// ============================================================
// SIDEBAR COMPONENT
// ============================================================

interface SidebarProps {
  navItems: NavItem[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  pathname: string;
}

function Sidebar({ navItems, isCollapsed, onToggleCollapse, pathname }: SidebarProps) {
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r border-border/50 bg-card/50 backdrop-blur-xl transition-all duration-500 ease-out',
        isCollapsed ? 'w-[72px]' : 'w-72'
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Subtle ambient glow */}
      <div className="pointer-events-none absolute -right-20 top-20 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />

      {/* Logo / Brand */}
      <div className="flex h-20 items-center justify-between border-b border-border/50 px-4">
        {!isCollapsed && (
          <Link
            href="/dashboard"
            className="group flex items-center gap-3"
          >
            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl transition-all duration-300">
              <Image
                src="/icon-extracted.png"
                alt="Iconym"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <span className="font-display text-lg tracking-tight text-foreground">Iconym</span>
          </Link>
        )}
        {isCollapsed && (
          <Link
            href="/dashboard"
            className="group mx-auto flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl transition-all duration-300"
          >
            <Image
              src="/icon-extracted.png"
              alt="Iconym"
              width={40}
              height={40}
              className="object-contain"
            />
          </Link>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex flex-col gap-1.5 p-3" aria-label="Sidebar navigation">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300',
                'hover:bg-primary/5',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground',
                isCollapsed && 'justify-center px-3'
              )}
              aria-current={isActive ? 'page' : undefined}
              title={isCollapsed ? item.label : undefined}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
              )}
              {Icon && (
                <Icon className={cn(
                  'h-5 w-5 flex-shrink-0 transition-colors duration-300',
                  isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                )} />
              )}
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle - bottom */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center px-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!isCollapsed}
          className="h-9 w-9 rounded-xl text-muted-foreground transition-all duration-300 hover:bg-primary/5 hover:text-foreground"
        >
          {isCollapsed ? (
            <ChevronRightIcon className="h-4 w-4" />
          ) : (
            <ChevronLeftIcon className="h-4 w-4" />
          )}
        </Button>
      </div>
    </aside>
  );
}

// ============================================================
// HEADER COMPONENT
// ============================================================

interface HeaderProps {
  sidebarCollapsed: boolean;
  showNotifications: boolean;
  headerContent?: React.ReactNode;
  onOpenMobileNav: () => void;
}

function Header({
  sidebarCollapsed,
  showNotifications,
  headerContent,
  onOpenMobileNav,
}: HeaderProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
  };

  const handleProfileClick = () => {
    router.push('/settings/profile');
  };

  return (
    <header
      className={cn(
        'fixed right-0 top-0 z-30 flex h-20 items-center justify-between border-b border-border/50 bg-background/80 px-6 backdrop-blur-xl transition-all duration-500 ease-out',
        sidebarCollapsed ? 'left-[72px]' : 'left-72',
        'max-lg:left-0'
      )}
      role="banner"
    >
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 rounded-xl text-muted-foreground transition-colors hover:bg-primary/5 hover:text-foreground lg:hidden"
        onClick={onOpenMobileNav}
        aria-label="Open navigation menu"
      >
        <MenuIcon className="h-5 w-5" />
      </Button>

      {/* Custom header content or spacer */}
      <div className="flex-1">
        {headerContent}
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        {showNotifications && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="View notifications"
            className="relative h-10 w-10 rounded-xl text-muted-foreground transition-colors hover:bg-primary/5 hover:text-foreground"
          >
            <BellIcon className="h-5 w-5" />
          </Button>
        )}

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl text-muted-foreground transition-colors hover:bg-primary/5 hover:text-foreground"
              aria-label="User menu"
            >
              <UserAvatarIcon className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl border-border/50 bg-card/95 p-2 backdrop-blur-xl">
            <DropdownMenuLabel className="px-2 py-1.5">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none text-foreground">Account</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem
              onClick={handleProfileClick}
              className="cursor-pointer rounded-lg px-2 py-2 text-muted-foreground transition-colors hover:bg-primary/5 hover:text-foreground focus:bg-primary/5"
            >
              <UserAvatarIcon className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push('/settings')}
              className="cursor-pointer rounded-lg px-2 py-2 text-muted-foreground transition-colors hover:bg-primary/5 hover:text-foreground focus:bg-primary/5"
            >
              <SettingsIcon className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="cursor-pointer rounded-lg px-2 py-2 text-destructive transition-colors hover:bg-destructive/10 focus:bg-destructive/10"
            >
              <LogOutIcon className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

// ============================================================
// MOBILE NAVIGATION COMPONENT
// ============================================================

interface MobileNavProps {
  navItems: NavItem[];
  isOpen: boolean;
  onClose: () => void;
  pathname: string;
}

function MobileNav({ navItems, isOpen, onClose, pathname }: MobileNavProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-72 border-border/50 bg-card/95 p-0 backdrop-blur-xl">
        {/* Logo / Brand */}
        <div className="flex h-20 items-center border-b border-border/50 px-4">
          <Link
            href="/dashboard"
            className="group flex items-center gap-3"
            onClick={onClose}
          >
            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl">
              <Image
                src="/icon-extracted.png"
                alt="Iconym"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <span className="font-display text-lg tracking-tight text-foreground">Iconym</span>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1.5 p-3" aria-label="Mobile navigation">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300',
                  'hover:bg-primary/5',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
                )}
                {Icon && <Icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-primary')} />}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

// ============================================================
// MOBILE BOTTOM NAVIGATION COMPONENT
// ============================================================

interface MobileBottomNavProps {
  navItems: NavItem[];
  pathname: string;
}

export function MobileBottomNav({ navItems, pathname }: MobileBottomNavProps) {
  const displayItems = navItems.slice(0, 5);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-card/95 backdrop-blur-xl lg:hidden"
      role="navigation"
      aria-label="Mobile bottom navigation"
    >
      <div className="flex h-16 items-center justify-around">
        {displayItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs transition-all duration-300',
                'focus-visible:outline-none',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {Icon && <Icon className={cn('h-5 w-5', isActive && 'text-primary')} />}
              <span className="truncate font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute bottom-0 h-0.5 w-8 rounded-t-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// ============================================================
// MAIN CONTENT COMPONENT
// ============================================================

interface MainContentProps {
  children: React.ReactNode;
  sidebarCollapsed: boolean;
  className?: string;
}

function MainContent({ children, sidebarCollapsed, className }: MainContentProps) {
  return (
    <main
      className={cn(
        'min-h-screen bg-background pt-20 transition-all duration-500 ease-out grain',
        sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-72',
        'pb-20 lg:pb-0',
        className
      )}
      role="main"
      id="main-content"
    >
      <div className="container mx-auto p-6 lg:p-8">
        {children}
      </div>
    </main>
  );
}

// ============================================================
// SKIP LINK COMPONENT
// ============================================================

function SkipLink() {
  return (
    <a
      href="#main-content"
      className={cn(
        'fixed left-4 top-4 z-[100] rounded-xl bg-primary px-4 py-2 font-medium text-primary-foreground',
        'opacity-0 focus:opacity-100',
        'transition-all duration-300',
        '-translate-y-full focus:translate-y-0'
      )}
    >
      Skip to main content
    </a>
  );
}

// ============================================================
// DASHBOARD LAYOUT COMPONENT
// ============================================================

export function DashboardLayout({
  children,
  navItems = defaultNavItems,
  showNotifications = true,
  headerContent,
  contentClassName,
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    if (stored !== null) {
      setSidebarCollapsed(stored === 'true');
    }
  }, []);

  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const newState = !prev;
      localStorage.setItem('sidebar-collapsed', String(newState));
      return newState;
    });
  }, []);

  const handleOpenMobileNav = useCallback(() => {
    setMobileNavOpen(true);
  }, []);

  const handleCloseMobileNav = useCallback(() => {
    setMobileNavOpen(false);
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <SkipLink />

        {/* Ambient background glow */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-primary/3 blur-[100px]" />
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar
            navItems={navItems}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={handleToggleSidebar}
            pathname={pathname}
          />
        </div>

        {/* Mobile Navigation Drawer */}
        <MobileNav
          navItems={navItems}
          isOpen={mobileNavOpen}
          onClose={handleCloseMobileNav}
          pathname={pathname}
        />

        {/* Header */}
        <Header
          sidebarCollapsed={sidebarCollapsed}
          showNotifications={showNotifications}
          headerContent={headerContent}
          onOpenMobileNav={handleOpenMobileNav}
        />

        {/* Main Content */}
        <MainContent
          sidebarCollapsed={sidebarCollapsed}
          className={contentClassName}
        >
          {children}
        </MainContent>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav navItems={navItems} pathname={pathname} />
      </div>
    </AuthGuard>
  );
}

// ============================================================
// EXPORTS
// ============================================================

export {
  Sidebar,
  Header,
  MobileNav,
  MainContent,
  SkipLink,
};

export type { NavItem, DashboardLayoutProps };
