import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTabCustomization, useUpsertTabCustomization, useDeleteTabCustomization } from "@/hooks/useTabCustomization";
import type { ChartCategory } from "@/types/customization";
import { RotateCcw, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TabCustomizationFormProps {
  category: ChartCategory;
  defaultLabel: string;
}

// Default labels for each category
const DEFAULT_LABELS: Record<ChartCategory, string> = {
  "brazil-indices": "Brazilian Indices",
  "us-indices": "U.S. Indices",
  "commodities": "Commodities",
  "currency": "Currency",
};

export const TabCustomizationForm = ({ category, defaultLabel }: TabCustomizationFormProps) => {
  const { data: tabCustomization } = useTabCustomization(category);
  const { mutate: upsertTabCustomization, isPending: isSaving } = useUpsertTabCustomization();
  const { mutate: deleteTabCustomization, isPending: isDeleting } = useDeleteTabCustomization();
  const { toast } = useToast();

  const [label, setLabel] = useState(defaultLabel);

  // Update label when tabCustomization changes from API
  useEffect(() => {
    if (tabCustomization?.tab_label) {
      setLabel(tabCustomization.tab_label);
    } else {
      setLabel(defaultLabel);
    }
  }, [tabCustomization, defaultLabel]);

  const handleSave = async () => {
    if (!label.trim()) {
      toast({
        title: "Error",
        description: "Tab label cannot be empty",
        variant: "destructive",
      });
      return;
    }

    if (label.trim().length > 50) {
      toast({
        title: "Error",
        description: "Tab label cannot exceed 50 characters",
        variant: "destructive",
      });
      return;
    }

    upsertTabCustomization(
      {
        category,
        tab_label: label.trim(),
      },
      {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Tab label saved",
          });
        },
        onError: (err) => {
          toast({
            title: "Error",
            description: err instanceof Error ? err.message : "Failed to save tab label",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleReset = () => {
    deleteTabCustomization(category, {
      onSuccess: () => {
        setLabel(DEFAULT_LABELS[category]);
        toast({
          title: "Success",
          description: "Tab label reset to default",
        });
      },
      onError: (err) => {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to reset tab label",
          variant: "destructive",
        });
      },
    });
  };

  const isModified = label !== DEFAULT_LABELS[category];

  return (
    <div className="mb-6 space-y-3 pb-6 border-b border-border">
      <div className="space-y-2">
        <Label htmlFor={`tab-label-${category}`} className="text-sm font-medium">
          Tab Label
        </Label>
        <div className="flex gap-2 items-end">
          <Input
            id={`tab-label-${category}`}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Enter tab name..."
            maxLength={50}
            disabled={isSaving || isDeleting}
            className="max-w-xs"
          />
          <Button
            onClick={handleSave}
            disabled={!isModified || isSaving || isDeleting}
            size="sm"
            variant="outline"
          >
            <Save className="h-4 w-4 mr-1" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
          {isModified && (
            <Button
              onClick={handleReset}
              variant="ghost"
              disabled={isSaving || isDeleting}
              size="sm"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {label.length}/50 characters {isModified && `• Default: ${DEFAULT_LABELS[category]}`}
        </p>
      </div>
    </div>
  );
};