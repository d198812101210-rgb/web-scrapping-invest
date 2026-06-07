import { Crown, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface UpgradePromptProps {
  feature?: string;
  variant?: "card" | "alert" | "inline";
  className?: string;
}

export function UpgradePrompt({
  feature = "this feature",
  variant = "card",
  className = "",
}: UpgradePromptProps) {
  if (variant === "alert") {
    return (
      <Alert className={className}>
        <Crown className="h-4 w-4" />
        <AlertTitle>Premium Feature</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <p>Upgrade to Subscription Premium to access {feature}.</p>
          <Link href="/subscription">
            <Button size="sm" className="gap-2">
              <Sparkles className="h-4 w-4" />
              View Plans
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  if (variant === "inline") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Crown className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Premium feature - 
          <Link href="/subscription" className="ml-1 text-primary hover:underline">
            Upgrade now
          </Link>
        </span>
      </div>
    );
  }

  // Card variant (default)
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-primary" />
          <CardTitle>Upgrade to Premium</CardTitle>
        </div>
        <CardDescription>
          Unlock {feature} and many more premium features
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Access to all analytics dashboards
          </li>
          <li className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Upload custom avatars
          </li>
          <li className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Custom chart styles and themes
          </li>
          <li className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Advanced data filtering
          </li>
          <li className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Export data to CSV/Excel
          </li>
          <li className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Priority customer support
          </li>
        </ul>
      </CardContent>
      <CardFooter>
        <Link href="/subscription" className="w-full">
          <Button className="w-full gap-2">
            <Crown className="h-4 w-4" />
            View Subscription Plans
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}