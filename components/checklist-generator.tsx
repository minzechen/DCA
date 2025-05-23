"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, RefreshCw, Search, Filter, Upload, FileUp } from "lucide-react"
import { initialMindMapData, type MindMapNode } from "./mind-map"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { ImportDataMapper } from "./import-data-mapper"

interface ChecklistItem {
  id: string
  height: string
  width: string
  slopeRatio: string
  pga: string
  h1h2Ratio: string
  groundwater: string
  relativeDensity: string
  inclination: string
  selected: boolean
  notes: string
  value?: number
  imported: boolean
  importSource?: string
  importDate?: string
  analysisColumns?: string[]
}

export function ChecklistGenerator() {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredChecklist, setFilteredChecklist] = useState<ChecklistItem[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [totalSelected, setTotalSelected] = useState(0)
  const [totalImported, setTotalImported] = useState(0)
  const [importingItemId, setImportingItemId] = useState<string | null>(null)
  const [showBatchImport, setShowBatchImport] = useState(false)
  const { toast } = useToast()

  // Generate all possible combinations from the mind map data
  const generateChecklist = (mindMapData: MindMapNode) => {
    setLoading(true)

    // Extract categories from mind map
    const categories = mindMapData.children || []

    // Helper function to get all leaf values for a specific category and subcategory
    const getLeafValues = (categoryId: string, subcategoryId: string) => {
      const category = categories.find((c) => c.id === categoryId)
      if (!category) return []

      const subcategory = category.children?.find((s) => s.id === subcategoryId)
      if (!subcategory) return []

      return subcategory.children?.map((leaf) => leaf.name) || []
    }

    // For categories without subcategories, get direct children
    const getDirectValues = (categoryId: string) => {
      const category = categories.find((c) => c.id === categoryId)
      if (!category) return []

      return category.children?.map((child) => child.name) || []
    }

    // Get values for each parameter
    const heights = getLeafValues("dike-size", "height")
    const widths = getLeafValues("dike-size", "width")
    const slopeRatios = getLeafValues("dike-size", "slope-ratio")
    const pgas = getLeafValues("earthquake", "pga")
    const h1h2Ratios = getLeafValues("thickness-ratio", "h1h2")
    const groundwaters = getLeafValues("thickness-ratio", "groundwater")
    const relativeDensities = getDirectValues("relative-density")
    const inclinations = getDirectValues("inclination")

    // Generate all combinations
    const combinations: ChecklistItem[] = []
    let id = 0

    heights.forEach((height) => {
      widths.forEach((width) => {
        slopeRatios.forEach((slopeRatio) => {
          pgas.forEach((pga) => {
            h1h2Ratios.forEach((h1h2Ratio) => {
              groundwaters.forEach((groundwater) => {
                relativeDensities.forEach((relativeDensity) => {
                  inclinations.forEach((inclination) => {
                    combinations.push({
                      id: `item-${id++}`,
                      height,
                      width,
                      slopeRatio,
                      pga,
                      h1h2Ratio,
                      groundwater,
                      relativeDensity,
                      inclination,
                      selected: false,
                      notes: "",
                      imported: false,
                    })
                  })
                })
              })
            })
          })
        })
      })
    })

    // Verify that the total combinations match
    const expectedTotal = calculateTotalCombinations(mindMapData)
    console.log(`Generated ${combinations.length} combinations, expected ${expectedTotal}`)
    if (combinations.length !== expectedTotal) {
      console.warn("Warning: Generated combinations count doesn't match the expected total")
    }

    setChecklist(combinations)
    setFilteredChecklist(combinations)
    setLoading(false)
  }

  // Calculate total combinations from the mind map data
  const calculateTotalCombinations = (mindMapData: MindMapNode) => {
    // Extract categories from mind map
    const categories = mindMapData.children || []

    // Helper function to get all leaf values for a specific category and subcategory
    const getLeafValues = (categoryId: string, subcategoryId: string) => {
      const category = categories.find((c) => c.id === categoryId)
      if (!category) return []

      const subcategory = category.children?.find((s) => s.id === subcategoryId)
      if (!subcategory) return []

      return subcategory.children?.map((leaf) => leaf.name) || []
    }

    // For categories without subcategories, get direct children
    const getDirectValues = (categoryId: string) => {
      const category = categories.find((c) => c.id === categoryId)
      if (!category) return []

      return category.children?.map((child) => child.name) || []
    }

    // Get values for each parameter
    const heights = getLeafValues("dike-size", "height")
    const widths = getLeafValues("dike-size", "width")
    const slopeRatios = getLeafValues("dike-size", "slope-ratio")
    const pgas = getLeafValues("earthquake", "pga")
    const h1h2Ratios = getLeafValues("thickness-ratio", "h1h2")
    const groundwaters = getLeafValues("thickness-ratio", "groundwater")
    const relativeDensities = getDirectValues("relative-density")
    const inclinations = getDirectValues("inclination")

    // Calculate total combinations by multiplying the counts
    return (
      heights.length *
      widths.length *
      slopeRatios.length *
      pgas.length *
      h1h2Ratios.length *
      groundwaters.length *
      relativeDensities.length *
      inclinations.length
    )
  }

  // Apply filters and search
  useEffect(() => {
    let filtered = [...checklist]

    // Apply search term
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter((item) =>
        Object.values(item).some(
          (value) => typeof value === "string" && value.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
      )
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "all") {
        filtered = filtered.filter((item) => (item as any)[key] === value)
      }
    })

    // Apply imported filter if set
    if (filters.importStatus) {
      if (filters.importStatus === "imported") {
        filtered = filtered.filter((item) => item.imported)
      } else if (filters.importStatus === "not-imported") {
        filtered = filtered.filter((item) => !item.imported)
      }
    }

    setFilteredChecklist(filtered)
    setCurrentPage(1)
  }, [searchTerm, filters, checklist])

  // Update total selected and imported count
  useEffect(() => {
    setTotalSelected(checklist.filter((item) => item.selected).length)
    setTotalImported(checklist.filter((item) => item.imported).length)
  }, [checklist])

  // Load mind map data and generate checklist on component mount
  useEffect(() => {
    // Try to get saved checklist data from localStorage
    const savedChecklist = localStorage.getItem("checklist")
    if (savedChecklist) {
      try {
        const parsedChecklist = JSON.parse(savedChecklist)
        setChecklist(parsedChecklist)
        setFilteredChecklist(parsedChecklist)
        setLoading(false)
        return
      } catch (e) {
        console.error("Failed to parse saved checklist")
      }
    }

    // If no saved checklist, generate from mind map
    const savedData = localStorage.getItem("mindMapData")
    const mindMapData = savedData ? JSON.parse(savedData) : initialMindMapData

    generateChecklist(mindMapData)
  }, [])

  // Toggle checklist item selection
  const toggleItemSelection = (id: string) => {
    setChecklist((prev) => prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item)))
  }

  // Toggle all items on current page
  const toggleAllOnPage = (selected: boolean) => {
    const currentPageItems = getCurrentPageItems().map((item) => item.id)

    setChecklist((prev) => prev.map((item) => (currentPageItems.includes(item.id) ? { ...item, selected } : item)))
  }

  // Update item notes
  const updateItemNotes = (id: string, notes: string) => {
    setChecklist((prev) => prev.map((item) => (item.id === id ? { ...item, notes } : item)))
  }

  // Update item value
  const updateItemValue = (id: string, value: string) => {
    const numValue = Number.parseFloat(value)
    if (!isNaN(numValue)) {
      setChecklist((prev) => prev.map((item) => (item.id === id ? { ...item, value: numValue } : item)))
    }
  }

  // Handle import for a specific item
  const handleImportForItem = (id: string) => {
    setImportingItemId(id)
  }

  // Handle batch import
  const handleBatchImport = () => {
    if (totalSelected === 0) {
      toast({
        title: "No Items Selected",
        description: "Please select at least one item to import data for.",
        variant: "destructive",
      })
      return
    }

    setShowBatchImport(true)
  }

  // Handle import completion
  const handleImportComplete = (
    data: any[],
    mappings: Record<string, string>,
    analysisColumns: string[],
    itemId?: string,
  ) => {
    if (itemId) {
      // Single item import
      const importedData = data[0] // Take first row for single item

      if (!importedData) {
        toast({
          title: "Import Failed",
          description: "No data found in the imported file",
          variant: "destructive",
        })
        return
      }

      setChecklist((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                ...importedData,
                imported: true,
                importSource: `Manual import (${new Date().toLocaleString()})`,
                importDate: new Date().toISOString(),
                analysisColumns,
              }
            : item,
        ),
      )

      setImportingItemId(null)
    } else {
      // Batch import
      // Get all selected items
      const selectedItems = checklist.filter((item) => item.selected)

      // Match imported data to selected items
      // This is a simplified approach - in a real app, you'd need more sophisticated matching
      const updatedChecklist = [...checklist]

      selectedItems.forEach((selectedItem, index) => {
        if (index < data.length) {
          const importedData = data[index]

          const itemIndex = updatedChecklist.findIndex((item) => item.id === selectedItem.id)
          if (itemIndex !== -1) {
            updatedChecklist[itemIndex] = {
              ...updatedChecklist[itemIndex],
              ...importedData,
              imported: true,
              importSource: `Batch import (${new Date().toLocaleString()})`,
              importDate: new Date().toISOString(),
              analysisColumns,
            }
          }
        }
      })

      setChecklist(updatedChecklist)
      setShowBatchImport(false)
    }

    // Save updated checklist to localStorage
    setTimeout(() => {
      localStorage.setItem("checklist", JSON.stringify(checklist))
    }, 100)
  }

  // Export checklist as CSV
  const exportCSV = () => {
    const headers = [
      "Height",
      "Width",
      "Slope Ratio",
      "PGA",
      "H1/(H1+H2)",
      "Groundwater",
      "Relative Density",
      "Inclination",
      "Selected",
      "Imported",
      "Value",
      "Import Source",
      "Import Date",
      "Notes",
    ]

    const csvContent = [
      headers.join(","),
      ...checklist.map((item) =>
        [
          `"${item.height}"`,
          `"${item.width}"`,
          `"${item.slopeRatio}"`,
          `"${item.pga}"`,
          `"${item.h1h2Ratio}"`,
          `"${item.groundwater}"`,
          `"${item.relativeDensity}"`,
          `"${item.inclination}"`,
          item.selected ? "Yes" : "No",
          item.imported ? "Yes" : "No",
          item.value !== undefined ? item.value : "",
          `"${item.importSource || ""}"`,
          `"${item.importDate || ""}"`,
          `"${item.notes}"`,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "dike_settlement_checklist.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Export selected items as JSON
  const exportSelectedJSON = () => {
    const selectedItems = checklist.filter((item) => item.selected)

    const blob = new Blob([JSON.stringify(selectedItems, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "selected_dike_data.json")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Export imported items for analysis
  const exportImportedForAnalysis = () => {
    const importedItems = checklist.filter((item) => item.imported)

    // Save to localStorage for use in the analytics component
    localStorage.setItem("analysisData", JSON.stringify(importedItems))

    toast({
      title: "Data Prepared for Analysis",
      description: `${importedItems.length} imported items are now available for analysis in the Advanced Analytics tab.`,
    })
  }

  // Get unique values for a specific field
  const getUniqueValues = (field: keyof ChecklistItem) => {
    const values = new Set<string>()
    checklist.forEach((item) => {
      if (typeof item[field] === "string") {
        values.add(item[field] as string)
      }
    })
    return Array.from(values).sort()
  }

  // Reset all filters
  const resetFilters = () => {
    setFilters({})
    setSearchTerm("")
  }

  // Save checklist to localStorage
  const saveChecklist = () => {
    localStorage.setItem("checklist", JSON.stringify(checklist))

    toast({
      title: "Checklist Saved",
      description: "Your checklist has been saved successfully.",
    })
  }

  // Pagination
  const totalPages = Math.ceil(filteredChecklist.length / itemsPerPage)

  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredChecklist.slice(startIndex, startIndex + itemsPerPage)
  }

  return (
    <div className="space-y-6">
      {checklist.length > 5000 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md p-3 mb-4">
          <p className="text-amber-800 dark:text-amber-300 text-sm">
            <strong>Note:</strong> This checklist contains {checklist.length.toLocaleString()} combinations. For better
            performance, use the filters to narrow down the results or export to CSV for external processing.
          </p>
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-medium">Generated Checklist</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {filteredChecklist.length} combinations (Total: {checklist.length}) | {totalSelected} selected |{" "}
            {totalImported} imported
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => generateChecklist(initialMindMapData)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Checklist</SheetTitle>
                <SheetDescription>Select values to filter the checklist by specific parameters</SheetDescription>
              </SheetHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="height-filter">Height</Label>
                  <Select
                    value={filters.height || "all"}
                    onValueChange={(value) => setFilters({ ...filters, height: value })}
                  >
                    <SelectTrigger id="height-filter">
                      <SelectValue placeholder="All heights" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All heights</SelectItem>
                      {getUniqueValues("height").map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="width-filter">Width</Label>
                  <Select
                    value={filters.width || "all"}
                    onValueChange={(value) => setFilters({ ...filters, width: value })}
                  >
                    <SelectTrigger id="width-filter">
                      <SelectValue placeholder="All widths" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All widths</SelectItem>
                      {getUniqueValues("width").map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pga-filter">PGA</Label>
                  <Select
                    value={filters.pga || "all"}
                    onValueChange={(value) => setFilters({ ...filters, pga: value })}
                  >
                    <SelectTrigger id="pga-filter">
                      <SelectValue placeholder="All PGA values" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All PGA values</SelectItem>
                      {getUniqueValues("pga").map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="density-filter">Relative Density</Label>
                  <Select
                    value={filters.relativeDensity || "all"}
                    onValueChange={(value) => setFilters({ ...filters, relativeDensity: value })}
                  >
                    <SelectTrigger id="density-filter">
                      <SelectValue placeholder="All density values" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All density values</SelectItem>
                      {getUniqueValues("relativeDensity").map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="import-status-filter">Import Status</Label>
                  <Select
                    value={filters.importStatus || "all"}
                    onValueChange={(value) => setFilters({ ...filters, importStatus: value })}
                  >
                    <SelectTrigger id="import-status-filter">
                      <SelectValue placeholder="All items" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All items</SelectItem>
                      <SelectItem value="imported">Imported only</SelectItem>
                      <SelectItem value="not-imported">Not imported</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={resetFilters} variant="outline">
                  Reset All Filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <Button variant="outline" size="sm" onClick={saveChecklist}>
            <Download className="h-4 w-4 mr-2" />
            Save Checklist
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportSelectedJSON} disabled={totalSelected === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export Selected
          </Button>
          <Button variant="outline" size="sm" onClick={handleBatchImport} disabled={totalSelected === 0}>
            <Upload className="h-4 w-4 mr-2" />
            Batch Import
          </Button>
          <Button variant="default" size="sm" onClick={exportImportedForAnalysis} disabled={totalImported === 0}>
            <FileUp className="h-4 w-4 mr-2" />
            Analyze Imported
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search checklist..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={getCurrentPageItems().length > 0 && getCurrentPageItems().every((item) => item.selected)}
                    onCheckedChange={(checked) => toggleAllOnPage(!!checked)}
                  />
                </TableHead>
                <TableHead>Height</TableHead>
                <TableHead>Width</TableHead>
                <TableHead>Slope Ratio</TableHead>
                <TableHead>PGA</TableHead>
                <TableHead>H1/(H1+H2)</TableHead>
                <TableHead>Groundwater</TableHead>
                <TableHead>Relative Density</TableHead>
                <TableHead>Inclination</TableHead>
                <TableHead className="w-[100px]">Value</TableHead>
                <TableHead className="w-[120px]">Import Status</TableHead>
                <TableHead className="w-[150px]">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
                    <p className="mt-2">Processing data...</p>
                    <p className="text-sm text-gray-500 mt-1">
                      This may take a moment due to the large number of combinations.
                    </p>
                  </TableCell>
                </TableRow>
              ) : filteredChecklist.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-8">
                    <p>No checklist items found matching your search or filters.</p>
                  </TableCell>
                </TableRow>
              ) : (
                getCurrentPageItems().map((item) => (
                  <TableRow key={item.id} className={item.imported ? "bg-green-50 dark:bg-green-900/10" : ""}>
                    <TableCell>
                      <Checkbox checked={item.selected} onCheckedChange={() => toggleItemSelection(item.id)} />
                    </TableCell>
                    <TableCell>{item.height}</TableCell>
                    <TableCell>{item.width}</TableCell>
                    <TableCell>{item.slopeRatio}</TableCell>
                    <TableCell>{item.pga}</TableCell>
                    <TableCell>{item.h1h2Ratio}</TableCell>
                    <TableCell>{item.groundwater}</TableCell>
                    <TableCell>{item.relativeDensity}</TableCell>
                    <TableCell>{item.inclination}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        placeholder="Value"
                        value={item.value !== undefined ? item.value : ""}
                        onChange={(e) => updateItemValue(item.id, e.target.value)}
                        className="h-8 w-full"
                      />
                    </TableCell>
                    <TableCell>
                      {item.imported ? (
                        <div className="space-y-1">
                          <Badge
                            variant="success"
                            className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                          >
                            Imported
                          </Badge>
                          {item.analysisColumns && item.analysisColumns.length > 0 && (
                            <div className="text-xs text-gray-500">
                              {item.analysisColumns.length} columns for analysis
                            </div>
                          )}
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => handleImportForItem(item.id)}
                        >
                          <Upload className="h-3 w-3 mr-1" />
                          Import
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="Notes"
                        value={item.notes}
                        onChange={(e) => updateItemNotes(item.id, e.target.value)}
                        className="h-8 w-full"
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Label htmlFor="items-per-page">Items per page:</Label>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              setItemsPerPage(Number.parseInt(value))
              setCurrentPage(1)
            }}
          >
            <SelectTrigger id="items-per-page" className="w-[80px]">
              <SelectValue placeholder={itemsPerPage.toString()} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="200">200</SelectItem>
              <SelectItem value="500">500</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Show pages around current page
              let pageNum
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }

              return (
                <PaginationItem key={i}>
                  <PaginationLink isActive={currentPage === pageNum} onClick={() => setCurrentPage(pageNum)}>
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              )
            })}

            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>

        <div className="text-sm text-gray-500">
          Page {currentPage} of {totalPages}
        </div>
      </div>

      {/* Import Dialog for Single Item */}
      <Dialog open={importingItemId !== null} onOpenChange={(open) => !open && setImportingItemId(null)}>
        <DialogContent className="max-w-4xl">
          <DialogTitle>Import Data for Item</DialogTitle>
          {importingItemId && (
            <ImportDataMapper
              onImportComplete={handleImportComplete}
              itemId={importingItemId}
              onCancel={() => setImportingItemId(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Batch Import Dialog */}
      <Dialog open={showBatchImport} onOpenChange={setShowBatchImport}>
        <DialogContent className="max-w-4xl">
          <DialogTitle>Batch Import Data</DialogTitle>
          <ImportDataMapper
            onImportComplete={handleImportComplete}
            onCancel={() => setShowBatchImport(false)}
            batchMode={true}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
