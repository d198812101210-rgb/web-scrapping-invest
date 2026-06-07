'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, userProfile, loading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    // Check if user is blocked
    if (userProfile?.is_blocked) {
      toast({
        title: "Account Blocked",
        description: "Your account has been blocked. Please contact support.",
        variant: "destructive",
      });
    }
  }, [userProfile, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  // If user is blocked, redirect to login
  if (userProfile?.is_blocked) {
    router.push('/login');
    return null;
  }

  return <>{children}</>;
}