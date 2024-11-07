"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, FormProvider, Controller } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Autocomplete } from "@/components/ui/autocomplete"; // Assume you have an Autocomplete component
import { ReceiptScanner } from "@/components/ui/receipt-scanner"

const formSchema = z.object({
  date: z.string(),
  name: z.string().min(2, "Name must be at least 2 characters."),
  price: z.number().positive("Price must be positive.").optional(),
  store: z.string().min(2, "Store name must be at least 2 characters.").optional(),
  additionalDetails: z.string().optional(),
  quantity: z.string().optional(),
  subCategory: z.enum(["Vegies", "Non-veg", "Dairy", "Fruits", "Long-Term", "Snacks"]).optional(),
  unit: z.enum(["per kg/per lb", "each"]).optional(),
  sellerRate: z.number().positive("Seller rate must be positive.").optional(),
  sellerRateInLb: z.number().positive("Seller rate in lb must be positive.").optional(),
  isLongTermBuy: z.boolean().default(false).optional(),
  expectedDuration: z.number().optional(),
  durationUnit: z.enum(["days", "months", "years"]).optional(),
})

interface GroceryTrackerProps {
  onSuccess?: () => void;
  editData?: any;
  mode: 'create' | 'edit';}

export function GroceryTracker({ onSuccess, editData, mode = 'create' }: GroceryTrackerProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [storeOptions, setStoreOptions] = useState<string[]>([])
  const [nameOptions, setNameOptions] = useState<string[]>([])
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [subCategoryOptions, setSubCategoryOptions] = useState<string[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      name: "",
      price: undefined,
      store: "",
      additionalDetails: "",
      quantity: "",
      subCategory: "Vegies",
      unit: "per kg/per lb",
      sellerRate: undefined,
      sellerRateInLb: undefined,
      isLongTermBuy: false,
      expectedDuration: undefined,
      durationUnit: undefined,
    },
  })

  const handleUnitChange = (value: "per kg/per lb" | "each") => {
    form.setValue('unit', value);
    form.setValue('sellerRate', 0);
    form.setValue('sellerRateInLb', 0);
  };

  const handleSellerRateChange = (value: number) => {
    form.setValue('sellerRate', value);
    if (form.getValues('unit') === 'per kg/per lb') {
      form.setValue('sellerRateInLb', value / 2.20462);
    }
  };

  const handleSellerRateInLbChange = (value: number) => {
    form.setValue('sellerRateInLb', value);
    if (form.getValues('unit') === 'per kg/per lb') {
      form.setValue('sellerRate', value * 2.20462);
    }
  };

  // Add useEffect to populate form when editing
  useEffect(() => {
    if (mode === 'edit' && editData) {
      form.reset({
        date: editData.date,
        name: editData.name,
        price: editData.price,
        store: editData.store,
        additionalDetails: editData.additionalDetails,
        quantity: editData.quantity,
        subCategory: editData.subCategory,
        unit: editData.unit,
        sellerRate: editData.sellerRate,
        sellerRateInLb: editData.sellerRateInLb,
        isLongTermBuy: editData.isLongTermBuy,
        expectedDuration: editData.expectedDuration,
        durationUnit: editData.durationUnit,
      });
    }
  }, [mode, editData, form]);

  useEffect(() => {
    async function fetchStoreNames() {
      try {
        const response = await fetch('/api/stores');
        if (!response.ok) {
          throw new Error('Failed to fetch store names');
        }
        const data = await response.json();
        setStoreOptions(data);
      } catch (error) {
        console.error('Error fetching store names:', error);
        toast({
          title: "Error",
          description: "Failed to load store suggestions. You can still enter store names manually.",
          variant: "destructive",
        });
      }
    }

    fetchStoreNames();
  }, []);

  useEffect(() => {
    async function fetchNames() {
      try {
        const response = await fetch('/api/names');
        if (!response.ok) {
          throw new Error('Failed to fetch names');
        }
        const data = await response.json();
        setNameOptions(data);
      } catch (error) {
        console.error('Error fetching names:', error);
      }
    }

    fetchNames();
  }, []);

  useEffect(() => {
    async function fetchSubCategories() {
      try {
        const response = await fetch('/api/subcategories'); // This should now point to the new API route
        if (!response.ok) {
          throw new Error('Failed to fetch sub-category names');
        }
        const data = await response.json();
        setSubCategoryOptions(data);
      } catch (error) {
        console.error('Error fetching sub-category names:', error);
        toast({
          title: "Error",
          description: "Failed to load sub-category suggestions. You can still enter sub-categories manually.",
          variant: "destructive",
        });
      }
    }

    fetchSubCategories();
  }, []);

  // Update onSubmit to handle both create and edit
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    const submissionData = {
      ...values,
      isGrocery: true,
      unit: values.unit
    };

    try {
      const response = await fetch('/api/expenses', {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          mode === 'create' 
            ? { values: [submissionData] }
            : { id: editData.id, values: submissionData }
        ),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${mode} grocery item`);
      }

      const result = await response.json();
      
      toast({
        title: `Grocery item ${mode === 'create' ? 'added' : 'updated'} successfully`,
        description: mode === 'create' 
          ? `Your new grocery item has been recorded with ID: ${result.id}`
          : 'Your grocery item has been updated',
        variant: "default",
      });

      onSuccess?.();
      if (mode === 'create') {
        form.reset();
      }
    } catch (error) {
      console.error(`Error ${mode}ing grocery item:`, error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleScanComplete = (receiptData: any) => {
    if (receiptData.date) {
      form.setValue('date', receiptData.date);
    }
    if (receiptData.name) {
      form.setValue('name', receiptData.name);
    }
    if (receiptData.price) {
      form.setValue('price', receiptData.price);
    }
    if (receiptData.store) {
      form.setValue('store', receiptData.store);
    }
    if (receiptData.category) {
      form.setValue('subCategory', receiptData.category);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{mode === 'create' ? 'Add Grocery Item' : 'Edit Grocery Item'}</CardTitle>
            <CardDescription>Enter details for a grocery item</CardDescription>
          </div>
          <ReceiptScanner onScanComplete={handleScanComplete} type="grocery" />
        </div>
      </CardHeader>
      <CardContent>
        {fetchError && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
            {fetchError}
          </div>
        )}
        {Object.keys(form.formState.errors).length > 0 && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
            <p className="font-semibold">Please fix the following errors:</p>
            <ul className="list-disc list-inside">
              {Object.entries(form.formState.errors).map(([field, error]) => (
                <li key={field}>{error?.message}</li>
              ))}
            </ul>
          </div>
        )}
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  {...form.register('date')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Controller
                  name="name"
                  control={form.control}
                  defaultValue={editData?.name || ''}
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      options={nameOptions}
                      placeholder="Select or enter a name"
                    />
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  {...form.register('price', { 
                    setValueAs: (value: string) => value === '' ? 0 : parseFloat(value)
                  })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="text"
                  {...form.register('quantity')}
                  placeholder="Enter quantity (e.g., 1 lb, 1kg, 1500gm)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subCategory">Sub-Category</Label>
                <Controller
                  name="subCategory"
                  control={form.control}
                  defaultValue={editData?.subCategory || ''}
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      options={subCategoryOptions}
                      placeholder="Select or enter a sub-category"
                    />
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="store">Store</Label>
                <Controller
                  name="store"
                  control={form.control}
                  defaultValue={editData?.store || ''}
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      options={storeOptions}
                      placeholder="Select or enter a store"
                    />
                  )}
                />
              </div>
            </div>
            
            {/* Group Unit and Seller Rate fields */}
            <Card className="p-4 bg-gray-50 dark:bg-gray-800">
              <h3 className="text-lg font-semibold mb-2">Pricing Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Controller
                    name="unit"
                    control={form.control}
                    render={({ field }) => (
                      <Select 
                        onValueChange={(value: "per kg/per lb" | "each") => {
                          field.onChange(value); // Update the form field
                          handleUnitChange(value); // Handle additional logic
                        }} 
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="per kg/per lb">per kg/per lb</SelectItem>
                          <SelectItem value="each">each</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sellerRate">Seller Rate (per kg)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register('sellerRate', { 
                      setValueAs: (value: string) => value === '' ? 0 : parseFloat(value)
                    })}
                    onChange={(e) => handleSellerRateChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sellerRateInLb">Seller Rate (per lb)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register('sellerRateInLb', { 
                      setValueAs: (value: string) => value === '' ? 0 : parseFloat(value)
                    })}
                    onChange={(e) => handleSellerRateInLbChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                  />
                </div>
              </div>
            </Card>

            <FormField
              control={form.control}
              name="isLongTermBuy"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Long Term Buy
                    </FormLabel>
                    <FormDescription>
                      Check this if this is a long-term purchase
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {form.watch("isLongTermBuy") && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="expectedDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Duration</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="durationUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration Unit</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="days">Days</SelectItem>
                          <SelectItem value="months">Months</SelectItem>
                          <SelectItem value="years">Years</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="additionalDetails">Additional Details (Optional)</Label>
              <Textarea
                id="additionalDetails"
                {...form.register('additionalDetails')}
                placeholder="Enter additional details"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : mode === 'create' ? "Add Grocery Item" : "Update Grocery Item"}
            </Button>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  )
}
