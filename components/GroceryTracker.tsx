"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

const initialGroceryItems = [
  { id: 1, name: "Apples", price: 2.99, unit: "lb", lastPurchased: "2023-04-10", store: "Whole Foods" },
  { id: 2, name: "Milk", price: 3.50, unit: "gallon", lastPurchased: "2023-04-12", store: "Safeway" },
  { id: 3, name: "Bread", price: 2.50, unit: "loaf", lastPurchased: "2023-04-15", store: "Trader Joe's" },
  { id: 4, name: "Eggs", price: 3.99, unit: "dozen", lastPurchased: "2023-04-11", store: "Costco" },
  { id: 5, name: "Chicken", price: 5.99, unit: "lb", lastPurchased: "2023-04-13", store: "Whole Foods" },
]

export function GroceryTracker() {
  const [groceryItems, setGroceryItems] = useState(initialGroceryItems)
  const [newItem, setNewItem] = useState({ name: "", price: "", unit: "", store: "", date: "" })
  const [storeNames, setStoreNames] = useState(["Whole Foods", "Safeway", "Trader Joe's", "Costco"])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const uniqueStores = Array.from(new Set(groceryItems.map(item => item.store)))
    setStoreNames(uniqueStores)
  }, [groceryItems])

  const handleAddItem = () => {
    if (newItem.name && newItem.price && newItem.unit && newItem.store && newItem.date) {
      setGroceryItems([
        ...groceryItems,
        {
          id: groceryItems.length + 1,
          name: newItem.name,
          price: parseFloat(newItem.price),
          unit: newItem.unit,
          lastPurchased: newItem.date,
          store: newItem.store,
        },
      ])
      if (!storeNames.includes(newItem.store)) {
        setStoreNames([...storeNames, newItem.store])
      }
      setNewItem({ name: "", price: "", unit: "", store: "", date: "" })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grocery Tracker</CardTitle>
        <CardDescription>Track your grocery items and their prices</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2 mb-4">
          <Input
            placeholder="Item name"
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
          />
          <Input
            type="number"
            placeholder="Price"
            value={newItem.price}
            onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
          />
          <Input
            placeholder="Unit"
            value={newItem.unit}
            onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
          />
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-[200px] justify-between"
              >
                {newItem.store || "Select store..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="Search store..." />
                <CommandEmpty>No store found.</CommandEmpty>
                <CommandGroup>
                  {storeNames.map((store) => (
                    <CommandItem
                      key={store}
                      onSelect={(currentValue) => {
                        setNewItem({ ...newItem, store: currentValue === newItem.store ? "" : currentValue })
                        setOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          newItem.store === store ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {store}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
          <Input
            type="date"
            value={newItem.date}
            onChange={(e) => setNewItem({ ...newItem, date: e.target.value })}
          />
          <Button onClick={handleAddItem}>Add Item</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Store</TableHead>
              <TableHead>Last Purchased</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groceryItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>${item.price.toFixed(2)}</TableCell>
                <TableCell>{item.unit}</TableCell>
                <TableCell>{item.store}</TableCell>
                <TableCell>{item.lastPurchased}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}