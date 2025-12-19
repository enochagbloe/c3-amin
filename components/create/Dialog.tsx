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
import { CalendarIcon, Loader2 } from "lucide-react";
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
  isLoading?: boolean
}

export function ExpensesDialog<T extends FieldValues>({
  open,
  onOpenChange,
  title,
  schema,
  defaultValues,
  onSubmit,
  dialogName,
  isLoading,
}: ReusableDialogProps<T>) {
  const isMobile = useIsMobile();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const handleSubmit: SubmitHandler<T> = async (data) => {
    try {
      const results = (await onSubmit(data)) as ActionResponse;
      if (results?.success) {
        toast.success(`${dialogName} created successfully!`);
        onOpenChange(false);
        form.reset();
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("An error occurred while submitting the form");
    }
  };

  // Helper function to safely format date
  const formatDateSafely = (date: any) => {
    if (!date) return null;

    // Handle string dates
    if (typeof date === "string") {
      const parsedDate = new Date(date);
      return isNaN(parsedDate.getTime()) ? null : format(parsedDate, "PPP");
    }

    // Handle Date objects
    if (date instanceof Date) {
      return isNaN(date.getTime()) ? null : format(date, "PPP");
    }

    return null;
  };

  const FormContent = (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4 px-1"
      >
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
                          variant={"outline"}
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
                      className="h-11 text-base"
                      inputMode={fieldName === "amount" ? "decimal" : "text"}
                    />
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
       <Button
          type="submit"
          className="w-full h-11 text-base mt-6"
          disabled={isLoading}
        >
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
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="border-b pb-4">
            <DrawerTitle className="text-lg font-semibold">{title}</DrawerTitle>
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
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {FormContent}
      </DialogContent>
    </Dialog>
  );
}
