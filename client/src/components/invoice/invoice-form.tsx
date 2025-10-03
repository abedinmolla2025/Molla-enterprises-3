import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Plus, X, ArrowLeft, Eye } from "lucide-react";
import InvoicePreview from "./invoice-preview";
import InvoiceModal from "@/components/modals/invoice-modal";
import type { Client, InvoiceWithClient, Settings } from "@shared/schema";

const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.coerce.number().min(0.01, "Quantity must be greater than 0"),
  rate: z.coerce.number().min(0, "Rate must be non-negative"),
  taxRate: z.coerce.number().min(0).max(100),
  discountRate: z.coerce.number().min(0).max(100),
});

const invoiceFormSchema = z.object({
  clientId: z.string().min(1, "Please select a client"),
  date: z.string().min(1, "Date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  status: z.enum(["draft", "sent", "paid", "overdue"]),
  currency: z.enum(["INR", "USD", "EUR", "GBP"]),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
});

type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

interface InvoiceFormProps {
  invoice?: InvoiceWithClient | null;
  onClose: () => void;
}

export default function InvoiceForm({ invoice, onClose }: InvoiceFormProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<InvoiceWithClient | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: settings = [] } = useQuery<Settings[]>({
    queryKey: ["/api/settings"],
  });

  const { data: nextInvoiceNumber } = useQuery<{ invoiceNumber: string }>({
    queryKey: ["/api/invoices/next/number"],
    enabled: !invoice, // Only fetch for new invoices
  });

  const getSettingValue = (key: string, defaultValue: string = "") => {
    const setting = settings.find(s => s.key === key);
    return setting?.value || defaultValue;
  };

  const defaultCurrency = getSettingValue("defaultCurrency", "INR");
  const defaultDueDays = parseInt(getSettingValue("defaultDueDays", "30"));

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      clientId: invoice?.clientId || "",
      date: invoice?.date ? new Date(invoice.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      dueDate: invoice?.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : "",
      status: invoice?.status || "draft",
      currency: invoice?.currency || defaultCurrency as any,
      notes: invoice?.notes || "",
      items: invoice?.items.map(item => ({
        description: item.description,
        quantity: parseFloat(item.quantity),
        rate: parseFloat(item.rate),
        taxRate: parseFloat(item.taxRate),
        discountRate: parseFloat(item.discountRate),
      })) || [
        {
          description: "",
          quantity: undefined,
          rate: undefined,
          taxRate: 18,
          discountRate: 0,
        }
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Set due date automatically when date changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "date" && value.date && !invoice) {
        const invoiceDate = new Date(value.date);
        const dueDate = new Date(invoiceDate);
        dueDate.setDate(dueDate.getDate() + defaultDueDays);
        form.setValue("dueDate", dueDate.toISOString().split('T')[0]);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, defaultDueDays, invoice]);

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: InvoiceFormData) => {
      const { items, ...invoiceData } = data;
      
      // Calculate totals
      const calculatedItems = items.map(item => {
        const lineSubtotal = item.quantity * item.rate;
        const discount = (lineSubtotal * item.discountRate) / 100;
        const subtotalAfterDiscount = lineSubtotal - discount;
        const tax = (subtotalAfterDiscount * item.taxRate) / 100;
        const amount = subtotalAfterDiscount + tax;
        
        return {
          description: item.description,
          quantity: item.quantity.toString(),
          rate: item.rate.toString(),
          taxRate: item.taxRate.toString(),
          discountRate: item.discountRate.toString(),
          amount: amount.toString(),
        };
      });

      const subtotal = calculatedItems.reduce((sum, item) => {
        const lineSubtotal = parseFloat(item.quantity) * parseFloat(item.rate);
        return sum + lineSubtotal;
      }, 0);

      const totalDiscount = calculatedItems.reduce((sum, item) => {
        const lineSubtotal = parseFloat(item.quantity) * parseFloat(item.rate);
        const discount = (lineSubtotal * parseFloat(item.discountRate)) / 100;
        return sum + discount;
      }, 0);

      const totalTax = calculatedItems.reduce((sum, item) => {
        const lineSubtotal = parseFloat(item.quantity) * parseFloat(item.rate);
        const discount = (lineSubtotal * parseFloat(item.discountRate)) / 100;
        const subtotalAfterDiscount = lineSubtotal - discount;
        const tax = (subtotalAfterDiscount * parseFloat(item.taxRate)) / 100;
        return sum + tax;
      }, 0);

      const total = subtotal - totalDiscount + totalTax;

      const invoicePayload = {
        ...invoiceData,
        invoiceNumber: nextInvoiceNumber?.invoiceNumber || "INV-0001",
        date: data.date,
        dueDate: data.dueDate,
        subtotal: subtotal.toString(),
        taxAmount: totalTax.toString(),
        discountAmount: totalDiscount.toString(),
        total: total.toString(),
      };

      await apiRequest("POST", "/api/invoices", {
        invoice: invoicePayload,
        items: calculatedItems,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create invoice",
        variant: "destructive",
      });
    },
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: async (data: InvoiceFormData) => {
      if (!invoice) throw new Error("No invoice to update");
      
      const { items, ...invoiceData } = data;
      
      // Calculate totals
      const calculatedItems = items.map(item => {
        const lineSubtotal = item.quantity * item.rate;
        const discount = (lineSubtotal * item.discountRate) / 100;
        const subtotalAfterDiscount = lineSubtotal - discount;
        const tax = (subtotalAfterDiscount * item.taxRate) / 100;
        const amount = subtotalAfterDiscount + tax;
        
        return {
          description: item.description,
          quantity: item.quantity.toString(),
          rate: item.rate.toString(),
          taxRate: item.taxRate.toString(),
          discountRate: item.discountRate.toString(),
          amount: amount.toString(),
        };
      });

      const subtotal = calculatedItems.reduce((sum, item) => {
        const lineSubtotal = parseFloat(item.quantity) * parseFloat(item.rate);
        return sum + lineSubtotal;
      }, 0);

      const totalDiscount = calculatedItems.reduce((sum, item) => {
        const lineSubtotal = parseFloat(item.quantity) * parseFloat(item.rate);
        const discount = (lineSubtotal * parseFloat(item.discountRate)) / 100;
        return sum + discount;
      }, 0);

      const totalTax = calculatedItems.reduce((sum, item) => {
        const lineSubtotal = parseFloat(item.quantity) * parseFloat(item.rate);
        const discount = (lineSubtotal * parseFloat(item.discountRate)) / 100;
        const subtotalAfterDiscount = lineSubtotal - discount;
        const tax = (subtotalAfterDiscount * parseFloat(item.taxRate)) / 100;
        return sum + tax;
      }, 0);

      const total = subtotal - totalDiscount + totalTax;

      const invoicePayload = {
        ...invoiceData,
        date: data.date,
        dueDate: data.dueDate,
        subtotal: subtotal.toString(),
        taxAmount: totalTax.toString(),
        discountAmount: totalDiscount.toString(),
        total: total.toString(),
      };

      await apiRequest("PUT", `/api/invoices/${invoice.id}`, {
        invoice: invoicePayload,
        items: calculatedItems,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Invoice updated successfully",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update invoice",
        variant: "destructive",
      });
    },
  });

  const handleAddItem = () => {
    append({
      description: "",
      quantity: undefined,
      rate: undefined,
      taxRate: 18,
      discountRate: 0,
    });
  };

  const handleRemoveItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const handlePreview = () => {
    const formData = form.getValues();
    const selectedClient = clients.find(c => c.id === formData.clientId);
    
    if (!selectedClient) {
      toast({
        title: "Error",
        description: "Please select a client to preview the invoice",
        variant: "destructive",
      });
      return;
    }

    // Calculate totals for preview
    const calculatedItems = formData.items.map(item => {
      const lineSubtotal = item.quantity * item.rate;
      const discount = (lineSubtotal * item.discountRate) / 100;
      const subtotalAfterDiscount = lineSubtotal - discount;
      const tax = (subtotalAfterDiscount * item.taxRate) / 100;
      const amount = subtotalAfterDiscount + tax;
      
      return {
        id: Math.random().toString(), // Temporary ID for preview
        invoiceId: "preview",
        description: item.description,
        quantity: item.quantity.toString(),
        rate: item.rate.toString(),
        taxRate: item.taxRate.toString(),
        discountRate: item.discountRate.toString(),
        amount: amount.toString(),
      };
    });

    const subtotal = calculatedItems.reduce((sum, item) => {
      const lineSubtotal = parseFloat(item.quantity) * parseFloat(item.rate);
      return sum + lineSubtotal;
    }, 0);

    const totalDiscount = calculatedItems.reduce((sum, item) => {
      const lineSubtotal = parseFloat(item.quantity) * parseFloat(item.rate);
      const discount = (lineSubtotal * parseFloat(item.discountRate)) / 100;
      return sum + discount;
    }, 0);

    const totalTax = calculatedItems.reduce((sum, item) => {
      const lineSubtotal = parseFloat(item.quantity) * parseFloat(item.rate);
      const discount = (lineSubtotal * parseFloat(item.discountRate)) / 100;
      const subtotalAfterDiscount = lineSubtotal - discount;
      const tax = (subtotalAfterDiscount * parseFloat(item.taxRate)) / 100;
      return sum + tax;
    }, 0);

    const total = subtotal - totalDiscount + totalTax;

    const previewData: InvoiceWithClient = {
      id: "preview",
      invoiceNumber: invoice?.invoiceNumber || nextInvoiceNumber?.invoiceNumber || "INV-0001",
      clientId: formData.clientId,
      date: formData.date,
      dueDate: formData.dueDate,
      status: formData.status,
      currency: formData.currency,
      subtotal: subtotal.toString(),
      taxAmount: totalTax.toString(),
      discountAmount: totalDiscount.toString(),
      total: total.toString(),
      notes: formData.notes || null,
      createdAt: new Date().toISOString(),
      client: selectedClient,
      items: calculatedItems,
    };

    setPreviewInvoice(previewData);
    setIsModalOpen(true);
  };

  const onSubmit = (data: InvoiceFormData) => {
    if (invoice) {
      updateInvoiceMutation.mutate(data);
    } else {
      createInvoiceMutation.mutate(data);
    }
  };

  const isLoading = createInvoiceMutation.isPending || updateInvoiceMutation.isPending;

  // Calculate totals for display
  const watchedItems = form.watch("items");
  const totals = watchedItems.reduce((acc, item) => {
    const lineSubtotal = (item.quantity || 0) * (item.rate || 0);
    const discount = (lineSubtotal * (item.discountRate || 0)) / 100;
    const subtotalAfterDiscount = lineSubtotal - discount;
    const tax = (subtotalAfterDiscount * (item.taxRate || 0)) / 100;
    
    acc.subtotal += lineSubtotal;
    acc.discount += discount;
    acc.tax += tax;
    return acc;
  }, { subtotal: 0, discount: 0, tax: 0 });

  const grandTotal = totals.subtotal - totals.discount + totals.tax;

  const formatCurrency = (amount: number) => {
    const currency = form.watch("currency") || defaultCurrency;
    if (currency === "INR") {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
      }).format(amount);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h2 className="font-lora text-3xl font-bold text-gray-900" data-testid="page-title">
            {invoice ? "Edit Invoice" : "Create New Invoice"}
          </h2>
        </div>
        <Button
          onClick={handlePreview}
          variant="outline"
          className="text-gray-600 hover:text-gray-900"
          data-testid="button-preview"
        >
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h3>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Invoice Number and Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Invoice Number</Label>
                    <Input
                      value={invoice?.invoiceNumber || nextInvoiceNumber?.invoiceNumber || "INV-0001"}
                      disabled
                      className="bg-gray-50 text-gray-500"
                      data-testid="input-invoice-number"
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            data-testid="input-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Client and Due Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Client</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-client">
                              <SelectValue placeholder="Choose a client..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.companyName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            data-testid="input-due-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Status and Currency */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-status">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="sent">Sent</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-currency">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                            <SelectItem value="USD">US Dollar ($)</SelectItem>
                            <SelectItem value="EUR">Euro (€)</SelectItem>
                            <SelectItem value="GBP">British Pound (£)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Items Section */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-sm font-medium text-gray-700">Invoice Items</Label>
                    <Button
                      type="button"
                      onClick={handleAddItem}
                      variant="outline"
                      size="sm"
                      className="text-blue-600 hover:text-blue-800"
                      data-testid="button-add-item"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Item
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-12 gap-2 p-3 border border-gray-200 rounded-md">
                        <div className="col-span-4">
                          <FormField
                            control={form.control}
                            name={`items.${index}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    placeholder="Item Name / Description"
                                    {...field}
                                    className="text-sm"
                                    data-testid={`input-item-description-${index}`}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-span-2">
                          <FormField
                            control={form.control}
                            name={`items.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="Quantity"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    value={field.value ?? ""}
                                    className="text-sm"
                                    data-testid={`input-item-quantity-${index}`}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-span-2">
                          <FormField
                            control={form.control}
                            name={`items.${index}.rate`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="Rate / Price"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    value={field.value ?? ""}
                                    className="text-sm"
                                    data-testid={`input-item-rate-${index}`}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-span-2">
                          <FormField
                            control={form.control}
                            name={`items.${index}.taxRate`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="GST/Tax %"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    className="text-sm"
                                    data-testid={`input-item-tax-${index}`}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-span-1">
                          <FormField
                            control={form.control}
                            name={`items.${index}.discountRate`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="Discount %"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    className="text-sm"
                                    data-testid={`input-item-discount-${index}`}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-span-1 flex items-center">
                          <Button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-800 p-0"
                            disabled={fields.length === 1}
                            data-testid={`button-remove-item-${index}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-medium" data-testid="text-subtotal">
                        {formatCurrency(totals.subtotal)}
                      </span>
                    </div>
                    {totals.tax > 0 && (
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span className="font-medium" data-testid="text-tax">
                          {formatCurrency(totals.tax)}
                        </span>
                      </div>
                    )}
                    {totals.discount > 0 && (
                      <div className="flex justify-between">
                        <span>Discount:</span>
                        <span className="font-medium text-red-600" data-testid="text-discount">
                          -{formatCurrency(totals.discount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span data-testid="text-total">
                        {formatCurrency(grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Add any additional notes..."
                          {...field}
                          data-testid="input-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <Button
                    type="submit"
                    className="gradient-bg hover:opacity-90"
                    disabled={isLoading}
                    data-testid="button-save-invoice"
                  >
                    {invoice ? "Update Invoice" : "Save Invoice"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isLoading}
                    data-testid="button-cancel-invoice"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Live Preview */}
        <Card className="max-h-[800px] overflow-y-auto">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Preview</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {previewInvoice ? (
                <div className="transform scale-[0.7] origin-top-left w-[142.86%]">
                  <InvoicePreview invoice={previewInvoice} />
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  Select a client and add items to see the live preview
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <InvoiceModal
        invoice={previewInvoice}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
