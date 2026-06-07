import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Customization, CustomizationInput, ChartCategory } from "@/types/customization";

/**
 * Hook to fetch user customizations for a specific category
 */
export const useCustomizations = (category?: ChartCategory) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["customizations", user?.id, category],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      let query = supabase
        .from("customization")
        .select("*")
        .eq("user_id", user.id);

      // If category is specified, filter by category
      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query.order("line_number");

      if (error) throw error;

      // Return only user customizations
      return data as Customization[];
    },
    enabled: !!user?.id, // Fetch when user is authenticated
  });
};

/**
 * Hook to fetch a single customization
 */
export const useCustomization = (category: ChartCategory, lineNumber: number) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["customization", user?.id, category, lineNumber],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("customization")
        .select("*")
        .eq("user_id", user.id)
        .eq("category", category)
        .eq("line_number", lineNumber)
        .single();

      if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows

      // Return user customization or null if not found
      return data as Customization | null;
    },
    enabled: !!user?.id,
  });
};

/**
 * Hook to create or update a customization
 */
export const useUpsertCustomization = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CustomizationInput) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("customization")
        .upsert(
          {
            user_id: user.id,
            category: input.category,
            line_number: input.line_number,
            formula: input.formula,
            style_color: input.style_color,
            style_line_depth: input.style_line_depth,
            animation: input.animation,
          },
          {
            onConflict: "user_id,category,line_number",
          }
        )
        .select()
        .single();

      if (error) throw error;
      return data as Customization;
    },
    onSuccess: (data) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({
        queryKey: ["customizations", user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["customization", user?.id, data.category, data.line_number],
      });
    },
  });
};

/**
 * Hook to delete a customization and reset to default
 */
export const useDeleteCustomization = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      category,
      lineNumber,
    }: {
      category: ChartCategory;
      lineNumber: number;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("customization")
        .delete()
        .eq("user_id", user.id)
        .eq("category", category)
        .eq("line_number", lineNumber);

      if (error) throw error;
    },
    onSuccess: (_, { category, lineNumber }) => {
      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: ["customizations", user?.id, category],
      });
      queryClient.invalidateQueries({
        queryKey: ["customization", user?.id, category, lineNumber],
      });
    },
  });
};

/**
 * Hook to initialize default customizations for a new user
 * (Deprecated - no longer initializes defaults)
 */
export const useInitializeDefaults = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      // No longer initializes defaults - users start with empty customizations
    },
  });
};