"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
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
  const handleSuccess = () => {
    onClose();
    // You might want to add a callback here to refresh the expense list in the parent component
  };

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
          <DialogDescription>
            {mode === 'create' ? 'Fill in the details to add a new expense.' : 'Update the details of the expense.'}
          </DialogDescription>
        </DialogHeader>
        {type === 'grocery' ? (
          <GroceryTracker onSuccess={handleSuccess} editData={editData} mode={mode} />
        ) : (
          <ExpenseForm onSuccess={handleSuccess} editData={editData} mode={mode} />
        )}
      </DialogContent>
    </Dialog>
  )
}
