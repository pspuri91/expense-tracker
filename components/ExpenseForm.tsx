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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: "",
      date: new Date().toISOString().split('T')[0],
      name: "",
      price: 0,
      store: "",
      additionalDetails: "",
      isLongTermBuy: false,
    },
  })

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/budget');
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        const data = await response.json();
        setCategories(data.budgetData.map((item: any) => item.category).filter((category: string) => category !== 'Total'));
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    }

    fetchCategories();
  }, []);

  useEffect(() => {
    if (mode === 'edit' && editData) {
      form.reset({
        category: editData.category,
        date: editData.date,
        name: editData.name,
        price: editData.price,
        store: editData.store || '',
        additionalDetails: editData.additionalDetails || '',
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
            : { id: editData.id, values: values }
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

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Add Expense</CardTitle>
        <CardDescription>Enter details for a new expense</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                    </FormControl>
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
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
