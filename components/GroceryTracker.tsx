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
})

export function GroceryTracker() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    },
  })

  const handleUnitChange = (value: string) => {
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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    console.log("Submitting grocery item:", values)

    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: [{ ...values, isGrocery: true }] }),
      })

      if (!response.ok) {
        throw new Error('Failed to add grocery item')
      }

      const result = await response.json()
      console.log("Server response:", result)

      toast({
        title: "Grocery item added successfully",
        description: `Your new grocery item has been recorded with ID: ${result.id}`,
        variant: "default",
      })

      form.reset()
    } catch (error) {
      console.error("Error submitting grocery item:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
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
                <Input
                  id="name"
                  {...form.register('name')}
                  placeholder="Enter item name"
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
                <Input
                  id="store"
                  {...form.register('store')}
                  placeholder="Enter store name"
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
                      <Select onValueChange={handleUnitChange} value={field.value}>
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

            <div className="space-y-2">
              <Label htmlFor="additionalDetails">Additional Details (Optional)</Label>
              <Textarea
                id="additionalDetails"
                {...form.register('additionalDetails')}
                placeholder="Enter additional details"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Add Grocery Item"}
            </Button>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  )
}
