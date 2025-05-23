"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsTrigger, TabsList } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/hooks/use-toast"
import { Download, RefreshCw, FileUp, AlertCircle, Loader2, BarChart2, TableIcon } from "lucide-react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { ScatterChart, BarChart, LineChart } from "@/components/ui/chart"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface DataPoint {
  id: string
  height: string
  width: string
  slopeRatio: string
  pga: string
  h1h2Ratio: string
  groundwater: string
  relativeDensity: string
  inclination: string
  value: number
  imported: boolean
  importSource?: string
  importDate?: string
  timestamp?: string
  notes?: string
  analysisColumns?: string[]
  [key: string]: any // Allow dynamic properties for custom analysis columns
}

interface CorrelationData {
  parameter: string
  correlation: number
}

export function AdvancedAnalytics() {
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [xAxis, setXAxis] = useState<string>("height")
  const [yAxis, setYAxis] = useState<string>("pga")
  const [zAxis, setZAxis] = useState<string>("value")
  const [colorBy, setColorBy] = useState<string>("relativeDensity")
  const [sizeBy, setSizeBy] = useState<string>("width")
  const [correlations, setCorrelations] = useState<CorrelationData[]>([])
  const [rotationSpeed, setRotationSpeed] = useState(0.5)
  const [autoRotate, setAutoRotate] = useState(true)
  const [pointSize, setPointSize] = useState(5)
  const [showOnlyImported, setShowOnlyImported] = useState(true)
  const [noImportedDataAlert, setNoImportedDataAlert] = useState(false)
  const [availableColumns, setAvailableColumns] = useState<string[]>([])
  const [customColumns, setCustomColumns] = useState<string[]>([])
  const [showRawData, setShowRawData] = useState(false)

  const threeDRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const pointsRef = useRef<THREE.Points | null>(null)

  const { toast } = useToast()

  // Load saved data points on component mount
  useEffect(() => {
    // First try to load analysis data (imported items)
    const analysisData = localStorage.getItem("analysisData")
    if (analysisData) {
      try {
        const parsedData = JSON.parse(analysisData)
        if (parsedData.length > 0) {
          processLoadedData(parsedData)
          setNoImportedDataAlert(false)
          return
        }
      } catch (e) {
        console.error("Failed to parse analysis data")
      }
    }

    // If no analysis data, try to load from checklist
    const savedChecklist = localStorage.getItem("checklist")
    if (savedChecklist) {
      try {
        const parsedChecklist = JSON.parse(savedChecklist)
        const importedItems = parsedChecklist.filter((item: DataPoint) => item.imported)

        if (importedItems.length > 0) {
          processLoadedData(importedItems)
          setNoImportedDataAlert(false)
        } else {
          // Fall back to all items with values
          const itemsWithValues = parsedChecklist.filter((item: DataPoint) => item.value !== undefined)
          if (itemsWithValues.length > 0) {
            processLoadedData(itemsWithValues)
            setShowOnlyImported(false)
            setNoImportedDataAlert(true)
          } else {
            setNoImportedDataAlert(true)
          }
        }
      } catch (e) {
        console.error("Failed to parse checklist data")
        setNoImportedDataAlert(true)
      }
    } else {
      // No data available
      setNoImportedDataAlert(true)
    }
  }, [])

  // Process loaded data and extract custom columns
  const processLoadedData = (data: DataPoint[]) => {
    // Extract all available columns including custom ones
    const allColumns = new Set<string>()

    data.forEach((item) => {
      Object.keys(item).forEach((key) => {
        // Skip internal properties and standard properties
        if (
          !key.startsWith("_") &&
          key !== "id" &&
          key !== "selected" &&
          key !== "notes" &&
          key !== "imported" &&
          key !== "importSource" &&
          key !== "importDate" &&
          key !== "timestamp" &&
          key !== "analysisColumns"
        ) {
          allColumns.add(key)
        }
      })

      // Add any custom analysis columns
      if (item.analysisColumns && Array.isArray(item.analysisColumns)) {
        item.analysisColumns.forEach((col) => allColumns.add(col))
      }
    })

    const standardColumns = [
      "height",
      "width",
      "slopeRatio",
      "pga",
      "h1h2Ratio",
      "groundwater",
      "relativeDensity",
      "inclination",
      "value",
    ]

    // Separate standard and custom columns
    const customCols = Array.from(allColumns).filter((col) => !standardColumns.includes(col))

    setAvailableColumns([...standardColumns, ...customCols])
    setCustomColumns(customCols)
    setDataPoints(data)

    // If we have custom columns, set them as default for visualization
    if (customCols.length > 0) {
      if (customCols.length >= 1) setXAxis(customCols[0])
      if (customCols.length >= 2) setYAxis(customCols[1])
      if (customCols.length >= 3) setZAxis(customCols[2])
    }

    calculateCorrelations(data)
  }

  // Calculate correlations between parameters and values
  const calculateCorrelations = (data: DataPoint[]) => {
    if (data.length < 2) return

    // If we have a very large dataset, use a sample for correlation calculation
    const sampleSize = Math.min(data.length, 1000)
    const sampleData = data.length > sampleSize ? data.sort(() => 0.5 - Math.random()).slice(0, sampleSize) : data

    // Get all numeric columns for correlation
    const numericColumns: string[] = []

    // Check first row to determine which columns are numeric
    const firstRow = sampleData[0]
    Object.entries(firstRow).forEach(([key, value]) => {
      // Skip non-data properties
      if (
        key === "id" ||
        key === "selected" ||
        key === "notes" ||
        key === "imported" ||
        key === "importSource" ||
        key === "importDate" ||
        key === "timestamp" ||
        key === "analysisColumns"
      ) {
        return
      }

      // Check if the value is numeric or can be converted to numeric
      const numValue = getNumericValue(firstRow, key)
      if (!isNaN(numValue)) {
        numericColumns.push(key)
      }
    })

    const correlationResults: CorrelationData[] = []

    // Calculate correlation against the value column (or zAxis if it's not "value")
    const targetColumn = zAxis === "value" ? "value" : zAxis

    numericColumns.forEach((column) => {
      if (column === targetColumn) return // Skip self-correlation

      // Extract values for correlation
      const xValues = sampleData.map((point) => getNumericValue(point, column))
      const yValues = sampleData.map((point) => getNumericValue(point, targetColumn))

      // Filter out any NaN values
      const validPairs = xValues
        .map((x, i) => [x, yValues[i]])
        .filter(([x, y]) => !isNaN(x as number) && !isNaN(y as number))

      if (validPairs.length < 2) return // Need at least 2 points for correlation

      const filteredX = validPairs.map((pair) => pair[0]) as number[]
      const filteredY = validPairs.map((pair) => pair[1]) as number[]

      // Calculate correlation coefficient
      const correlation = calculateCorrelationCoefficient(filteredX, filteredY)

      correlationResults.push({
        parameter: column,
        correlation,
      })
    })

    // Sort by absolute correlation value (descending)
    correlationResults.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))

    setCorrelations(correlationResults)
  }

  // Calculate Pearson correlation coefficient
  const calculateCorrelationCoefficient = (x: number[], y: number[]): number => {
    const n = x.length
    if (n !== y.length || n === 0) return 0

    // Calculate means
    const xMean = x.reduce((sum, val) => sum + val, 0) / n
    const yMean = y.reduce((sum, val) => sum + val, 0) / n

    // Calculate covariance and standard deviations
    let covariance = 0
    let xStdDev = 0
    let yStdDev = 0

    for (let i = 0; i < n; i++) {
      const xDiff = x[i] - xMean
      const yDiff = y[i] - yMean
      covariance += xDiff * yDiff
      xStdDev += xDiff * xDiff
      yStdDev += yDiff * yDiff
    }

    // Avoid division by zero
    if (xStdDev === 0 || yStdDev === 0) return 0

    return covariance / (Math.sqrt(xStdDev) * Math.sqrt(yStdDev))
  }

  // Initialize 3D visualization
  useEffect(() => {
    if (!threeDRef.current || dataPoints.length === 0) return

    // Clean up previous renderer
    if (rendererRef.current) {
      threeDRef.current.removeChild(rendererRef.current.domElement)
      rendererRef.current.dispose()
    }

    // Setup scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf0f0f0)
    sceneRef.current = scene

    // Setup camera
    const camera = new THREE.PerspectiveCamera(
      75,
      threeDRef.current.clientWidth / threeDRef.current.clientHeight,
      0.1,
      1000,
    )
    camera.position.z = 5
    cameraRef.current = camera

    // Setup renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(threeDRef.current.clientWidth, threeDRef.current.clientHeight)
    threeDRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Setup controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.autoRotate = autoRotate
    controls.autoRotateSpeed = rotationSpeed * 5
    controlsRef.current = controls

    // Add axes helper
    const axesHelper = new THREE.AxesHelper(3)
    scene.add(axesHelper)

    // Create 3D visualization
    updateVisualization()

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // Handle window resize
    const handleResize = () => {
      if (!threeDRef.current || !camera || !renderer) return

      camera.aspect = threeDRef.current.clientWidth / threeDRef.current.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(threeDRef.current.clientWidth / threeDRef.current.clientHeight)
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [dataPoints.length, autoRotate, rotationSpeed])

  // Update visualization when parameters change
  useEffect(() => {
    if (dataPoints.length > 0) {
      updateVisualization()
    }
  }, [xAxis, yAxis, zAxis, colorBy, sizeBy, pointSize, dataPoints])

  // Update 3D visualization
  const updateVisualization = () => {
    if (!sceneRef.current || dataPoints.length === 0) return

    // Remove previous points
    if (pointsRef.current) {
      sceneRef.current.remove(pointsRef.current)
    }

    // Extract and normalize data
    const xValues = dataPoints.map((p) => getNumericValue(p, xAxis))
    const yValues = dataPoints.map((p) => getNumericValue(p, yAxis))
    const zValues = dataPoints.map((p) => getNumericValue(p, zAxis))
    const colorValues = dataPoints.map((p) => getNumericValue(p, colorBy))
    const sizeValues = dataPoints.map((p) => getNumericValue(p, sizeBy))

    // Normalize to range [0, 1]
    const normalize = (values: number[]): number[] => {
      const min = Math.min(...values)
      const max = Math.max(...values)
      const range = max - min
      return range === 0 ? values.map(() => 0.5) : values.map((v) => (v - min) / range)
    }

    const normalizedX = normalize(xValues)
    const normalizedY = normalize(yValues)
    const normalizedZ = normalize(zValues)
    const normalizedColor = normalize(colorValues)
    const normalizedSize = normalize(sizeValues)

    // Scale to appropriate range for visualization
    const scaledX = normalizedX.map((v) => (v - 0.5) * 4)
    const scaledY = normalizedY.map((v) => (v - 0.5) * 4)
    const scaledZ = normalizedZ.map((v) => (v - 0.5) * 4)

    // Create geometry
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(dataPoints.length * 3)
    const colors = new Float32Array(dataPoints.length * 3)
    const sizes = new Float32Array(dataPoints.length)

    for (let i = 0; i < dataPoints.length; i++) {
      positions[i * 3] = scaledX[i]
      positions[i * 3 + 1] = scaledY[i]
      positions[i * 3 + 2] = scaledZ[i]

      // Color based on the colorBy parameter (using a color gradient from blue to red)
      colors[i * 3] = normalizedColor[i] // Red
      colors[i * 3 + 1] = 0.2 // Green
      colors[i * 3 + 2] = 1 - normalizedColor[i] // Blue

      // Size based on the sizeBy parameter
      sizes[i] = pointSize * (0.5 + normalizedSize[i])
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1))

    // Create material
    const material = new THREE.PointsMaterial({
      size: pointSize / 10,
      vertexColors: true,
      sizeAttenuation: true,
    })

    // Create points
    const points = new THREE.Points(geometry, material)
    sceneRef.current.add(points)
    pointsRef.current = points

    // Add axis labels
    addAxisLabels()
  }

  // Add axis labels to the 3D scene
  const addAxisLabels = () => {
    if (!sceneRef.current) return

    // Remove existing labels
    sceneRef.current.children = sceneRef.current.children.filter((child) => !(child.userData && child.userData.isLabel))

    // Add axes helper
    const axesHelper = new THREE.AxesHelper(3)
    sceneRef.current.add(axesHelper)

    // Create text for axis labels
    const createTextSprite = (text: string, position: THREE.Vector3) => {
      const canvas = document.createElement("canvas")
      const context = canvas.getContext("2d")
      if (!context) return

      canvas.width = 256
      canvas.height = 64

      context.fillStyle = "#ffffff"
      context.fillRect(0, 0, canvas.width, canvas.height)

      context.font = "24px Arial"
      context.fillStyle = "#000000"
      context.textAlign = "center"
      context.textBaseline = "middle"
      context.fillText(text, canvas.width / 2, canvas.height / 2)

      const texture = new THREE.Texture(canvas)
      texture.needsUpdate = true

      const material = new THREE.SpriteMaterial({ map: texture })
      const sprite = new THREE.Sprite(material)
      sprite.position.copy(position)
      sprite.scale.set(1, 0.25, 1)
      sprite.userData = { isLabel: true }

      return sprite
    }

    // Add labels
    const xLabel = createTextSprite(xAxis, new THREE.Vector3(3.5, 0, 0))
    const yLabel = createTextSprite(yAxis, new THREE.Vector3(0, 3.5, 0))
    const zLabel = createTextSprite(zAxis, new THREE.Vector3(0, 0, 3.5))

    if (xLabel) sceneRef.current.add(xLabel)
    if (yLabel) sceneRef.current.add(yLabel)
    if (zLabel) sceneRef.current.add(zLabel)
  }

  // Export 3D visualization as image
  const exportVisualization = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return

    // Render the scene
    rendererRef.current.render(sceneRef.current, cameraRef.current)

    // Get the image data
    const imageData = rendererRef.current.domElement.toDataURL("image/png")

    // Create download link
    const link = document.createElement("a")
    link.href = imageData
    link.download = "3d_visualization.png"
    link.click()

    toast({
      title: "Visualization Exported",
      description: "The 3D visualization has been exported as an image.",
    })
  }

  // Load data from checklist
  const loadDataFromChecklist = () => {
    setLoading(true)

    const savedChecklist = localStorage.getItem("checklist")
    if (savedChecklist) {
      try {
        const parsedChecklist = JSON.parse(savedChecklist)

        let dataToUse
        if (showOnlyImported) {
          dataToUse = parsedChecklist.filter((item: DataPoint) => item.imported)
          if (dataToUse.length === 0) {
            toast({
              title: "No Imported Data",
              description: "No imported data found in the checklist. Try toggling 'Show Only Imported Data' off.",
              variant: "destructive",
            })
            setNoImportedDataAlert(true)
            dataToUse = parsedChecklist.filter((item: DataPoint) => item.value !== undefined)
          } else {
            setNoImportedDataAlert(false)
          }
        } else {
          dataToUse = parsedChecklist.filter((item: DataPoint) => item.value !== undefined)
        }

        if (dataToUse.length > 0) {
          processLoadedData(dataToUse)

          toast({
            title: "Data Loaded",
            description: `Loaded ${dataToUse.length} data points for analysis.`,
          })
        } else {
          toast({
            title: "No Data Available",
            description: "No data points with values found in the checklist.",
            variant: "destructive",
          })
        }
      } catch (e) {
        toast({
          title: "Error Loading Data",
          description: "Failed to parse checklist data.",
          variant: "destructive",
        })
      }
    } else {
      toast({
        title: "No Checklist Found",
        description: "No checklist data found. Please generate and save a checklist first.",
        variant: "destructive",
      })
    }

    setLoading(false)
  }

  // Get numeric value from a data point for a specific key
  const getNumericValue = (point: DataPoint, key: string): number => {
    const value = point[key]
    if (typeof value === "number") return value

    if (typeof value === "string") {
      if (key === "height" || key === "width") {
        return Number.parseFloat(value.replace("m", ""))
      } else if (key === "pga") {
        return Number.parseFloat(value.replace("g", ""))
      } else if (key === "slopeRatio") {
        const ratio = value.split(":")[1]
        return Number.parseFloat(ratio)
      } else if (key === "relativeDensity") {
        return Number.parseFloat(value.replace("Dr=", "").replace("%", ""))
      } else if (key === "inclination") {
        return Number.parseFloat(value.replace(" degrees", "").replace(" degree", ""))
      } else if (key === "groundwater" || key === "h1h2Ratio") {
        return Number.parseFloat(value)
      } else {
        // Try to parse any other string as a number
        const parsed = Number.parseFloat(value)
        return isNaN(parsed) ? 0 : parsed
      }
    }
    return 0
  }

  // Prepare data for scatter plot
  const prepareScatterData = () => {
    if (dataPoints.length === 0) return { data: [] }

    // Group by colorBy parameter
    const groupedData: Record<string, { x: number; y: number }[]> = {}

    dataPoints.forEach((point) => {
      const groupValue = String(point[colorBy] || "Unknown")

      if (!groupedData[groupValue]) {
        groupedData[groupValue] = []
      }

      groupedData[groupValue].push({
        x: getNumericValue(point, xAxis),
        y: getNumericValue(point, yAxis),
      })
    })

    // Convert to series format
    const series = Object.entries(groupedData).map(([name, points]) => ({
      name,
      data: points,
    }))

    return { data: series }
  }

  // Prepare data for bar chart
  const prepareBarData = () => {
    if (dataPoints.length === 0) return { data: [], categories: [] }

    // Group by xAxis and colorBy parameters
    const groupedData: Record<string, Record<string, number[]>> = {}

    dataPoints.forEach((point) => {
      const xValue = String(point[xAxis] || "Unknown")
      const groupValue = String(point[colorBy] || "Unknown")

      if (!groupedData[groupValue]) {
        groupedData[groupValue] = {}
      }

      if (!groupedData[groupValue][xValue]) {
        groupedData[groupValue][xValue] = []
      }

      groupedData[groupValue][xValue].push(getNumericValue(point, yAxis))
    })

    // Calculate averages for each group and x-value
    const series = Object.entries(groupedData).map(([group, values]) => {
      return {
        name: group,
        data: Object.entries(values).map(([x, vals]) => ({
          x,
          y: vals.reduce((sum, val) => sum + val, 0) / vals.length,
        })),
      }
    })

    // Get all unique x-axis values
    const categories = Array.from(new Set(dataPoints.map((point) => String(point[xAxis] || "Unknown")))).sort()

    return { data: series, categories }
  }

  // Prepare data for line chart
  const prepareLineData = () => {
    return prepareBarData() // Same structure as bar chart
  }

  // Prepare data for pie chart
  const preparePieData = () => {
    if (dataPoints.length === 0) return []

    // Group by the selected x-axis parameter
    const groupedData: Record<string, number> = {}

    dataPoints.forEach((point) => {
      const xValue = String(point[xAxis] || "Unknown")

      if (!groupedData[xValue]) {
        groupedData[xValue] = 0
      }

      groupedData[xValue] += getNumericValue(point, yAxis)
    })

    return Object.entries(groupedData).map(([name, value]) => ({ name, value }))
  }

  // Export data as CSV
  const exportDataAsCSV = () => {
    if (dataPoints.length === 0) return

    // Get all unique column names
    const allColumns = new Set<string>()
    dataPoints.forEach((point) => {
      Object.keys(point).forEach((key) => {
        if (!key.startsWith("_") && key !== "id" && key !== "selected" && key !== "analysisColumns") {
          allColumns.add(key)
        }
      })
    })

    const columns = Array.from(allColumns)

    // Create CSV content
    let csvContent = columns.join(",") + "\n"

    dataPoints.forEach((point) => {
      const row = columns.map((col) => {
        const value = point[col]
        // Handle strings with commas by wrapping in quotes
        if (typeof value === "string" && value.includes(",")) {
          return `"${value}"`
        }
        return value !== undefined ? value : ""
      })
      csvContent += row.join(",") + "\n"
    })

    // Create and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "analysis_data.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Data Exported",
      description: `Successfully exported ${dataPoints.length} data points as CSV.`,
    })
  }

  const { data: scatterData } = prepareScatterData()
  const { data: barData, categories: barCategories } = prepareBarData()
  const { data: lineData, categories: lineCategories } = prepareLineData()
  const pieData = preparePieData()

  return (
    <div className="space-y-6">
      {noImportedDataAlert && (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Imported Data Found</AlertTitle>
          <AlertDescription>
            No imported data was found for analysis. Please import data in the Checklist tab by selecting items and
            using the "Batch Import" button, or by importing individual items.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="show-only-imported"
              checked={showOnlyImported}
              onChange={(e) => setShowOnlyImported(e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="show-only-imported">Show Only Imported Data</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="show-raw-data"
              checked={showRawData}
              onChange={(e) => setShowRawData(e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="show-raw-data">Show Raw Data Table</Label>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportDataAsCSV} disabled={dataPoints.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
          <Button onClick={loadDataFromChecklist} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <FileUp className="mr-2 h-4 w-4" />
                Refresh Data
              </>
            )}
          </Button>
        </div>
      </div>

      {customColumns.length > 0 && (
        <Alert>
          <BarChart2 className="h-4 w-4" />
          <AlertTitle>Custom Analysis Columns Detected</AlertTitle>
          <AlertDescription>
            {customColumns.length} custom columns were detected from your imported data. These columns are now available
            for selection in the analysis tools.
          </AlertDescription>
        </Alert>
      )}

      {showRawData && dataPoints.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium flex items-center">
              <TableIcon className="h-5 w-5 mr-2 text-blue-500" />
              Raw Data Table
            </h3>
            <p className="text-sm text-gray-500">
              Showing {Math.min(dataPoints.length, 100)} of {dataPoints.length} rows
            </p>
          </div>

          <div className="overflow-x-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  {availableColumns.map((column) => (
                    <TableHead key={column} className="whitespace-nowrap">
                      {column} {customColumns.includes(column) && "(Custom)"}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataPoints.slice(0, 100).map((point, index) => (
                  <TableRow key={index}>
                    {availableColumns.map((column) => (
                      <TableCell key={column} className="truncate max-w-[150px]">
                        {point[column] !== undefined ? String(point[column]) : "-"}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {dataPoints.length > 100 && (
            <p className="text-xs text-gray-500 mt-2">* Showing first 100 rows only. Export data to view all rows.</p>
          )}
        </Card>
      )}

      <Tabs defaultValue="3d" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-4">
          <TabsTrigger value="3d">3D Visualization</TabsTrigger>
          <TabsTrigger value="correlation">Correlation Analysis</TabsTrigger>
          <TabsTrigger value="scatter">Scatter Plot</TabsTrigger>
          <TabsTrigger value="bar">Bar Chart</TabsTrigger>
          <TabsTrigger value="line">Line Chart</TabsTrigger>
        </TabsList>

        <TabsContent value="3d" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="x-axis">X-Axis Parameter</Label>
              <Select value={xAxis} onValueChange={(value) => setXAxis(value)}>
                <SelectTrigger id="x-axis">
                  <SelectValue placeholder="Select X-Axis" />
                </SelectTrigger>
                <SelectContent>
                  {availableColumns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col} {customColumns.includes(col) && "(Custom)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="y-axis">Y-Axis Parameter</Label>
              <Select value={yAxis} onValueChange={(value) => setYAxis(value)}>
                <SelectTrigger id="y-axis">
                  <SelectValue placeholder="Select Y-Axis" />
                </SelectTrigger>
                <SelectContent>
                  {availableColumns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col} {customColumns.includes(col) && "(Custom)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="z-axis">Z-Axis Parameter</Label>
              <Select value={zAxis} onValueChange={(value) => setZAxis(value)}>
                <SelectTrigger id="z-axis">
                  <SelectValue placeholder="Select Z-Axis" />
                </SelectTrigger>
                <SelectContent>
                  {availableColumns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col} {customColumns.includes(col) && "(Custom)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="color-by">Color By</Label>
              <Select value={colorBy} onValueChange={(value) => setColorBy(value)}>
                <SelectTrigger id="color-by">
                  <SelectValue placeholder="Select Color Parameter" />
                </SelectTrigger>
                <SelectContent>
                  {availableColumns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col} {customColumns.includes(col) && "(Custom)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="size-by">Size By</Label>
              <Select value={sizeBy} onValueChange={(value) => setSizeBy(value)}>
                <SelectTrigger id="size-by">
                  <SelectValue placeholder="Select Size Parameter" />
                </SelectTrigger>
                <SelectContent>
                  {availableColumns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col} {customColumns.includes(col) && "(Custom)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="point-size">Point Size: {pointSize}</Label>
              <Slider
                id="point-size"
                min={1}
                max={20}
                step={1}
                value={[pointSize]}
                onValueChange={(value) => setPointSize(value[0])}
              />
            </div>
          </div>

          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="auto-rotate"
                  checked={autoRotate}
                  onChange={(e) => setAutoRotate(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="auto-rotate">Auto Rotate</Label>
              </div>

              {autoRotate && (
                <div className="flex items-center space-x-2">
                  <Label htmlFor="rotation-speed">Speed: {rotationSpeed.toFixed(1)}</Label>
                  <Slider
                    id="rotation-speed"
                    min={0.1}
                    max={2}
                    step={0.1}
                    value={[rotationSpeed]}
                    onValueChange={(value) => {
                      setRotationSpeed(value[0])
                      if (controlsRef.current) {
                        controlsRef.current.autoRotateSpeed = value[0] * 5
                      }
                    }}
                    className="w-32"
                  />
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={exportVisualization}>
                <Download className="h-4 w-4 mr-2" />
                Export Image
              </Button>
              <Button variant="outline" size="sm" onClick={() => updateVisualization()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          <Card className="p-0 overflow-hidden">
            <div ref={threeDRef} className="w-full h-[500px] relative">
              {dataPoints.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                  <p className="text-gray-500">No data points available for 3D visualization</p>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="correlation" className="space-y-6">
          <Card className="p-4">
            <h3 className="font-medium mb-4">Parameter Correlation with {zAxis}</h3>

            {correlations.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-gray-500">
                No data available for correlation analysis
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Correlation coefficient ranges from -1 to 1. Values closer to -1 or 1 indicate stronger correlation.
                  {dataPoints.length > 1000 &&
                    " For performance reasons, correlation is calculated using a random sample of 1000 data points."}
                </p>

                <div className="space-y-2">
                  {correlations.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-1/4 font-medium">
                        {item.parameter} {customColumns.includes(item.parameter) && "(Custom)"}:
                      </div>
                      <div className="w-3/4 flex items-center">
                        <div className="h-6 relative flex items-center" style={{ width: "100%" }}>
                          <div className="absolute inset-y-0 left-1/2 w-[1px] bg-gray-400"></div>
                          <div
                            className={`absolute inset-y-0 ${item.correlation < 0 ? "right-1/2" : "left-1/2"}`}
                            style={{
                              width: `${Math.abs(item.correlation) * 50}%`,
                              backgroundColor: item.correlation < 0 ? "#ef4444" : "#3b82f6",
                            }}
                          ></div>
                        </div>
                        <span className="ml-2 font-mono">{item.correlation.toFixed(3)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <h4 className="font-medium mb-2">Interpretation</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>
                      <strong>Strong positive correlation</strong> (close to 1): As this parameter increases, {zAxis}
                      value tends to increase.
                    </li>
                    <li>
                      <strong>Strong negative correlation</strong> (close to -1): As this parameter increases,
                      {zAxis} value tends to decrease.
                    </li>
                    <li>
                      <strong>Weak correlation</strong> (close to 0): This parameter has little relationship with
                      {zAxis} value.
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="scatter" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="scatter-x">X-Axis Parameter</Label>
              <Select value={xAxis} onValueChange={(value) => setXAxis(value)}>
                <SelectTrigger id="scatter-x">
                  <SelectValue placeholder="Select X-Axis" />
                </SelectTrigger>
                <SelectContent>
                  {availableColumns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col} {customColumns.includes(col) && "(Custom)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="scatter-y">Y-Axis Parameter</Label>
              <Select value={yAxis} onValueChange={(value) => setYAxis(value)}>
                <SelectTrigger id="scatter-y">
                  <SelectValue placeholder="Select Y-Axis" />
                </SelectTrigger>
                <SelectContent>
                  {availableColumns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col} {customColumns.includes(col) && "(Custom)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="scatter-color">Group By</Label>
              <Select value={colorBy} onValueChange={(value) => setColorBy(value)}>
                <SelectTrigger id="scatter-color">
                  <SelectValue placeholder="Select Group Parameter" />
                </SelectTrigger>
                <SelectContent>
                  {availableColumns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col} {customColumns.includes(col) && "(Custom)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card className="p-4">
            <div className="h-[400px]">
              {dataPoints.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No data points available for scatter analysis
                </div>
              ) : (
                <ScatterChart
                  data={scatterData}
                  yAxisWidth={40}
                  showLegend
                  showXAxis
                  showYAxis
                  showGridLines
                  showTooltip
                />
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="bar" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="bar-x">X-Axis Parameter</Label>
              <Select value={xAxis} onValueChange={(value) => setXAxis(value)}>
                <SelectTrigger id="bar-x">
                  <SelectValue placeholder="Select X-Axis" />
                </SelectTrigger>
                <SelectContent>
                  {availableColumns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col} {customColumns.includes(col) && "(Custom)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="bar-y">Y-Axis Parameter</Label>
              <Select value={yAxis} onValueChange={(value) => setYAxis(value)}>
                <SelectTrigger id="bar-y">
                  <SelectValue placeholder="Select Y-Axis" />
                </SelectTrigger>
                <SelectContent>
                  {availableColumns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col} {customColumns.includes(col) && "(Custom)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="bar-group">Group By</Label>
              <Select value={colorBy} onValueChange={(value) => setColorBy(value)}>
                <SelectTrigger id="bar-group">
                  <SelectValue placeholder="Select Group Parameter" />
                </SelectTrigger>
                <SelectContent>
                  {availableColumns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col} {customColumns.includes(col) && "(Custom)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card className="p-4">
            <div className="h-[400px]">
              {dataPoints.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No data points available for bar chart analysis
                </div>
              ) : (
                <BarChart
                  data={barData}
                  categories={barCategories}
                  index="x"
                  yAxisWidth={40}
                  showLegend
                  showXAxis
                  showYAxis
                  showGridLines
                  showTooltip
                />
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="line" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="line-x">X-Axis Parameter</Label>
              <Select value={xAxis} onValueChange={(value) => setXAxis(value)}>
                <SelectTrigger id="line-x">
                  <SelectValue placeholder="Select X-Axis" />
                </SelectTrigger>
                <SelectContent>
                  {availableColumns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col} {customColumns.includes(col) && "(Custom)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="line-y">Y-Axis Parameter</Label>
              <Select value={yAxis} onValueChange={(value) => setYAxis(value)}>
                <SelectTrigger id="line-y">
                  <SelectValue placeholder="Select Y-Axis" />
                </SelectTrigger>
                <SelectContent>
                  {availableColumns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col} {customColumns.includes(col) && "(Custom)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="line-group">Group By</Label>
              <Select value={colorBy} onValueChange={(value) => setColorBy(value)}>
                <SelectTrigger id="line-group">
                  <SelectValue placeholder="Select Group Parameter" />
                </SelectTrigger>
                <SelectContent>
                  {availableColumns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col} {customColumns.includes(col) && "(Custom)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card className="p-4">
            <div className="h-[400px]">
              {dataPoints.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No data points available for line chart analysis
                </div>
              ) : (
                <LineChart
                  data={lineData}
                  categories={lineCategories}
                  index="x"
                  yAxisWidth={40}
                  showLegend
                  showXAxis
                  showYAxis
                  showGridLines
                  showTooltip
                />
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
