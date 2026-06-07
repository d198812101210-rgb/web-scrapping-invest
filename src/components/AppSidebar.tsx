import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, User, Users, LogOut, Crown, TrendingUp, Settings as SettingsIcon, Zap } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { SubscriptionBadge } from "@/components/SubscriptionBadge";

export function AppSidebar() {
  const { userProfile, user, signOut } = useAuth();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut();
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/');

  const getClientMenuItems = () => {
    const baseItems: Array<{
      title: string;
      icon: any;
      path: string;
      hidden?: boolean;
    }> = [
      {
        title: "Dashboard",
        icon: LayoutDashboard,
        path: "/dashboard",
      },
      {
        title: "Subscription",
        icon: Crown,
        path: "/subscription",
      },
      {
        title: "Settings",
        icon: SettingsIcon,
        path: "/settings",
        hidden: userProfile?.subscription_tier === "free",
      },
      {
        title: "My Profile",
        icon: User,
        path: "/profile",
      }
    ];
    
    // Filter out hidden items for free tier
    return baseItems.filter(item => !item.hidden);
  };

  const clientMenuItems = getClientMenuItems();

  const adminMenuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
    },
    {
      title: "User Management",
      icon: Users,
      path: "/admin/users",
    },
    {
      title: "Revenue",
      icon: TrendingUp,
      path: "/admin/finance",
    },
    {
      title: "Subscription Management",
      icon: Zap,
      path: "/admin/subscriptions",
    },
    {
      title: "Settings",
      icon: SettingsIcon,
      path: "/settings",
    },
    {
      title: "My Profile",
      icon: User,
      path: "/profile",
    }
  ];

  const menuItems = userProfile?.role === "admin" ? adminMenuItems : clientMenuItems;

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-4 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-sm font-bold">FD</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Financial Dashboard</span>
            <span className="text-xs text-muted-foreground">
              {userProfile?.role === "admin" ? "Admin Panel" : "Client Portal"}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.path)}
                    tooltip={item.title}
                  >
                    <Link href={item.path}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarGroup>
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={userProfile?.avatar_url || undefined} />
              <AvatarFallback>
                {getInitials(userProfile?.full_name || null, user?.email || "")}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-1 flex-col overflow-hidden">
              <span className="truncate text-sm font-medium">
                {userProfile?.full_name || user?.email}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {user?.email}
              </span>
              {userProfile?.role === "client" && (
                <div className="mt-1">
                  <SubscriptionBadge userProfile={userProfile} showIcon={true} />
                </div>
              )}
            </div>
          </div>
          <SidebarSeparator />
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}