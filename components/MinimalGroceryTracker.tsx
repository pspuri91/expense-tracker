"use client"

import { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown } from "lucide-react"

export function MinimalGroceryTracker() {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")
  const storeNames = ["Whole Foods", "Safeway", "Trader Joe's", "Costco"]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {value ? value : "Select store..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search store..." />
          <CommandEmpty>No store found.</CommandEmpty>
          <CommandGroup>
            {Array.isArray(storeNames) && storeNames.length > 0 ? (
              storeNames.map((store) => (
                <CommandItem
                  key={store}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check className="mr-2 h-4 w-4" />
                  {store}
                </CommandItem>
              ))
            ) : (
              <CommandEmpty>No stores available.</CommandEmpty>
            )}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
