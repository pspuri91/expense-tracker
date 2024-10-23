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

const formSchema = z.object({
  date: z.string(),
  name: z.string().min(2, "Name must be at least 2 characters."),
  price: z.number().positive("Price must be positive."),
  store: z.string().min(2, "Store name must be at least 2 characters."),
  additionalDetails: z.string().optional(),
  quantity: z.number().positive("Quantity must be positive."),
  subCategory: z.enum(["Vegies", "Non-veg", "Dairy", "Fruits", "Long-Term", "Snacks"]),
  unit: z.enum(["per kg/per lb", "each"]),
  sellerRate: z.number().positive("Seller rate must be positive."),
  sellerRateInLb: z.number().positive("Seller rate in lb must be positive."),
  isLongTermBuy: z.boolean().default(false),
  expectedDuration: z.number().optional(),
  durationUnit: z.enum(["days", "months", "years"]).optional(),
})

interface GroceryTrackerProps {
  onSuccess?: () => void;
  editData?: any;
  mode: 'create' | 'edit';
}

export function GroceryTracker({ onSuccess, editData, mode = 'create' }: GroceryTrackerProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [storeOptions, setStoreOptions] = useState<string[]>([])
  const [nameOptions, setNameOptions] = useState<string[]>([])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      name: "",
      price: 0,
      store: "",
      additionalDetails: "",
      quantity: 1,
      subCategory: "Vegies",
      unit: "per kg/per lb",
      sellerRate: 0,
      sellerRateInLb: 0,
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

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Add Grocery Item</CardTitle>
        <CardDescription>Enter details for a new grocery item</CardDescription>
      </CardHeader>
      <CardContent>
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
                  {...form.register('price', { valueAsNumber: true })}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  {...form.register('quantity', { valueAsNumber: true })}
                  placeholder="Enter quantity"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subCategory">Sub-Category</Label>
                <Select onValueChange={(value) => form.setValue('subCategory', value as any)} defaultValue={form.getValues('subCategory')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sub-category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vegies">Vegies</SelectItem>
                    <SelectItem value="Non-veg">Non-veg</SelectItem>
                    <SelectItem value="Dairy">Dairy</SelectItem>
                    <SelectItem value="Fruits">Fruits</SelectItem>
                    <SelectItem value="Long-Term">Long-Term</SelectItem>
                    <SelectItem value="Snacks">Snacks</SelectItem>
                  </SelectContent>
                </Select>
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
                  <Controller
                    name="sellerRate"
                    control={form.control}
                    render={({ field }) => (
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => handleSellerRateChange(parseFloat(e.target.value))}
                      />
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sellerRateInLb">Seller Rate (per lb)</Label>
                  <Controller
                    name="sellerRateInLb"
                    control={form.control}
                    render={({ field }) => (
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => handleSellerRateInLbChange(parseFloat(e.target.value))}
                      />
                    )}
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
