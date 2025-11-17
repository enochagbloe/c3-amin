"use client"

import { useState } from "react"
import * as React from "react"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { formatDate } from "@/lib/utils"

type SelectableItem = {
  id: string
  name: string
  email: string
  createdAt: string
  role?: string
}

interface SelectableTableProps {
  data: SelectableItem[]
}

export default function SelectableTable({ data }: SelectableTableProps) {
  const [selected, setSelected] = useState<string[]>([])

  // Using email as unique identifier since IDs are duplicated
  const toggle = (email: string) => {
    setSelected((prev) =>
      prev.includes(email)
        ? prev.filter((x) => x !== email)
        : [...prev, email]
    )
  }

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? data.map((item) => item.email) : [])
  }

  const allSelected = data.length > 0 && selected.length === data.length
  const someSelected = selected.length > 0 && selected.length < data.length

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onCheckedChange={(checked) => toggleAll(checked as boolean)}
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Created at</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.map((item, index) => {
            const isSelected = selected.includes(item.email)
            // Use email as unique key since IDs are duplicated
            const uniqueKey = item.email || `row-${index}`

            return (
              <TableRow
                key={uniqueKey}
                className={`cursor-pointer transition-colors ${
                  isSelected ? "bg-muted/50" : ""
                }`}
                onClick={(e) => {
                  // Allow clicking anywhere except checkbox to toggle
                  if (e.target instanceof HTMLElement && e.target.closest('input[type="checkbox"]')) {
                    return
                  }
                  toggle(item.email)
                }}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggle(item.email)}
                  />
                </TableCell>

                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{formatDate(item.createdAt)}</TableCell>
                <TableCell>{item.email}</TableCell>
                <TableCell>{item.role ?? "-"}</TableCell>
                <TableCell>-</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {selected.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {selected.length} of {data.length} row(s) selected.
        </div>
      )}
    </div>
  )
}