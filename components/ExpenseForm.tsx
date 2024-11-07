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
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Autocomplete } from "@/components/ui/autocomplete"
import { ReceiptScanner } from "@/components/ui/receipt-scanner"

interface ExpenseFormProps {
  onSuccess?: () => void;
  editData?: any;
  mode: 'create' | 'edit';
}

const formSchema = z.object({
  category: z.string({
    required_error: "Please select a category.",
  }),
  date: z.string(),
  name: z.string().min(2, "Name must be at least 2 characters."),
  price: z.number().positive("Price must be positive."),
  store: z.string().optional(),
  additionalDetails: z.string().optional(),
  isLongTermBuy: z.boolean().default(false),
  expectedDuration: z.number().optional(),
  durationUnit: z.enum(["days", "months", "years"]).optional(),
})

export function ExpenseForm({ onSuccess, editData, mode = 'create' }: ExpenseFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [storeOptions, setStoreOptions] = useState<string[]>([])
  const [nameOptions, setNameOptions] = useState<string[]>([])
  const [fetchError, setFetchError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: editData?.category || "", // Set initial value here
      date: new Date().toISOString().split('T')[0],
      name: "",
      price: 0,
      store: "",
      additionalDetails: "",
      isLongTermBuy: false,
      expectedDuration: undefined,
      durationUnit: undefined,
    },
  })

  // Fetch categories first
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/budget');
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        const data = await response.json();
        const categoryList = data.budgetData
          .map((item: any) => item.category)
          .filter((category: string) => category !== 'Total' && category !== 'Grocery');
        setCategories(categoryList);
      } catch (error) {
        setFetchError('Failed to load categories. Please refresh the page.');
        toast({
          title: "Error",
          description: "Failed to load categories. Please refresh the page.",
          variant: "destructive",
        });
      }
    }

    fetchCategories();
  }, [toast]);

  // Then set form values after categories are loaded
  useEffect(() => {
    if (mode === 'edit' && editData && categories.length > 0) {
      try {
        form.reset({
          category: editData.category,
          date: editData.date,
          name: editData.name,
          price: editData.price,
          store: editData.store || '',
          additionalDetails: editData.additionalDetails || '',
          isLongTermBuy: editData.isLongTermBuy,
          expectedDuration: editData.expectedDuration || undefined,
          durationUnit: editData.durationUnit || undefined,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load expense data. Please try again.",
          variant: "destructive",
        });
      }
    }
  }, [mode, editData, categories, form, toast]);

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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/expenses', {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          mode === 'create' 
            ? { values: [values] }
            : { id: editData.id, values: { ...values, isGrocery: false } }
        ),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${mode} expense`);
      }

      const result = await response.json();
      
      toast({
        title: `Expense ${mode === 'create' ? 'added' : 'updated'} successfully`,
        description: mode === 'create' 
          ? `Your new expense has been recorded with ID: ${result.id}`
          : 'Your expense has been updated',
        variant: "default",
      });

      onSuccess?.();
      if (mode === 'create') {
        form.reset();
      }
    } catch (error) {
      console.error(`Error ${mode}ing expense:`, error);
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
    if (receiptData.name) {
      form.setValue('name', receiptData.name);
    }
    if (receiptData.date) {
      form.setValue('date', receiptData.date);
    }
    if (receiptData.price) {
      form.setValue('price', receiptData.price);
    }
    if (receiptData.store) {
      form.setValue('store', receiptData.store);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{mode === 'create' ? 'Add Expense' : 'Edit Expense'}</CardTitle>
            <CardDescription>{mode === 'create' ? 'Enter details for a new expense' : 'Update expense details'}</CardDescription>
          </div>
          <ReceiptScanner onScanComplete={handleScanComplete} type="expense" />
        </div>
      </CardHeader>
      <CardContent>
        {fetchError && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
            {fetchError}
          </div>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
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
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Autocomplete
                        {...field}
                        options={nameOptions}
                        placeholder="Select or enter a name"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        {...field} 
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === '' ? 0 : parseFloat(value));
                        }}
                        value={field.value || ''} // Convert 0 to empty string for display
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="store"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store/Service Provider (Optional)</FormLabel>
                    <FormControl>
                      <Autocomplete
                        {...field}
                        options={storeOptions}
                        placeholder="Select or enter a store"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="additionalDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Details (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
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
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value === '' ? undefined : parseInt(value));
                          }}
                          value={field.value || ''} // Convert undefined to empty string
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="durationUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration Unit</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
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
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting || Object.keys(form.formState.errors).length > 0}
            >
              {isSubmitting ? "Submitting..." : mode === 'create' ? "Add Expense" : "Update Expense"}
            </Button>
            {Object.keys(form.formState.errors).length > 0 && (
              <div className="p-4 bg-red-100 text-red-700 rounded-md mt-4">
                <p className="font-semibold">Please fix the following errors:</p>
                <ul className="list-disc list-inside">
                  {Object.entries(form.formState.errors).map(([field, error]) => (
                    <li key={field}>{error?.message}</li>
                  ))}
                </ul>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
