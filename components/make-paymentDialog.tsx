/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  FormField,
  FormItem,
  FormLabel,
  Form,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { CalendarIcon, CreditCard, Smartphone } from "lucide-react";
import {
  PaymentInputSchema,
  MobileMoneyPaymentSchema,
  BankTransferPaymentSchema,
} from "@/lib/validations";
import { z } from "zod";
import handleError from "@/lib/handler/error";

interface MakePaymentDialogProps<T extends z.infer<typeof PaymentInputSchema>> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  id: string;
  alreadyApproved?: boolean;
  isApprove?: boolean;
  alreadyPaid?: boolean;
  onSubmit: (data: T) => void | Promise<ActionResponse | void>;
}

export default function MakePaymentDialog<T extends z.infer<typeof PaymentInputSchema>>({
  open,
  onOpenChange,
  id,
  alreadyApproved,
  isApprove,
  alreadyPaid,
  onSubmit,
}: MakePaymentDialogProps<T>) {
  const [paymentMethod, setPaymentMethod] = useState<"mobile" | "bank" | "">(
    ""
  );

  // Get the appropriate schema based on payment method
  const getSchema = () => {
    if (paymentMethod === "mobile") return MobileMoneyPaymentSchema;
    if (paymentMethod === "bank") return BankTransferPaymentSchema;
    return PaymentInputSchema;
  };

  const form = useForm<z.infer<typeof PaymentInputSchema>>({
    resolver: zodResolver(getSchema()) as unknown as any,
    defaultValues: {},
  });

  const handleOnSubmit = async (data: any) => {
    try {
      // Add the expense ID to the payment data
      const paymentData = {
        ...data,
        expenseId: id,
      };

      const result = (await onSubmit(paymentData)) as ActionResponse;
      if (result?.success) {
        toast.success("Payment created successfully!");
        onOpenChange(true);
        form.reset();
        setPaymentMethod("");
      }
    } catch (error) {
      return handleError(error);
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

  const handlePaymentMethodChange = (value: "mobile" | "bank") => {
    setPaymentMethod(value);
    form.setValue("paymentMethod", value as "mobile" | "bank");
  };

  // If already paid, show disabled button
  if (alreadyPaid) {
    return (
      <Button
        variant="secondary"
        disabled
        className="fixed bottom-4 right-4 z-50"
      >
        Payment Already Made
      </Button>
    );
  }

  // If not approved yet and not in approve mode, show disabled button
  if (!alreadyApproved && !isApprove) {
    return (
      <Button
        variant="destructive"
        disabled
        className="fixed bottom-4 right-4 z-50"
      >
        Cannot Make Payment (Not Approved)
      </Button>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) {
          form.reset();
          setPaymentMethod("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="fixed bottom-4 right-4 z-50 bg-green-600 hover:bg-green-500 text-white shadow-lg">
          Make Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Make Payment</DialogTitle>
          <DialogDescription>
            Select your payment method and fill in the required information.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleOnSubmit)}
            className="space-y-4"
          >
            {/* Payment Method Selection */}
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method *</FormLabel>
                  <Select
                    onValueChange={(value: "mobile" | "bank") => {
                      field.onChange(value);
                      handlePaymentMethodChange(value as "mobile" | "bank");
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="mobile">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4" />
                          Mobile Money
                        </div>
                      </SelectItem>
                      <SelectItem value="bank">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          Bank Transfer
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Mobile Money Fields */}
            {paymentMethod === "mobile" && (
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 text-sm">
                  Mobile Money Details
                </h3>

                <FormField
                  control={form.control}
                  name="mobileNetwork"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Network *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select network" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="mtn">MTN Mobile Money</SelectItem>
                          <SelectItem value="vodafone">
                            Vodafone Cash
                          </SelectItem>
                          <SelectItem value="airteltigo">
                            AirtelTigo Money
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="recipientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipient Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter recipient name"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="e.g., 0240000000"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Bank Transfer Fields */}
            {paymentMethod === "bank" && (
              <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-900 text-sm">
                  Bank Transfer Details
                </h3>

                <FormField
                  control={form.control}
                  name="accountName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter account holder name"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select bank" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="gcb">GCB Bank</SelectItem>
                          <SelectItem value="ecobank">Ecobank Ghana</SelectItem>
                          <SelectItem value="absa">Absa Bank Ghana</SelectItem>
                          <SelectItem value="zenith">
                            Zenith Bank Ghana
                          </SelectItem>
                          <SelectItem value="fidelity">
                            Fidelity Bank Ghana
                          </SelectItem>
                          <SelectItem value="stanbic">
                            Stanbic Bank Ghana
                          </SelectItem>
                          <SelectItem value="cal">CAL Bank</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter account number"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Date Picker - Only shows if payment method is selected */}
            {paymentMethod && (
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
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
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date || undefined);
                          }}
                          initialFocus
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                            date >
                              new Date(new Date().setHours(23, 59, 59, 999))
                          }
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Description Field - Only shows if payment method is selected */}
            {paymentMethod && (
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add payment description or notes (optional)"
                        rows={3}
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Submit Button */}
            {paymentMethod && (
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Submit Payment
                </Button>
              </div>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
