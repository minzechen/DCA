"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader2, Upload, Plus, Save, FileUp, Download, RefreshCw, Zap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { MindMapImport } from "./mind-map-import"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"

// Helper function to determine text color based on background color for contrast
function getContrastTextColor(hexcolor: string): string {
  // Remove # if it exists
  const cleanHex = hexcolor.replace(/^#/, '');

  // Parse hex to RGB
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  // Calculate luminance (perceived brightness)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Use black text for light backgrounds, white text for dark backgrounds
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

// Define the structure for mind map data
export interface MindMapNode {
  id: string
  name: string
  color?: string
  children?: MindMapNode[]
}

// Updated data based on the new dike settlement factors table
export const initialMindMapData: MindMapNode = {
  id: "root",
  name: "Dike settlement factors table",
  children: [
    {
      id: "dike-size",
      name: "Dike size",
      color: "#f87171", // red
      children: [
        {
          id: "height",
          name: "Height",
          children: [
            { id: "height-5m", name: "5m" },
            { id: "height-7.5m", name: "7.5m" },
            { id: "height-10m", name: "10m" },
          ],
        },
        {
          id: "width",
          name: "Width",
          children: [
            { id: "width-20m", name: "20m" },
            { id: "width-25m", name: "25m" },
            { id: "width-30m", name: "30m" },
          ],
        },
        {
          id: "slope-ratio",
          name: "Slope ratio(V:H)",
          children: [
            { id: "ratio-1:1.2", name: "1:1.2" },
            { id: "ratio-1:1.5", name: "1:1.5" },
            { id: "ratio-1:1.8", name: "1:1.8" },
          ],
        },
      ],
    },
    {
      id: "earthquake",
      name: "Earthquake",
      color: "#facc15", // yellow/orange
      children: [
        {
          id: "pga",
          name: "PGA",
          children: [
            { id: "pga-0.1g", name: "0.1g" },
            { id: "pga-0.2g", name: "0.2g" },
            { id: "pga-0.3g", name: "0.3g" },
          ],
        },
      ],
    },
    {
      id: "thickness-ratio",
      name: "Liquifiable and nonliquifiable thickness ratio",
      color: "#4ade80", // green
      children: [
        {
          id: "h1h2",
          name: "H1/(H1+H2)",
          children: [
            { id: "h1h2-0.6", name: "0.6" },
            { id: "h1h2-0.4", name: "0.4" },
            { id: "h1h2-0.2", name: "0.2" },
          ],
        },
        {
          id: "groundwater",
          name: "Groundwater table",
          children: [
            { id: "gw-1m", name: "-1m" },
            { id: "gw-3m", name: "-3m" },
            { id: "gw-5m", name: "-5m" },
          ],
        },
      ],
    },
    {
      id: "relative-density",
      name: "Relative density",
      color: "#3b82f6", // blue
      children: [
        { id: "density-30", name: "Dr=30%" },
        { id: "density-50", name: "Dr=50%" },
        { id: "density-70", name: "Dr=70%" },
      ],
    },
    {
      id: "inclination",
      name: "Inclination angle of stratum",
      color: "#a855f7", // purple
      children: [
        { id: "inclination-1", name: "1 degree" },
        { id: "inclination-3", name: "3 degrees" },
        { id: "inclination-5", name: "5 degrees" },
      ],
    },
  ],
}

export function MindMap() {
  const [mindMapData, setMindMapData] = useState<MindMapNode>({
    id: "root",
    name: "Dike settlement factors table",
    children: [],
  })
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("visualization")
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showTips, setShowTips] = useState(false)
  const { toast } = useToast()
  const canvasRef = useRef<HTMLDivElement>(null)

  // Function to simulate saving the mind map data
  const saveMindMap = () => {
    setLoading(true)

    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      setSaveSuccess(true)

      toast({
        title: "Mind Map Saved",
        description: "Your mind map has been saved successfully.",
      })

      // Store in localStorage for persistence
      localStorage.setItem("mindMapData", JSON.stringify(mindMapData))

      // Reset success state after animation
      setTimeout(() => setSaveSuccess(false), 2000)
    }, 1000)
  }

  // Generate a sample mind map
  const generateSampleMindMap = () => {
    setIsGenerating(true)

    // Simulate generation process
    setTimeout(() => {
      setMindMapData(initialMindMapData)
      setIsGenerating(false)

      toast({
        title: "Sample Mind Map Generated",
        description: "A sample mind map has been generated for demonstration.",
      })

      // Store in localStorage
      localStorage.setItem("mindMapData", JSON.stringify(initialMindMapData))
    }, 1500)
  }

  // Calculate total combinations
  const calculateTotalCombinations = () => {
    if (!mindMapData.children || mindMapData.children.length === 0) return 0

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

  // Handle mind map import completion
  const handleImportComplete = (importedData: MindMapNode) => {
    setMindMapData(importedData)
    setActiveTab("visualization")

    toast({
      title: "Mind Map Imported",
      description: "The mind map structure has been imported successfully.",
    })

    // Store in localStorage for persistence
    localStorage.setItem("mindMapData", JSON.stringify(importedData))
  }

  // Load saved mind map data on component mount
  useEffect(() => {
    const savedData = localStorage.getItem("mindMapData")
    if (savedData) {
      try {
        setMindMapData(JSON.parse(savedData))
      } catch (e) {
        console.error("Failed to parse saved mind map data")
      }
    }
  }, [])

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-medium flex items-center">
            Mind Map Visualization
            {mindMapData.children && mindMapData.children.length > 0 && (
              <Badge variant="outline" className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {mindMapData.children.length} Categories
              </Badge>
            )}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            The mind map structure determines the checklist combinations
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab("import")}
            className="group transition-all duration-300 hover:bg-blue-50 dark:hover:bg-blue-900"
          >
            <Upload className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
            Import Mind Map
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTips(!showTips)}
            className="group transition-all duration-300 hover:bg-amber-50 dark:hover:bg-amber-900"
          >
            <Zap className="h-4 w-4 mr-2 group-hover:text-amber-500 transition-colors duration-300" />
            {showTips ? "Hide Tips" : "Show Tips"}
          </Button>
          <Button
            onClick={saveMindMap}
            disabled={loading || mindMapData.children?.length === 0}
            className="relative overflow-hidden group"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                Save Mind Map
                {saveSuccess && (
                  <motion.span
                    className="absolute inset-0 bg-green-500/20"
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ duration: 1 }}
                  />
                )}
              </>
            )}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showTips && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <div className="p-4">
                <h4 className="font-medium text-amber-800 dark:text-amber-300 mb-2">Mind Map Tips</h4>
                <ul className="list-disc pl-5 text-sm space-y-1 text-amber-700 dark:text-amber-300">
                  <li>Import an image of your mind map to automatically detect its structure</li>
                  <li>The mind map structure determines all possible combinations for your checklist</li>
                  <li>Each main category can have multiple subcategories and values</li>
                  <li>You can generate a sample mind map to see how it works</li>
                  <li>Save your mind map to use it for generating checklists</li>
                </ul>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab("visualization")}
              className={`px-4 py-3 relative ${
                activeTab === "visualization"
                  ? "border-b-2 border-primary font-medium text-primary"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Visualization
              {activeTab === "visualization" && (
                <motion.span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" layoutId="activeTab" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("import")}
              className={`px-4 py-3 relative ${
                activeTab === "import"
                  ? "border-b-2 border-primary font-medium text-primary"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Import from Image
              {activeTab === "import" && (
                <motion.span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" layoutId="activeTab" />
              )}
            </button>
          </div>
        </div>

        <div className="mt-4">
          {activeTab === "visualization" && (
            <div>
              {mindMapData.children && mindMapData.children.length > 0 ? (
                <>
                  <div className="border rounded-lg p-4 bg-white dark:bg-gray-100 overflow-auto shadow-inner">
                    <div className="flex justify-center">
                      <div ref={canvasRef} className="relative w-full h-[500px] flex items-center justify-center">
                        {/* Interactive mind map visualization */}
                        <div className="flex flex-col items-center">
                          <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-4 py-2 rounded-lg font-medium mb-4">
                            {mindMapData.name}
                          </div>
                          <div className="flex flex-wrap justify-center gap-8 max-w-4xl">
                            {mindMapData.children.map((category, index) => (
                              <motion.div
                                key={category.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex flex-col items-center"
                              >
                                <div
                                  className="px-4 py-2 rounded-lg font-medium mb-4 shadow-md"
                                  style={{
                                    backgroundColor: category.color ? `${category.color}20` : undefined, // Ensure color exists before creating transparent version
                                    borderLeft: category.color ? `4px solid ${category.color}`: undefined,
                                    color: category.color ? getContrastTextColor(category.color) : 'inherit', // Use inherit if no color
                                  }}
                                >
                                  {category.name}
                                </div>
                                {category.children && category.children.length > 0 && (
                                  <div className="flex flex-wrap justify-center gap-4 max-w-xs">
                                    {category.children.map((subcategory) => (
                                      <motion.div
                                        key={subcategory.id}
                                        whileHover={{ scale: 1.05 }}
                                        className="flex flex-col items-center"
                                      >
                                        <div className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg text-sm mb-2">
                                          {subcategory.name}
                                        </div>
                                        {subcategory.children && subcategory.children.length > 0 && (
                                          <div className="flex flex-wrap justify-center gap-2 max-w-[150px]">
                                            {subcategory.children.map((value) => (
                                              <span
                                                key={value.id}
                                                className="px-2 py-0.5 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded text-xs border border-gray-200 dark:border-gray-700"
                                              >
                                                {value.name}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </motion.div>
                                    ))}
                                  </div>
                                )}
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <Card className="p-6 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow duration-300">
                      <h3 className="font-medium mb-4 flex items-center">
                        <RefreshCw className="h-5 w-5 mr-2 text-blue-500" />
                        Mind Map Structure
                      </h3>
                      <div className="text-sm space-y-3">
                        <div className="flex items-center">
                          <span className="font-medium mr-2">Main Category:</span>
                          <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded text-xs">
                            {mindMapData.name}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium mr-2">Primary Categories:</span>
                          <span className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-2 py-0.5 rounded text-xs">
                            {mindMapData.children?.length || 0}
                          </span>
                        </div>
                        <div className="mt-2">
                          <ul className="list-disc pl-5 space-y-1">
                            {mindMapData.children?.map((child) => (
                              <motion.li
                                key={child.id}
                                whileHover={{ x: 5 }}
                                className="transition-colors duration-200 hover:text-blue-600 dark:hover:text-blue-400"
                              >
                                <span style={{ color: child.color }}>{child.name}</span> ({child.children?.length || 0}{" "}
                                subcategories)
                              </motion.li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow duration-300">
                      <h3 className="font-medium mb-4 flex items-center">
                        <FileUp className="h-5 w-5 mr-2 text-green-500" />
                        Total Combinations
                      </h3>
                      <div className="text-sm">
                        <div className="flex items-center">
                          <motion.p
                            className="text-3xl font-bold text-green-600 dark:text-green-400"
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 10 }}
                          >
                            {calculateTotalCombinations().toLocaleString()}
                          </motion.p>
                          <span className="ml-2 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
                            Combinations
                          </span>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">
                          Total possible combinations based on current mind map structure
                        </p>
                        <div className="mt-4 flex space-x-2">
                          <Button variant="outline" size="sm" className="w-full">
                            <Download className="mr-2 h-4 w-4" />
                            Export Structure
                          </Button>
                          <Button variant="outline" size="sm" className="w-full">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Category
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </div>
                </>
              ) : (
                <div className="border rounded-lg p-8 bg-white dark:bg-gray-950 flex flex-col items-center justify-center min-h-[400px] shadow-inner">
                  <div className="text-center max-w-md">
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mx-auto mb-6">
                        <Upload className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-xl font-medium mb-2">No Mind Map Available</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6">
                        Please import a mind map image to visualize the structure and generate combinations.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button onClick={() => setActiveTab("import")} className="w-full sm:w-auto">
                          <Upload className="mr-2 h-4 w-4" />
                          Import Mind Map
                        </Button>
                        <Button
                          variant="outline"
                          onClick={generateSampleMindMap}
                          disabled={isGenerating}
                          className="w-full sm:w-auto"
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Zap className="mr-2 h-4 w-4" />
                              Generate Sample
                            </>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "import" && <MindMapImport onImportComplete={handleImportComplete} />}
        </div>
      </div>
    </div>
  )
}
