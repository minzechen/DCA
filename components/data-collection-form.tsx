"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BarChart, LineChart, PieChart } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Save, BarChartIcon, LineChartIcon, PieChartIcon, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsItem, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { initialMindMapData } from "./mind-map"

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
  timestamp: string
}

export function DataCollectionForm() {
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [height, setHeight] = useState("")
  const [width, setWidth] = useState("")
  const [slopeRatio, setSlopeRatio] = useState("")
  const [pga, setPga] = useState("")
  const [h1h2Ratio, setH1h2Ratio] = useState("")
  const [groundwater, setGroundwater] = useState("")
  const [relativeDensity, setRelativeDensity] = useState("")
  const [inclination, setInclination] = useState("")
  const [value, setValue] = useState("")
  const [chartType, setChartType] = useState<"bar" | "line" | "pie">("bar")
  const [xAxis, setXAxis] = useState<keyof DataPoint>("height")
  const [groupBy, setGroupBy] = useState<keyof DataPoint>("pga")
  const { toast } = useToast()

  // Get unique values for each parameter from the mind map
  const getParameterValues = (categoryId: string, subcategoryId?: string) => {
    const mindMapData = initialMindMapData
    const category = mindMapData.children?.find((c) => c.id === categoryId)
    if (!category) return []

    if (subcategoryId) {
      const subcategory = category.children?.find((s) => s.id === subcategoryId)
      return subcategory?.children?.map((c) => c.name) || []
    } else {
      return category.children?.map((c) => c.name) || []
    }
  }

  // Heights
  const heights = getParameterValues("dike-size", "height")
  // Widths
  const widths = getParameterValues("dike-size", "width")
  // Slope Ratios
  const slopeRatios = getParameterValues("dike-size", "slope-ratio")
  // PGAs
  const pgas = getParameterValues("earthquake", "pga")
  // H1/(H1+H2) Ratios
  const h1h2Ratios = getParameterValues("thickness-ratio", "h1h2")
  // Groundwater levels
  const groundwaters = getParameterValues("thickness-ratio", "groundwater")
  // Relative Densities
  const relativeDensities =
    initialMindMapData.children?.find((c) => c.id === "relative-density")?.children?.map((c) => c.name) || []
  // Inclinations
  const inclinations =
    initialMindMapData.children?.find((c) => c.id === "inclination")?.children?.map((c) => c.name) || []

  // Add a new data point
  const addDataPoint = () => {
    if (
      !height ||
      !width ||
      !slopeRatio ||
      !pga ||
      !h1h2Ratio ||
      !groundwater ||
      !relativeDensity ||
      !inclination ||
      !value ||
      isNaN(Number.parseFloat(value))
    ) {
      toast({
        title: "Invalid Input",
        description: "Please fill in all fields with valid values.",
        variant: "destructive",
      })
      return
    }

    const newDataPoint: DataPoint = {
      id: `dp-${Date.now()}`,
      height,
      width,
      slopeRatio,
      pga,
      h1h2Ratio,
      groundwater,
      relativeDensity,
      inclination,
      value: Number.parseFloat(value),
      timestamp: new Date().toISOString(),
    }

    setDataPoints((prev) => [...prev, newDataPoint])
    setValue("")

    toast({
      title: "Data Point Added",
      description: `Added value ${value} for the selected parameters`,
    })
  }

  // Save all data points
  const saveDataPoints = () => {
    setLoading(true)

    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      localStorage.setItem("dikeDataPoints", JSON.stringify(dataPoints))

      toast({
        title: "Data Saved",
        description: `Successfully saved ${dataPoints.length} data points.`,
      })
    }, 1000)
  }

  // Import data from checklist
  const importFromChecklist = () => {
    const savedChecklist = localStorage.getItem("checklist")
    if (!savedChecklist) {
      toast({
        title: "No Checklist Found",
        description: "There is no saved checklist data to import.",
        variant: "destructive",
      })
      return
    }

    try {
      const checklist = JSON.parse(savedChecklist)
      const selectedItems = checklist.filter((item: any) => item.selected && item.value !== undefined)

      if (selectedItems.length === 0) {
        toast({
          title: "No Valid Data",
          description: "No selected items with values found in the checklist.",
          variant: "destructive",
        })
        return
      }

      if (selectedItems.length > 500) {
        toast({
          title: "Large Dataset",
          description: `You're importing ${selectedItems.length} items. This may take a moment.`,
        })
      }

      const newDataPoints = selectedItems.map((item: any) => ({
        id: `dp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        height: item.height,
        width: item.width,
        slopeRatio: item.slopeRatio,
        pga: item.pga,
        h1h2Ratio: item.h1h2Ratio,
        groundwater: item.groundwater,
        relativeDensity: item.relativeDensity,
        inclination: item.inclination,
        value: item.value,
        timestamp: new Date().toISOString(),
      }))

      setDataPoints((prev) => [...prev, ...newDataPoints])

      toast({
        title: "Data Imported",
        description: `Successfully imported ${newDataPoints.length} data points from checklist.`,
      })
    } catch (e) {
      toast({
        title: "Import Failed",
        description: "Failed to parse checklist data.",
        variant: "destructive",
      })
    }
  }

  // Load saved data points on component mount
  useEffect(() => {
    const savedData = localStorage.getItem("dikeDataPoints")
    if (savedData) {
      try {
        setDataPoints(JSON.parse(savedData))
      } catch (e) {
        console.error("Failed to parse saved data points")
      }
    }
  }, [])

  // Prepare chart data
  const prepareChartData = () => {
    if (dataPoints.length === 0) return { series: [], categories: [] }

    // Group by the selected groupBy parameter
    const groupedData: Record<string, Record<string, number[]>> = {}

    dataPoints.forEach((point) => {
      const groupValue = point[groupBy] as string
      const xValue = point[xAxis] as string

      if (!groupedData[groupValue]) {
        groupedData[groupValue] = {}
      }

      if (!groupedData[groupValue][xValue]) {
        groupedData[groupValue][xValue] = []
      }

      groupedData[groupValue][xValue].push(point.value)
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
    const categories = Array.from(new Set(dataPoints.map((point) => point[xAxis] as string))).sort()

    return { series, categories }
  }

  const { series, categories } = prepareChartData()

  // Prepare pie chart data
  const preparePieData = () => {
    if (dataPoints.length === 0) return []

    // Group by the selected x-axis parameter
    const groupedData: Record<string, number> = {}

    dataPoints.forEach((point) => {
      const xValue = point[xAxis] as string

      if (!groupedData[xValue]) {
        groupedData[xValue] = 0
      }

      groupedData[xValue] += point.value
    })

    return Object.entries(groupedData).map(([name, value]) => ({ name, value }))
  }

  const pieData = preparePieData()

  return (
    <div className="space-y-6">
      <Tabs defaultValue="input" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="input">Data Input</TabsTrigger>
          <TabsTrigger value="visualization">Data Visualization</TabsTrigger>
        </TabsList>

        <TabsContent value="input" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-4">
              <h3 className="font-medium mb-4">Add Data Point</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="height">Height</Label>
                  <Select value={height} onValueChange={setHeight}>
                    <SelectTrigger id="height">
                      <SelectValue placeholder="Select height" />
                    </SelectTrigger>
                    <SelectContent>
                      {heights.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="width">Width</Label>
                  <Select value={width} onValueChange={setWidth}>
                    <SelectTrigger id="width">
                      <SelectValue placeholder="Select width" />
                    </SelectTrigger>
                    <SelectContent>
                      {widths.map((w) => (
                        <SelectItem key={w} value={w}>
                          {w}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="slope-ratio">Slope Ratio</Label>
                  <Select value={slopeRatio} onValueChange={setSlopeRatio}>
                    <SelectTrigger id="slope-ratio">
                      <SelectValue placeholder="Select slope ratio" />
                    </SelectTrigger>
                    <SelectContent>
                      {slopeRatios.map((sr) => (
                        <SelectItem key={sr} value={sr}>
                          {sr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="pga">PGA</Label>
                  <Select value={pga} onValueChange={setPga}>
                    <SelectTrigger id="pga">
                      <SelectValue placeholder="Select PGA" />
                    </SelectTrigger>
                    <SelectContent>
                      {pgas.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="h1h2-ratio">H1/(H1+H2) Ratio</Label>
                  <Select value={h1h2Ratio} onValueChange={setH1h2Ratio}>
                    <SelectTrigger id="h1h2-ratio">
                      <SelectValue placeholder="Select ratio" />
                    </SelectTrigger>
                    <SelectContent>
                      {h1h2Ratios.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="groundwater">Groundwater</Label>
                  <Select value={groundwater} onValueChange={setGroundwater}>
                    <SelectTrigger id="groundwater">
                      <SelectValue placeholder="Select groundwater" />
                    </SelectTrigger>
                    <SelectContent>
                      {groundwaters.map((gw) => (
                        <SelectItem key={gw} value={gw}>
                          {gw}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="relative-density">Relative Density</Label>
                  <Select value={relativeDensity} onValueChange={setRelativeDensity}>
                    <SelectTrigger id="relative-density">
                      <SelectValue placeholder="Select density" />
                    </SelectTrigger>
                    <SelectContent>
                      {relativeDensities.map((rd) => (
                        <SelectItem key={rd} value={rd}>
                          {rd}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="inclination">Inclination</Label>
                  <Select value={inclination} onValueChange={setInclination}>
                    <SelectTrigger id="inclination">
                      <SelectValue placeholder="Select inclination" />
                    </SelectTrigger>
                    <SelectContent>
                      {inclinations.map((inc) => (
                        <SelectItem key={inc} value={inc}>
                          {inc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="value">Settlement Value</Label>
                  <Input
                    id="value"
                    type="number"
                    placeholder="Enter numerical value"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                </div>

                <div className="col-span-2 flex justify-between">
                  <Button onClick={addDataPoint}>Add Data Point</Button>
                  <div className="space-x-2">
                    <Button variant="outline" onClick={importFromChecklist}>
                      <Upload className="mr-2 h-4 w-4" />
                      Import from Checklist
                    </Button>
                    <Button variant="outline" onClick={saveDataPoints} disabled={loading || dataPoints.length === 0}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save All Data
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-medium mb-4">Data Points ({dataPoints.length})</h3>

              <div className="h-[400px] overflow-y-auto border rounded">
                {dataPoints.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">No data points added yet</div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                      <tr>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Height
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Width
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          PGA
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Density
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Value
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                      {dataPoints.map((point) => (
                        <tr key={point.id}>
                          <td className="px-2 py-2 text-sm">{point.height}</td>
                          <td className="px-2 py-2 text-sm">{point.width}</td>
                          <td className="px-2 py-2 text-sm">{point.pga}</td>
                          <td className="px-2 py-2 text-sm">{point.relativeDensity}</td>
                          <td className="px-2 py-2 text-sm">{point.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="visualization" className="space-y-6">
          <Card className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Data Visualization</h3>
              <div className="flex space-x-2">
                <Button
                  variant={chartType === "bar" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartType("bar")}
                >
                  <BarChartIcon className="h-4 w-4 mr-2" />
                  Bar
                </Button>
                <Button
                  variant={chartType === "line" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartType("line")}
                >
                  <LineChartIcon className="h-4 w-4 mr-2" />
                  Line
                </Button>
                <Button
                  variant={chartType === "pie" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartType("pie")}
                >
                  <PieChartIcon className="h-4 w-4 mr-2" />
                  Pie
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="x-axis">X-Axis Parameter</Label>
                <Select value={xAxis} onValueChange={(value) => setXAxis(value as keyof DataPoint)}>
                  <SelectTrigger id="x-axis">
                    <SelectValue placeholder="Select X-Axis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="height">Height</SelectItem>
                    <SelectItem value="width">Width</SelectItem>
                    <SelectItem value="slopeRatio">Slope Ratio</SelectItem>
                    <SelectItem value="pga">PGA</SelectItem>
                    <SelectItem value="h1h2Ratio">H1/(H1+H2) Ratio</SelectItem>
                    <SelectItem value="groundwater">Groundwater</SelectItem>
                    <SelectItem value="relativeDensity">Relative Density</SelectItem>
                    <SelectItem value="inclination">Inclination</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="group-by">Group By</Label>
                <Select value={groupBy} onValueChange={(value) => setGroupBy(value as keyof DataPoint)}>
                  <SelectTrigger id="group-by">
                    <SelectValue placeholder="Select Group By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="height">Height</SelectItem>
                    <SelectItem value="width">Width</SelectItem>
                    <SelectItem value="slopeRatio">Slope Ratio</SelectItem>
                    <SelectItem value="pga">PGA</SelectItem>
                    <SelectItem value="h1h2Ratio">H1/(H1+H2) Ratio</SelectItem>
                    <SelectItem value="groundwater">Groundwater</SelectItem>
                    <SelectItem value="relativeDensity">Relative Density</SelectItem>
                    <SelectItem value="inclination">Inclination</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="h-[400px]">
              {dataPoints.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Add data points to generate visualizations
                </div>
              ) : chartType === "bar" ? (
                <BarChart
                  data={series}
                  categories={categories}
                  index="x"
                  yAxisWidth={40}
                  showLegend
                  showXAxis
                  showYAxis
                  showGridLines
                  showTooltip
                />
              ) : chartType === "line" ? (
                <LineChart
                  data={series}
                  categories={categories}
                  index="x"
                  yAxisWidth={40}
                  showLegend
                  showXAxis
                  showYAxis
                  showGridLines
                  showTooltip
                />
              ) : (
                <PieChart data={pieData} showLegend showTooltip />
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
