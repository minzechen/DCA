'use client';

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, FileUp, Check, X, TableIcon, FileText, ChevronDown, ChevronUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Papa from "papaparse"
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

interface ImportDataMapperProps {
  onImportComplete: (data: any[], mappings: Record<string, string>, analysisColumns: string[], itemId?: string) => void
  itemId?: string
  onCancel?: () => void
  batchMode?: boolean
}

export function ImportDataMapper({ onImportComplete, itemId, onCancel, batchMode = false }: ImportDataMapperProps) {
  const [file, setFile] = useState<File | null>(null)
  const [rawData, setRawData] = useState<string[][]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [previewData, setPreviewData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({})
  const [analysisColumns, setAnalysisColumns] = useState<string[]>([])
  const [parseOptions, setParseOptions] = useState({
    delimiter: ",",
    hasHeader: true,
    skipEmptyLines: true,
    headerRowIndex: 0,
  })
  const [activeTab, setActiveTab] = useState("file")
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [selectedXAxis, setSelectedXAxis] = useState<string>("")
  const [selectedYAxis, setSelectedYAxis] = useState<string>("")
  const { toast } = useToast()

  // Required fields for mapping
  const requiredFields = [
    { key: "height", label: "Height" },
    { key: "width", label: "Width" },
    { key: "slopeRatio", label: "Slope Ratio" },
    { key: "pga", label: "PGA" },
    { key: "h1h2Ratio", label: "H1/(H1+H2) Ratio" },
    { key: "groundwater", label: "Groundwater" },
    { key: "relativeDensity", label: "Relative Density" },
    { key: "inclination", label: "Inclination" },
    { key: "value", label: "Settlement Value" },
  ]

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]

      // Check file type
      const validTypes = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/json",
      ]

      if (
        !validTypes.includes(selectedFile.type) &&
        !selectedFile.name.endsWith(".csv") &&
        !selectedFile.name.endsWith(".xlsx") &&
        !selectedFile.name.endsWith(".xls") &&
        !selectedFile.name.endsWith(".json")
      ) {
        setError("Please select a CSV, Excel, or JSON file")
        return
      }

      setFile(selectedFile)
      parseFile(selectedFile)
    }
  }

  // Parse the selected file
  const parseFile = (file: File) => {
    setIsLoading(true)
    setError(null)

    if (file.name.endsWith(".json")) {
      // Handle JSON files
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target?.result as string)

          if (Array.isArray(jsonData) && jsonData.length > 0) {
            const firstRow = jsonData[0]
            const extractedHeaders = Object.keys(firstRow)

            setHeaders(extractedHeaders)
            setPreviewData(jsonData.slice(0, 10))

            // Set raw data for JSON (convert to array format for consistency)
            const rawDataArray = [extractedHeaders]
            jsonData.slice(0, 20).forEach((row: any) => {
              rawDataArray.push(extractedHeaders.map((header) => row[header]?.toString() || ""))
            })
            setRawData(rawDataArray)

            // Auto-map columns based on header names
            autoMapColumns(extractedHeaders)
            setActiveTab("mapping")
          } else {
            setError("Invalid JSON format. Expected an array of objects.")
          }
        } catch (err) {
          setError("Failed to parse JSON file")
        } finally {
          setIsLoading(false)
        }
      }
      reader.onerror = () => {
        setError("Failed to read file")
        setIsLoading(false)
      }
      reader.readAsText(file)
    } else {
      // Handle CSV files - parse the entire file first to get all rows
      Papa.parse(file, {
        delimiter: parseOptions.delimiter,
        skipEmptyLines: parseOptions.skipEmptyLines,
        complete: (results) => {
          if (results.errors.length > 0) {
            setError(`Error parsing file: ${results.errors[0].message}`)
            setIsLoading(false)
            return
          }

          const data = results.data as string[][]
          if (data.length === 0) {
            setError("No data found in the file")
            setIsLoading(false)
            return
          }

          // Store the raw data for header selection
          setRawData(data.slice(0, Math.min(data.length, 20))) // Store first 20 rows for preview

          // Use the first row as headers by default
          processHeaderRow(data, parseOptions.headerRowIndex)

          setIsLoading(false)
        },
        error: (error) => {
          setError(`Error parsing file: ${error.message}`)
          setIsLoading(false)
        },
      })
    }
  }

  // Process a specific row as the header row
  const processHeaderRow = (data: string[][], rowIndex: number) => {
    if (!data || data.length <= rowIndex) {
      setError("Selected header row is out of range")
      return
    }

    const headerRow = data[rowIndex]
    setHeaders(headerRow)

    // Create preview data with the selected headers
    const previewRows: any[] = []

    for (let i = rowIndex + 1; i < Math.min(data.length, rowIndex + 11); i++) {
      const row = data[i]
      if (row) {
        const rowObj: Record<string, string> = {}
        headerRow.forEach((header, index) => {
          if (header && row[index] !== undefined) {
            rowObj[header] = row[index]
          }
        })
        previewRows.push(rowObj)
      }
    }

    setPreviewData(previewRows)

    // Auto-map columns based on header names
    autoMapColumns(headerRow)
  }

  // Update header row selection
  const updateHeaderRow = (rowIndex: number) => {
    setParseOptions({
      ...parseOptions,
      headerRowIndex: rowIndex,
    })

    processHeaderRow(rawData, rowIndex)
  }

  // Auto-map columns based on header names
  const autoMapColumns = (fileHeaders: string[]) => {
    const newMappings: Record<string, string> = {}

    // Try to match headers with required fields
    requiredFields.forEach((field) => {
      // Look for exact matches first
      let match = fileHeaders.find(
        (header) =>
          header.toLowerCase() === field.key.toLowerCase() || header.toLowerCase() === field.label.toLowerCase(),
      )

      // If no exact match, look for partial matches
      if (!match) {
        match = fileHeaders.find(
          (header) =>
            header.toLowerCase().includes(field.key.toLowerCase()) ||
            header.toLowerCase().includes(field.label.toLowerCase()),
        )
      }

      if (match) {
        newMappings[field.key] = match
      }
    })

    setColumnMappings(newMappings)

    // Auto-select first numeric column for analysis
    const numericColumns = fileHeaders.filter((header) => {
      if (previewData.length > 0) {
        const firstRowValue = previewData[0][header]
        return !isNaN(Number.parseFloat(firstRowValue))
      }
      return false
    })

    if (numericColumns.length > 0) {
      setAnalysisColumns([numericColumns[0]])
      if (numericColumns.length > 1) {
        setSelectedXAxis(numericColumns[0])
        setSelectedYAxis(numericColumns[1])
      }
    }
  }

  // Update column mapping
  const updateMapping = (fieldKey: string, headerValue: string) => {
    setColumnMappings((prev) => ({
      ...prev,
      [fieldKey]: headerValue,
    }))
  }

  // Toggle analysis column selection
  const toggleAnalysisColumn = (header: string) => {
    setAnalysisColumns((prev) => {
      if (prev.includes(header)) {
        return prev.filter((col) => col !== header)
      } else {
        // Limit to 3 columns for analysis
        if (prev.length >= 3) {
          toast({
            title: "Maximum 3 columns",
            description: "You can select up to 3 columns for analysis",
            variant: "destructive",
          })
          return prev
        }
        return [...prev, header]
      }
    })
  }

  // Process and complete the import
  const completeImport = () => {
    if (!file) {
      setError("Please select a file to import")
      return
    }

    // Check if all required fields are mapped
    const missingMappings = requiredFields.filter((field) => !columnMappings[field.key]).map((field) => field.label)

    if (missingMappings.length > 0) {
      setError(`Please map the following required fields: ${missingMappings.join(", ")}`)
      return
    }

    // Check if at least one analysis column is selected
    if (analysisColumns.length === 0) {
      setError("Please select at least one column for analysis")
      return
    }

    setIsLoading(true)

    // Parse the entire file
    if (file.name.endsWith(".json")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target?.result as string)
          processImportedData(jsonData)
        } catch (err) {
          setError("Failed to parse JSON file")
          setIsLoading(false)
        }
      }
      reader.onerror = () => {
        setError("Failed to read file")
        setIsLoading(false)
      }
      reader.readAsText(file)
    } else {
      Papa.parse(file, {
        delimiter: parseOptions.delimiter,
        skipEmptyLines: parseOptions.skipEmptyLines,
        complete: (results) => {
          if (results.errors.length > 0) {
            setError(`Error parsing file: ${results.errors[0].message}`)
            setIsLoading(false)
            return
          }

          const data = results.data as string[][]
          if (data.length <= parseOptions.headerRowIndex) {
            setError("No data found after header row")
            setIsLoading(false)
            return
          }

          // Extract headers from the selected header row
          const headerRow = data[parseOptions.headerRowIndex]

          // Process all rows after the header row
          const processedData: any[] = []
          for (let i = parseOptions.headerRowIndex + 1; i < data.length; i++) {
            const row = data[i]
            if (row && row.length > 0) {
              const rowObj: Record<string, string> = {}
              headerRow.forEach((header, index) => {
                if (header && row[index] !== undefined) {
                  rowObj[header] = row[index]
                }
              })
              processedData.push(rowObj)
            }
          }

          processImportedData(processedData)
        },
        error: (error) => {
          setError(`Error parsing file: ${error.message}`)
          setIsLoading(false)
        },
      })
    }
  }

  // Process the imported data
  const processImportedData = (data: any[]) => {
    // Map the data to the required structure
    const processedData = data.map((row) => {
      const mappedRow: Record<string, any> = {}

      // Map each field according to the column mappings
      Object.entries(columnMappings).forEach(([fieldKey, headerValue]) => {
        mappedRow[fieldKey] = row[headerValue]
      })

      // Add x and y axis selections if they exist
      if (selectedXAxis && row[selectedXAxis] !== undefined) {
        mappedRow[selectedXAxis] = row[selectedXAxis]
      }

      if (selectedYAxis && row[selectedYAxis] !== undefined) {
        mappedRow[selectedYAxis] = row[selectedYAxis]
      }

      return mappedRow
    })

    // Add selected axes to analysis columns if they're not already there
    const finalAnalysisColumns = [...analysisColumns]
    if (selectedXAxis && !finalAnalysisColumns.includes(selectedXAxis)) {
      finalAnalysisColumns.push(selectedXAxis)
    }
    if (selectedYAxis && !finalAnalysisColumns.includes(selectedYAxis)) {
      finalAnalysisColumns.push(selectedYAxis)
    }

    // Call the onImportComplete callback with the processed data
    onImportComplete(processedData, columnMappings, finalAnalysisColumns, itemId)

    toast({
      title: "Import Successful",
      description: `Successfully imported ${processedData.length} rows of data`,
    })

    setIsLoading(false)
  }

  // Effect to update preview when header row changes
  useEffect(() => {
    if (rawData.length > parseOptions.headerRowIndex) {
      processHeaderRow(rawData, parseOptions.headerRowIndex)
    }
  }, [parseOptions.headerRowIndex])

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsContent value="file">File Selection</TabsContent>
          <TabsContent value="mapping" disabled={!file}>
            Column Mapping
          </TabsContent>
          <TabsContent value="analysis" disabled={!file}>
            Analysis Setup
          </TabsContent>
        </TabsList>

        <TabsContent value="file" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">{batchMode ? "Batch Data Import" : "Import Data for Analysis"}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Upload a CSV, Excel, or JSON file and map columns to data fields
              </p>
            </div>

            {!file && (
              <div>
                <Input
                  type="file"
                  accept=".csv,.xlsx,.xls,.json"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button as="span" className="cursor-pointer">
                    <FileUp className="mr-2 h-4 w-4" />
                    Select File
                  </Button>
                </label>
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading && !file && (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Processing file...</p>
            </div>
          )}

          {file && (
            <Card className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-blue-500" />
                    <div>
                      <h4 className="font-medium">{file.name}</h4>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024).toFixed(2)} KB •{" "}
                        {rawData.length > 0 ? `${rawData.length} rows detected` : "Processing..."}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setFile(null)}>
                      Change File
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setActiveTab("mapping")}
                      disabled={rawData.length === 0 || isLoading}
                    >
                      Next: Column Mapping
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                    className="text-sm text-gray-500"
                  >
                    {showAdvancedOptions ? (
                      <ChevronUp className="h-4 w-4 mr-1" />
                    ) : (
                      <ChevronDown className="h-4 w-4 mr-1" />
                    )}
                    {showAdvancedOptions ? "Hide Advanced Options" : "Show Advanced Options"}
                  </Button>
                </div>

                {showAdvancedOptions && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md bg-gray-50 dark:bg-gray-900">
                    <div className="space-y-2">
                      <Label htmlFor="delimiter">CSV Delimiter</Label>
                      <Select
                        value={parseOptions.delimiter}
                        onValueChange={(value) => setParseOptions({ ...parseOptions, delimiter: value })}
                      >
                        <SelectTrigger id="delimiter">
                          <SelectValue placeholder="Select delimiter" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value=",">Comma (,)</SelectItem>
                          <SelectItem value=";">Semicolon (;)</SelectItem>
                          <SelectItem value="\t">Tab</SelectItem>
                          <SelectItem value="|">Pipe (|)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="skip-empty">Skip Empty Lines</Label>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="skip-empty"
                          checked={parseOptions.skipEmptyLines}
                          onCheckedChange={(checked) => setParseOptions({ ...parseOptions, skipEmptyLines: !!checked })}
                        />
                        <label htmlFor="skip-empty" className="text-sm">
                          Skip empty lines when parsing
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {rawData.length > 0 && (
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium flex items-center">
                        <TableIcon className="h-4 w-4 mr-2 text-blue-500" />
                        Data Preview
                      </h4>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="header-row" className="text-sm">
                          Header Row:
                        </Label>
                        <Select
                          value={parseOptions.headerRowIndex.toString()}
                          onValueChange={(value) => updateHeaderRow(Number.parseInt(value))}
                        >
                          <SelectTrigger id="header-row" className="w-[80px]">
                            <SelectValue placeholder="Row" />
                          </SelectTrigger>
                          <SelectContent>
                            {rawData.slice(0, 10).map((_, index) => (
                              <SelectItem key={index} value={index.toString()}>
                                Row {index + 1}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="overflow-x-auto border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-blue-50 dark:bg-blue-900/20">
                            <TableHead className="w-[80px] font-bold">Row</TableHead>
                            {rawData[0]?.map((_, colIndex) => (
                              <TableHead
                                key={colIndex}
                                className={parseOptions.headerRowIndex === 0 ? "font-bold" : ""}
                              >
                                Column {colIndex + 1}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rawData.slice(0, 10).map((row, rowIndex) => (
                            <TableRow
                              key={rowIndex}
                              className={
                                rowIndex === parseOptions.headerRowIndex ? "bg-blue-100 dark:bg-blue-800/30" : ""
                              }
                            >
                              <TableCell className="font-medium">
                                {rowIndex === parseOptions.headerRowIndex ? (
                                  <Badge
                                    variant="outline"
                                    className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                  >
                                    Header
                                  </Badge>
                                ) : (
                                  `Row ${rowIndex + 1}`
                                )}
                              </TableCell>
                              {row.map((cell, cellIndex) => (
                                <TableCell key={cellIndex} className="truncate max-w-[200px]">
                                  {cell}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="mt-4 text-sm text-gray-500">
                      <p>
                        <span className="font-medium">Tip:</span> Select the row that contains your column headers. This
                        will be used for mapping data in the next step.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {!file && (
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
                <FileUp className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">Drag & Drop Your Data File</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Or click the button above to browse your files
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
                Supported formats: CSV, Excel (.xlsx, .xls), JSON
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="mapping" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Column Mapping</h3>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => setActiveTab("file")}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button size="sm" onClick={() => setActiveTab("analysis")}>
                Next: Analysis Setup
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          <Card className="p-4">
            <div className="space-y-4">
              <div className="border-b pb-4">
                <h4 className="font-medium mb-2">Map Columns to Required Fields</h4>
                <p className="text-sm text-gray-500">Match columns from your file to the required data fields</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requiredFields.map((field) => (
                  <div key={field.key} className="space-y-1">
                    <Label htmlFor={`map-${field.key}`} className="flex items-center">
                      {field.label}
                      {field.key === "value" && <span className="ml-1 text-red-500">*</span>}
                    </Label>
                    <Select
                      value={columnMappings[field.key] || ""}
                      onValueChange={(value) => updateMapping(field.key, value)}
                    >
                      <SelectTrigger id={`map-${field.key}`} className="w-full">
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">-- Select column --</SelectItem>
                        {headers.map((header) => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Data Preview with Mappings</h4>
                <div className="overflow-x-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {requiredFields.map((field) => (
                          <TableHead key={field.key}>
                            {field.label}
                            {columnMappings[field.key] && (
                              <div className="text-xs text-gray-500">{columnMappings[field.key]}</div>
                            )}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.slice(0, 5).map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          {requiredFields.map((field) => (
                            <TableCell key={field.key} className="truncate max-w-[150px]">
                              {columnMappings[field.key] ? row[columnMappings[field.key]] : "-"}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Analysis Setup</h3>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => setActiveTab("mapping")}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={completeImport} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Complete Import
                  </>
                )}
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card className="p-4">
            <div className="space-y-4">
              <div className="border-b pb-4">
                <h4 className="font-medium mb-2">Select Columns for Analysis</h4>
                <p className="text-sm text-gray-500">
                  Choose columns to use for analytical diagrams and visualizations (max 3)
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {headers.map((header) => (
                  <div key={header} className="flex items-center space-x-2">
                    <Checkbox
                      id={`analysis-${header}`}
                      checked={analysisColumns.includes(header)}
                      onCheckedChange={() => toggleAnalysisColumn(header)}
                    />
                    <Label htmlFor={`analysis-${header}`} className="text-sm cursor-pointer truncate">
                      {header}
                    </Label>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-4">Set Default Axes for Visualizations</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="x-axis">X-Axis Column</Label>
                    <Select value={selectedXAxis} onValueChange={setSelectedXAxis}>
                      <SelectTrigger id="x-axis">
                        <SelectValue placeholder="Select X-Axis column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">-- None --</SelectItem>
                        {headers.map((header) => (
                          <SelectItem key={`x-${header}`} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="y-axis">Y-Axis Column</Label>
                    <Select value={selectedYAxis} onValueChange={setSelectedYAxis}>
                      <SelectTrigger id="y-axis">
                        <SelectValue placeholder="Select Y-Axis column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">-- None --</SelectItem>
                        {headers.map((header) => (
                          <SelectItem key={`y-${header}`} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Import Summary</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-blue-500" />
                    <span className="text-sm">{file?.name}</span>
                  </div>
                  <div className="flex items-center">
                    <TableIcon className="h-4 w-4 mr-2 text-green-500" />
                    <span className="text-sm">{previewData.length} rows ready to import</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-amber-500" />
                    <span className="text-sm">
                      {Object.keys(columnMappings).length} of {requiredFields.length} fields mapped
                    </span>
                  </div>
                  <div className="flex items-center">
                    <BarChart2 className="h-4 w-4 mr-2 text-purple-500" />
                    <span className="text-sm">
                      {analysisColumns.length} columns selected for analysis
                      {analysisColumns.length > 0 && (
                        <span className="ml-1 text-gray-500">({analysisColumns.join(", ")})</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                {onCancel && (
                  <Button variant="outline" onClick={onCancel}>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                )}
                <Button onClick={completeImport} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Complete Import
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper component for the ChevronRight icon
function ChevronRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

// Helper component for the ChevronLeft icon
function ChevronLeft(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

// Helper component for the BarChart2 icon
function BarChart2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" x2="18" y1="20" y2="10" />
      <line x1="12" x2="12" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="14" />
    </svg>
  )
}