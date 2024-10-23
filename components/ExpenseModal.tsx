"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { GroceryTracker } from "./GroceryTracker"
import { ExpenseForm } from "./ExpenseForm"

interface ExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'grocery' | 'other'
  editData?: any // Data of the expense being edited
  mode: 'create' | 'edit'
}

export function ExpenseModal({ isOpen, onClose, type, editData, mode }: ExpenseModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 
              (type === 'grocery' ? 'Add Grocery Expense' : 'Add Other Expense') :
              (type === 'grocery' ? 'Edit Grocery Expense' : 'Edit Other Expense')
            }
          </DialogTitle>
        </DialogHeader>
        {type === 'grocery' ? (
          <GroceryTracker onSuccess={onClose} editData={editData} mode={mode} />
        ) : (
          <ExpenseForm onSuccess={onClose} editData={editData} mode={mode} />
        )}
      </DialogContent>
    </Dialog>
  )
}
