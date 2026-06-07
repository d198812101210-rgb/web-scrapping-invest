import { useRouter } from "next/navigation";
import { TrendingUp } from "lucide-react";

const SimpleNavBar = () => {
  const router = useRouter();

  return (
    <nav className="border-b border-border bg-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <button 
            onClick={() => router.push("/")}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <TrendingUp className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Market Dashboard</h1>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default SimpleNavBar;