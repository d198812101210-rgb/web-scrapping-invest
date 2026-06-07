import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TrendingUp, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const NavBar = () => {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    const { error } = await signOut();
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
      router.push("/login");
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.user_metadata?.name) {
      const names = user.user_metadata.name.split(' ');
      return names.length > 1 
        ? `${names[0][0]}${names[1][0]}`.toUpperCase()
        : names[0].substring(0, 2).toUpperCase();
    }
    return user?.email?.substring(0, 2).toUpperCase() || "IN";
  };

  return (
    <nav className="border-b border-border bg-card">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-20">
          {/* Left Section - Logo and Status */}
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <button 
              onClick={() => router.push("/")}
              className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity cursor-pointer min-w-0"
            >
              <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary flex-shrink-0" />
              <h1 className="text-sm sm:text-base md:text-xl font-bold text-foreground truncate">
                Market Dashboard
              </h1>
            </button>
            
            {/* Connection Status - Hidden on very small screens */}
            <div className="hidden xs:flex items-center ml-2 sm:ml-4 flex-shrink-0">
              <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-success animate-pulse" />
              <span className="ml-1.5 sm:ml-2 text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                Connected
              </span>
            </div>
          </div>

          {/* Right Section - User Info and Logout */}
          <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 flex-shrink-0">
            {/* Avatar */}
            <Avatar className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            
            {/* Logout Button - Icon only on mobile, with text on larger screens */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="h-8 sm:h-9 px-2 sm:px-3"
            >
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
