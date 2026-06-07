import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  useUpsertCustomization,
  useDeleteCustomization,
} from "@/hooks/useCustomization";
import { usePortfolioSymbols, type PortfolioItem } from "@/hooks/usePortfolioSymbols";
import type { Customization, CustomizationInput, ChartCategory } from "@/types/customization";
import { Plus, Trash2, RotateCcw, Save } from "lucide-react";

interface CustomizationFormProps {
  category: ChartCategory;
  lineNumber: number;
  initialData?: Customization;
}

interface FormData {
  style_color: string;
  style_line_depth: number;
  animation: "smooth" | "linear" | "step";
  items: Array<{ item: string; weight: number }>;
}

export function CustomizationForm({
  category,
  lineNumber,
  initialData,
}: CustomizationFormProps) {
  const [isModified, setIsModified] = useState(false);
  const { toast } = useToast();
  const upsertMutation = useUpsertCustomization();
  const deleteMutation = useDeleteCustomization();
  const { data: portfolioSymbols = [] } = usePortfolioSymbols();

  const defaultValues = initialData || null;

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { isSubmitting },
    setValue,
  } = useForm<FormData>({
    defaultValues: {
      style_color: defaultValues?.style_color || "#3b82f6",
      style_line_depth: defaultValues?.style_line_depth || 2,
      animation: defaultValues?.animation || "smooth",
      items: defaultValues?.formula?.items || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // Track modifications
  useEffect(() => {
    const subscription = watch(() => {
      setIsModified(true);
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const onSubmit = async (data: FormData) => {
    try {
      // Validate that at least one item is selected
      const validItems = data.items.filter(
        (item) => item.item && item.weight > 0
      );
      if (validItems.length === 0) {
        toast({
          title: "Error",
          description: "Please select at least one item with a weight greater than 0",
          variant: "destructive",
        });
        return;
      }

      const input: CustomizationInput = {
        category,
        line_number: lineNumber,
        formula: {
          items: validItems,
        },
        style_color: data.style_color,
        style_line_depth: data.style_line_depth,
        animation: data.animation,
      };

      await upsertMutation.mutateAsync(input);

      setIsModified(false);
      reset(data);

      toast({
        title: "Success",
        description: `Line ${lineNumber} customization saved`,
      });
    } catch (error) {
      console.error("Error saving customization:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save customization",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    if (initialData) {
      deleteMutation.mutate({
        category,
        lineNumber,
      });
      reset({
        style_color: "#3b82f6",
        style_line_depth: 2,
        animation: "smooth",
        items: [],
      });
      setIsModified(false);
    }
  };

  const handleDelete = async () => {
    if (initialData) {
      try {
        await deleteMutation.mutateAsync({
          category,
          lineNumber,
        });

        reset({
          style_color: "#3b82f6",
          style_line_depth: 2,
          animation: "smooth",
          items: [],
        });
        setIsModified(false);

        toast({
          title: "Success",
          description: `Line ${lineNumber} deleted`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to delete customization",
          variant: "destructive",
        });
      }
    }
  };

  const watchItems = watch("items");
  const selectedItems = watchItems.map((item) => item.item).filter(Boolean);

  return (
    <Card className="p-6 border border-border">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Line {lineNumber}</h3>
        <p className="text-sm text-muted-foreground">
          Define the formula and styling for chart line {lineNumber}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Formula Section */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Formula Items</Label>
          <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
            {fields.map((field, idx) => (
              <div
                key={field.id}
                className="flex gap-3 items-end bg-background p-3 rounded border border-border"
              >
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    Item
                  </Label>
                  <Select
                    value={watchItems[idx]?.item || ""}
                    onValueChange={(value) => setValue(`items.${idx}.item`, value)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select item" />
                    </SelectTrigger>
                    <SelectContent>
                      {portfolioSymbols.map((item: PortfolioItem) => (
                        <SelectItem
                          key={item.symbol}
                          value={item.symbol}
                          disabled={
                            selectedItems.includes(item.symbol) &&
                            watchItems[idx]?.item !== item.symbol
                          }
                        >
                          {item.symbol} - {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-24">
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    Weight
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="Weight"
                    className="h-9"
                    {...{ onChange: (e) => setValue(`items.${idx}.weight`, parseFloat(e.target.value) || 0) }}
                    defaultValue={watchItems[idx]?.weight || 1}
                  />
                </div>

                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => remove(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {fields.length < 4 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => append({ item: "", weight: 1 })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          )}
        </div>

        {/* Style Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor={`color-${lineNumber}`} className="text-sm font-medium">
              Line Color
            </Label>
            <div className="flex gap-2 mt-2">
              <Input
                id={`color-${lineNumber}`}
                type="color"
                className="h-10 w-20 cursor-pointer"
                {...{ onChange: (e) => setValue("style_color", e.target.value) }}
                defaultValue={watch("style_color")}
              />
              <Input
                type="text"
                className="h-10 flex-1"
                placeholder="#3b82f6"
                {...{ onChange: (e) => setValue("style_color", e.target.value) }}
                defaultValue={watch("style_color")}
              />
            </div>
          </div>

          <div>
            <Label htmlFor={`depth-${lineNumber}`} className="text-sm font-medium">
              Line Thickness
            </Label>
            <Select
              value={watch("style_line_depth").toString()}
              onValueChange={(value) =>
                setValue("style_line_depth", parseInt(value))
              }
            >
              <SelectTrigger className="mt-2 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Thin (1px)</SelectItem>
                <SelectItem value="2">Normal (2px)</SelectItem>
                <SelectItem value="3">Medium (3px)</SelectItem>
                <SelectItem value="4">Thick (4px)</SelectItem>
                <SelectItem value="5">Very Thick (5px)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor={`animation-${lineNumber}`} className="text-sm font-medium">
              Animation Style
            </Label>
            <Select
              value={watch("animation")}
              onValueChange={(value) =>
                setValue("animation", value as "smooth" | "linear" | "step")
              }
            >
              <SelectTrigger className="mt-2 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="smooth">Smooth</SelectItem>
                <SelectItem value="linear">Linear</SelectItem>
                <SelectItem value="step">Step</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? "Saving..." : "Save"}
          </Button>

          {initialData && (
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="flex-1"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}

          {initialData && (
            <Button
              type="button"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}