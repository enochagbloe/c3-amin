/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { useForm, SubmitHandler, FieldValues, Field } from "react-hook-form";
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
import { CalendarIcon } from "lucide-react";

interface FieldOption {
  label: string;
  value: string;
}

interface FieldConfig {
  [key: string]: {
    type: string;
    options?: FieldOption[] | any;
    placeholder?: string;
    isLoading?: boolean | true;
  }
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
}

export function ReusableDialog<T extends FieldValues>({
  open,
  onOpenChange,
  title,
  schema,
  defaultValues,
  onSubmit,
  dialogName,
}: ReusableDialogProps<T>) {
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
    if (typeof date === 'string') {
      const parsedDate = new Date(date);
      return isNaN(parsedDate.getTime()) ? null : format(parsedDate, "PPP");
    }
    
    // Handle Date objects
    if (date instanceof Date) {
      return isNaN(date.getTime()) ? null : format(date, "PPP");
    }
    
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {Object.keys(defaultValues).map((fieldName) => (
              <FormField
                key={fieldName}
                control={form.control}
                name={String(fieldName)}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}
                    </FormLabel>
                    <FormControl>
                      {fieldName === "date" ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                formatDateSafely(field.value) || "Invalid date"
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={(date) => {
                                // Ensure we're passing a proper Date object
                                field.onChange(date || undefined);
                              }}
                              initialFocus
                              disabled={(date) =>
                                // Optional: disable future dates
                                // date > new Date() || 
                                date < new Date("1900-01-01")
                              }
                            />
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <Input
                          type={fieldName === "amount" ? "number" : "text"}
                          {...field}
                          // Ensure controlled input
                          value={field.value || ""}
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            <Button type="submit" className="mt-4 w-full hover:pointer">
              Submit
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}