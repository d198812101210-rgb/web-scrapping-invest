'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types/user';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, User as UserIcon, Ban, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const UserManagement = () => {
  const { userProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!userProfile) {
      toast({
        title: 'Error',
        description: 'Unable to load user profile',
        variant: 'destructive',
      });
      router.push('/dashboard');
      return;
    }

    if (userProfile.role !== 'admin') {
      toast({
        title: 'Access Denied',
        description: "You don't have permission to access this page",
        variant: 'destructive',
      });
      router.push('/dashboard');
      return;
    }

    fetchUsers();
  }, [userProfile, authLoading, router, toast]);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      console.log('Fetching users...');
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Users fetched successfully:', data?.length || 0);
      setUsers(data as UserProfile[]);
    } catch (error: any) {
      console.error('Error fetching users:', error);

      let errorMessage = 'Failed to load users';
      if (error?.message?.includes('permission')) {
        errorMessage =
          "You don't have permission to view users. Please ensure you have admin role.";
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId: string, currentlyBlocked: boolean) => {
    try {
      setUpdatingUserId(userId);

      const { error } = await supabase
        .from('user_profiles')
        .update({ is_blocked: !currentlyBlocked })
        .eq('id', userId);

      if (error) throw error;

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, is_blocked: !currentlyBlocked } : user
        )
      );

      toast({
        title: 'Success',
        description: `User ${
          !currentlyBlocked ? 'blocked' : 'unblocked'
        } successfully`,
      });
    } catch (error) {
      console.error('Error blocking/unblocking user:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user status',
        variant: 'destructive',
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setUpdatingUserId(userToDelete.id);

      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userToDelete.id);

      if (error) throw error;

      setUsers((prevUsers) =>
        prevUsers.filter((user) => user.id !== userToDelete.id)
      );

      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive',
      });
    } finally {
      setUpdatingUserId(null);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const openDeleteDialog = (user: UserProfile) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const getSubscriptionBadgeVariant = (
    status: string | null
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'active':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'cancelled':
      case 'expired':
      case 'suspended':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatSubscriptionStatus = (status: string | null): string => {
    if (!status) return 'None';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!userProfile || userProfile.role !== 'admin') {
    return null;
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage user accounts and permissions
          </p>
        </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            View and manage all registered users in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {getInitials(user.full_name, user.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {user.full_name || 'No name'}
                            </p>
                            <div className="flex gap-1 mt-1">
                              {user.id === userProfile?.id && (
                                <Badge variant="outline" className="text-xs">
                                  You
                                </Badge>
                              )}
                              {user.is_blocked && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  Blocked
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            user.is_blocked
                              ? 'text-muted-foreground line-through'
                              : ''
                          }
                        >
                          {user.email}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.role === 'admin' ? 'default' : 'secondary'
                          }
                          className="gap-1"
                        >
                          {user.role === 'admin' ? (
                            <Shield className="h-3 w-3" />
                          ) : (
                            <UserIcon className="h-3 w-3" />
                          )}
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant={
                              user.subscription_tier === 'pro'
                                ? 'default'
                                : user.subscription_tier === 'plus'
                                  ? 'secondary'
                                  : 'outline'
                            }
                            className="w-fit text-xs"
                          >
                            {user.subscription_tier === 'pro'
                              ? 'Pro'
                              : user.subscription_tier === 'plus'
                                ? 'Plus'
                                : 'Free'}
                          </Badge>
                          {user.subscription_status && (
                            <Badge
                              variant={getSubscriptionBadgeVariant(
                                user.subscription_status
                              )}
                              className="w-fit text-xs"
                            >
                              {formatSubscriptionStatus(
                                user.subscription_status
                              )}
                            </Badge>
                          )}
                          {user.subscription_end_date && (
                            <span className="text-xs text-muted-foreground">
                              Until{' '}
                              {new Date(
                                user.subscription_end_date
                              ).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {user.id === userProfile?.id ? (
                          <span className="text-sm text-muted-foreground">
                            Cannot modify yourself
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Button
                              variant={
                                user.is_blocked ? 'outline' : 'destructive'
                              }
                              size="sm"
                              onClick={() =>
                                handleBlockUser(
                                  user.id,
                                  user.is_blocked || false
                                )
                              }
                              disabled={updatingUserId === user.id}
                            >
                              {updatingUserId === user.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Ban className="h-4 w-4 mr-1" />
                                  {user.is_blocked ? 'Unblock' : 'Block'}
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDeleteDialog(user)}
                              disabled={updatingUserId === user.id}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
};

export default UserManagement;