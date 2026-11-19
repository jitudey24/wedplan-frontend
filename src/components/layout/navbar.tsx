
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
} from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { useAuth } from "@/components/providers/auth-provider";
import { Logo } from "@/components/layout/logo";
import { siteConfig } from "@/config/site";
import { cn } from "cn";

const navLinks = [
  { href: siteConfig.routes.home, label: "Home" },
  { href: siteConfig.routes.services, label: "Browse Services" },
] as const;

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function UserAvatar({
  size = "sm",
}: {
  size?: "sm" | "default";
}) {
  const { user } = useAuth();

  if (!user) {
    return (
      <Avatar size={size}>
        <AvatarFallback>
          <span className="sr-only">No user</span>
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Avatar size={size}>
      {user.avatarUrl && (
        <AvatarImage src={user.avatarUrl} alt={user.name} />
      )}

      <AvatarFallback>
        {getInitials(user.name) || (
          <span className="sr-only">{user.name}</span>
        )}
      </AvatarFallback>
    </Avatar>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const { user, isAuthenticated, signOut, role } = useAuth();

  const [mobileOpen, setMobileOpen] = React.useState(false);

  const dashboardHref =
    role === "admin"
      ? siteConfig.dashboards.admin
      : role === "vendor"
        ? siteConfig.dashboards.vendor
        : siteConfig.dashboards.customer;

  const handleSignOut = async () => {
    setMobileOpen(false);
    await signOut();
  };

  const closeMobileMenu = () => {
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">

        {/* Logo */}
        <Logo />

        {/* Desktop Navigation */}
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-1 md:flex"
        >
          {navLinks.map((link) => {
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Authentication */}
        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-lg py-2 pl-1 pr-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Open user menu"
                  />
                }
              >
                <UserAvatar />

                <span className="max-w-32 truncate text-sm font-medium">
                  {user.name}
                </span>

                <ChevronDown
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-60">

                {/* User Information */}
                <div className="flex items-center gap-2.5 px-1.5 py-1.5">
                  <UserAvatar size="default" />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-medium">
                        {user.name}
                      </p>

                      {user.role && (
                        <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                          {user.role}
                        </span>
                      )}
                    </div>

                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => router.push(dashboardHref)}
                >
                  <LayoutDashboard aria-hidden="true" />
                  Dashboard
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() =>
                    router.push(siteConfig.routes.profile)
                  }
                >
                  <Settings aria-hidden="true" />
                  Profile Settings
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  variant="destructive"
                  onClick={handleSignOut}
                >
                  <LogOut aria-hidden="true" />
                  Logout
                </DropdownMenuItem>

              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link
                href={siteConfig.routes.signIn}
                className="rounded-lg px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Sign In
              </Link>

              <Link
                href={siteConfig.routes.signUp}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile Navigation */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            render={
              <button
                type="button"
                className="inline-flex size-9 items-center justify-center rounded-md transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
                aria-label="Open navigation menu"
              />
            }
          >
            <Menu aria-hidden="true" />
          </SheetTrigger>

          <SheetContent side="right" className="w-80 max-w-[85vw]">

            <SheetHeader className="pb-2">
              <SheetTitle className="font-heading text-lg font-semibold tracking-tight">
                {siteConfig.name}
              </SheetTitle>
            </SheetHeader>

            {/* Mobile Links */}
            <nav
              aria-label="Mobile navigation"
              className="flex flex-col gap-1 px-4"
            >
              {navLinks.map((link) => {
                const isActive = pathname === link.href;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    onClick={closeMobileMenu}
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Authentication */}
            <div className="mt-auto flex flex-col gap-2 border-t border-border p-4">

              {isAuthenticated && user ? (
                <>
                  {/* User Information */}
                  <div className="flex items-center gap-2.5 pb-2">
                    <UserAvatar size="default" />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-medium">
                          {user.name}
                        </p>

                        {user.role && (
                          <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                            {user.role}
                          </span>
                        )}
                      </div>

                      <p className="truncate text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={dashboardHref}
                    onClick={closeMobileMenu}
                    className="flex h-10 w-full items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    Dashboard
                  </Link>

                  <Link
                    href={siteConfig.routes.profile}
                    onClick={closeMobileMenu}
                    className="flex h-10 w-full items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    Profile Settings
                  </Link>

                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-destructive px-4 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
                  >
                    <LogOut aria-hidden="true" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href={siteConfig.routes.signIn}
                    onClick={closeMobileMenu}
                    className="flex h-10 w-full items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent"
                  >
                    Sign In
                  </Link>

                  <Link
                    href={siteConfig.routes.signUp}
                    onClick={closeMobileMenu}
                    className="flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Sign Up
                  </Link>
                </>
              )}

            </div>
          </SheetContent>
        </Sheet>

      </div>
    </header>
  );
}
