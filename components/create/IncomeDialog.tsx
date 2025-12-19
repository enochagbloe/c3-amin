/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "../ui/drawer";
import { useForm, SubmitHandler, FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z, { ZodType } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "../ui/button";
import {
  FormField,
  FormItem,
  FormLabel,
  Form,
  FormControl,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2, X, Plus, Settings } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { Switch } from "../ui/switch";
import handleError from "@/lib/handler/error";
import { useIsMobile } from "@/hooks/use-mobile";

interface FieldOption {
  label: string;
  value: string;
}

interface FieldConfig {
  [key: string]: {
    type: string;
    options?: FieldOption[] | any;
    placeholder?: string;
  };
}

interface CustomField {
  name: string;
  type: "TEXT" | "NUMBER" | "DATE" | "SELECT" | "TOGGLE";
  required: boolean;
  options?: string[];
}

interface ReusableDialogProps<T extends FieldValues> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  schema: ZodType<T> | any;
  defaultValues: T;
  onSubmit: (data: T) => void | Promise<ActionResponse | void>;
  children?: React.ReactNode;
  dialogName: string;
  fieldConfig?: FieldConfig;
  isLoading?: boolean;
}

export function IncomeDialog<T extends FieldValues>({
  open,
  onOpenChange,
  title,
  schema,
  defaultValues,
  onSubmit,
  dialogName,
  isLoading,
}: ReusableDialogProps<T>) {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const handleSubmit: SubmitHandler<T> = async (data) => {
    try {
      // Build customFields payload expected by CreateIncome
      const customFieldsPayload = customFields
        .filter((f) => f.name.trim().length > 0)
        .map((field) => {
          const fieldKey = field.name.toLowerCase().replace(/\s+/g, '_');
          return {
            name: field.name,
            type: field.type,
            required: field.required,
            options: field.options || [],
            value: customFieldData[fieldKey] ?? "",
          };
        });

      const fullData = { ...data, customFields: customFieldsPayload } as any;

      const results = (await onSubmit(fullData)) as ActionResponse;
      if (results?.success) {
        toast.success(`${dialogName} created successfully!`);
        onOpenChange(false);
        setCustomFieldData({});
        form.reset();
      }
    } catch (error) {
      handleError(error) as ErrorResponse;
      toast.error("An error occurred while submitting the form");
    }
  };

  // Helper function to safely format date
  const formatDateSafely = (date: any) => {
    if (!date) return null;

    if (typeof date === "string") {
      const parsedDate = new Date(date);
      return isNaN(parsedDate.getTime()) ? null : format(parsedDate, "PPP");
    }

    if (date instanceof Date) {
      return isNaN(date.getTime()) ? null : format(date, "PPP");
    }

    return null;
  };

  const [customFields, setCustomFields] = React.useState<CustomField[]>([]);
  const [customFieldData, setCustomFieldData] = React.useState<Record<string, any>>({});
  const [isManagingFields, setIsManagingFields] = React.useState(false);
  const [editingField, setEditingField] = React.useState<number | null>(null);
  const [newOption, setNewOption] = React.useState<string>("");

  const handleAddCustomField = () => {
    setCustomFields([
      ...customFields,
      { name: "", type: "TEXT", required: false, options: [] },
    ]);
    setEditingField(customFields.length);
  };

  const handleRemoveCustomField = (index: number) => {
    const fieldKey = customFields[index].name.toLowerCase().replace(/\s+/g, '_');
    const newCustomFieldData = { ...customFieldData };
    delete newCustomFieldData[fieldKey];
    
    setCustomFields(customFields.filter((_, i) => i !== index));
    setCustomFieldData(newCustomFieldData);
    if (editingField === index) setEditingField(null);
  };

  const updateCustomField = (index: number, updates: Partial<CustomField>) => {
    const updated = [...customFields];
    updated[index] = { ...updated[index], ...updates };
    setCustomFields(updated);
  };

  const addOptionToField = (index: number) => {
    if (!newOption.trim()) return;
    const updated = [...customFields];
    updated[index].options = [...(updated[index].options || []), newOption.trim()];
    setCustomFields(updated);
    setNewOption("");
  };

  const removeOptionFromField = (fieldIndex: number, optionIndex: number) => {
    const updated = [...customFields];
    updated[fieldIndex].options = updated[fieldIndex].options?.filter(
      (_, i) => i !== optionIndex
    );
    setCustomFields(updated);
  };

  const updateCustomFieldValue = (fieldName: string, value: any) => {
    const fieldKey = fieldName.toLowerCase().replace(/\s+/g, '_');
    setCustomFieldData(prev => ({
      ...prev,
      [fieldKey]: value
    }));
  };

  const renderCustomFieldInput = (field: CustomField) => {
    const fieldKey = field.name.toLowerCase().replace(/\s+/g, '_');
    const value = customFieldData[fieldKey];

    switch (field.type) {
      case "TEXT":
        return (
          <Input
            value={value || ""}
            onChange={(e) => updateCustomFieldValue(field.name, e.target.value)}
            placeholder={`Enter ${field.name}`}
            required={field.required}
          />
        );
      
      case "NUMBER":
        return (
          <Input
            type="number"
            value={value || ""}
            onChange={(e) => updateCustomFieldValue(field.name, e.target.value)}
            placeholder={`Enter ${field.name}`}
            required={field.required}
          />
        );
      
      case "DATE":
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !value && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? formatDateSafely(value) || "Invalid date" : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={value}
                onSelect={(date) => updateCustomFieldValue(field.name, date || undefined)}
                initialFocus
                disabled={(date) => date < new Date("1900-01-01")}
              />
            </PopoverContent>
          </Popover>
        );
      
      case "SELECT":
        return (
          <Select
            value={value || ""}
            onValueChange={(val) => updateCustomFieldValue(field.name, val)}
            required={field.required}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.name}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option, idx) => (
                <SelectItem key={idx} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case "TOGGLE":
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={value || false}
              onCheckedChange={(checked) => updateCustomFieldValue(field.name, checked)}
            />
            <span className="text-sm text-gray-600">
              {value ? "Yes" : "No"}
            </span>
          </div>
        );
      
      default:
        return null;
    }
  };

  const isMobile = useIsMobile();

  const FormContent = (
    <>
      {/* Field Management Section */}
      {isManagingFields && (
        <div className="space-y-3 py-4 border-y">
          <h3 className="text-sm font-medium text-gray-700">Manage Custom Fields</h3>
          {customFields.map((field, index) => (
            <div
              key={index}
              className="p-4 bg-gray-50 rounded-lg border space-y-3"
            >
              {editingField === index ? (
                // Edit Mode
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Field name (e.g., Client Name)"
                      value={field.name}
                      onChange={(e) =>
                        updateCustomField(index, { name: e.target.value })
                      }
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setEditingField(null)}
                      variant="outline"
                    >
                      Done
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCustomField(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">
                        Field Type
                      </label>
                      <Select
                        value={field.type}
                        onValueChange={(value: any) =>
                          updateCustomField(index, { type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TEXT">Text</SelectItem>
                          <SelectItem value="NUMBER">Number</SelectItem>
                          <SelectItem value="DATE">Date</SelectItem>
                          <SelectItem value="SELECT">Select</SelectItem>
                          <SelectItem value="TOGGLE">Toggle</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={field.required}
                          onCheckedChange={(checked) =>
                            updateCustomField(index, {
                              required: checked as boolean,
                            })
                          }
                        />
                        <span className="text-sm">Required</span>
                      </label>
                    </div>
                  </div>

                  {field.type === "SELECT" && (
                    <div className="space-y-2">
                      <label className="text-xs text-gray-600">Options</label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add option"
                          value={newOption}
                          onChange={(e) => setNewOption(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addOptionToField(index);
                            }
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => addOptionToField(index)}
                        >
                          Add
                        </Button>
                      </div>
                      {field.options && field.options.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {field.options.map((option, optIndex) => (
                            <div
                              key={optIndex}
                              className="flex items-center gap-1 text-xs px-2 py-1 bg-white border rounded-md"
                            >
                              <span>{option}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  removeOptionFromField(index, optIndex)
                                }
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                // View Mode
                <div
                  className="flex items-start justify-between gap-3 cursor-pointer"
                  onClick={() => setEditingField(index)}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {field.name || "Unnamed Field"}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                        {field.type}
                      </span>
                      {field.required && (
                        <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                          Required
                        </span>
                      )}
                    </div>

                    {field.type === "SELECT" &&
                      field.options &&
                      field.options.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {field.options.map((option, optIndex) => (
                            <span
                              key={optIndex}
                              className="text-xs px-2 py-1 bg-white border rounded-md text-gray-700"
                            >
                              {option}
                            </span>
                          ))}
                        </div>
                      )}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveCustomField(index);
                    }}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        onClick={handleAddCustomField}
        className="w-full"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Custom Field
      </Button>

      {/* Main Form */}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-4 px-1"
        >
          {/* Default Fields */}
          {Object.keys(defaultValues).map((fieldName) => (
            <FormField
              key={fieldName}
              control={form.control}
              name={String(fieldName)}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    {fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}
                  </FormLabel>
                  <FormControl>
                    {fieldName === "date" ? (
                      <Popover modal={true}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal h-11",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                            <span className="truncate">
                              {field.value ? (
                                formatDateSafely(field.value) || "Invalid date"
                              ) : (
                                "Pick a date"
                              )}
                            </span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent 
                          className="w-auto p-0" 
                          align="start"
                          side="bottom"
                          sideOffset={4}
                        >
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              field.onChange(date || undefined);
                            }}
                            initialFocus
                            disabled={(date) =>
                              date < new Date("1900-01-01")
                            }
                          />
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <Input
                        type={fieldName === "amount" ? "number" : "text"}
                        {...field}
                        value={field.value || ""}
                        className="w-full h-11 text-base"
                        inputMode={fieldName === "amount" ? "decimal" : "text"}
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}

          {/* Custom Fields as Form Inputs */}
          {customFields.length > 0 && !isManagingFields && (
            <div className="pt-4 border-t space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Additional Information</h3>
              {customFields.map((field, index) => (
                field.name && (
                  <div key={index} className="space-y-2">
                    <FormLabel className="text-sm font-medium">
                      {field.name}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </FormLabel>
                    {renderCustomFieldInput(field)}
                  </div>
                )
              ))}
            </div>
          )}

          <Button type="submit" className="w-full h-11 text-base mt-6" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Submit"
            )}
          </Button>
        </form>
      </Form>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="border-b pb-4 px-4">
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-lg font-semibold">{title}</DrawerTitle>
              {customFields.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsManagingFields(!isManagingFields)}
                  className="flex items-center gap-2 h-8 text-xs"
                >
                  <Settings className="h-3 w-3" />
                  {isManagingFields ? "Done" : "Manage"}
                </Button>
              )}
            </div>
          </DrawerHeader>
          <div className="px-4 py-4 overflow-y-auto flex-1">
            {FormContent}
          </div>
          <div className="h-safe-area-inset-bottom" />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
            {customFields.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsManagingFields(!isManagingFields)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                {isManagingFields ? "Done Managing" : "Manage Fields"}
              </Button>
            )}
          </div>
        </DialogHeader>
        {FormContent}
      </DialogContent>
    </Dialog>
  );
}