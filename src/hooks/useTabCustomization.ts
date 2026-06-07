import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { TabCustomization, TabCustomizationInput, ChartCategory } from "@/types/customization";

/**
 * Hook to fetch all tab customizations for the current user
 */
export const useTabCustomizations = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["tabCustomizations", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("tab_customization")
        .select("*")
        .eq("user_id", user.id)
        .order("category");

      if (error) throw error;

      return data as TabCustomization[];
    },
    enabled: !!user?.id,
  });
};

/**
 * Hook to fetch tab customization for a specific category
 */
export const useTabCustomization = (category: ChartCategory) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["tabCustomization", user?.id, category],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("tab_customization")
        .select("*")
        .eq("user_id", user.id)
        .eq("category", category)
        .single();

      if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows

      return data as TabCustomization | null;
    },
    enabled: !!user?.id,
  });
};

/**
 * Hook to create or update a tab customization
 */
export const useUpsertTabCustomization = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TabCustomizationInput) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("tab_customization")
        .upsert(
          {
            user_id: user.id,
            category: input.category,
            tab_label: input.tab_label,
          },
          {
            onConflict: "user_id,category",
          }
        )
        .select()
        .single();

      if (error) throw error;
      return data as TabCustomization;
    },
    onSuccess: (data) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({
        queryKey: ["tabCustomizations", user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["tabCustomization", user?.id, data.category],
      });
    },
  });
};

/**
 * Hook to delete a tab customization and reset to default
 */
export const useDeleteTabCustomization = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: ChartCategory) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("tab_customization")
        .delete()
        .eq("user_id", user.id)
        .eq("category", category);

      if (error) throw error;
    },
    onSuccess: (_, category) => {
      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: ["tabCustomizations", user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["tabCustomization", user?.id, category],
      });
    },
  });
};