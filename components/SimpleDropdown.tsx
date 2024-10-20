"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export function SimpleDropdown() {
  const [selectedStore, setSelectedStore] = useState("")
  const storeNames = ["Whole Foods", "Safeway", "Trader Joe's", "Costco"]

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStore(event.target.value)
  }

  return (
    <div>
      <select
        value={selectedStore}
        onChange={handleSelectChange}
        className="border rounded p-2"
      >
        <option value="" disabled>Select store...</option>
        {storeNames.map((store) => (
          <option key={store} value={store}>
            {store}
          </option>
        ))}
      </select>
      <Button onClick={() => console.log("Selected Store:", selectedStore)}>
        Confirm Selection
      </Button>
    </div>
  )
}
