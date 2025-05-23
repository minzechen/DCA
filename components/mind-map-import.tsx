"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader2, Upload, FileUp, AlertCircle, Check, ImageIcon, FileImage, Trash2 } from "lucide-react"
import NextImage from "next/image"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import type { MindMapNode } from "./mind-map"
import { motion, AnimatePresence } from "framer-motion"

interface DetectedNode {
  id: string
  name: string
  level: number
  children: DetectedNode[]
}

interface ProcessingResult {
  structure: DetectedNode
  totalCombinations: number
  categories: string[]
  subcategories: Record<string, string[]>
  values: Record<string, string[]>
}

export function MindMapImport({ onImportComplete }: { onImportComplete: (data: MindMapNode) => void }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingStage, setProcessingStage] = useState("")
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    setProcessingResult(null)

    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]

      // Check if file is an image
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file (JPG, PNG, etc.)")
        return
      }

      setSelectedFile(file)

      // Create preview URL
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Clear selected file
  const clearSelectedFile = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setProcessingResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Process the image to detect mind map structure
  const processImage = async () => {
    if (!selectedFile) return

    setIsProcessing(true)
    setProcessingProgress(0)
    setProcessingStage("Initializing image processing...")
    setError(null)

    try {
      // Simulate image processing stages
      await simulateProcessingStage("Analyzing image...", 20)
      await simulateProcessingStage("Detecting nodes and connections...", 40)
      await simulateProcessingStage("Performing OCR on text elements...", 60)
      await simulateProcessingStage("Building mind map structure...", 80)
      await simulateProcessingStage("Calculating combinations...", 90)

      // Simulate detection result
      // In a real implementation, this would be the result of actual image processing
      const result = simulateDetection()
      setProcessingResult(result)
      setProcessingProgress(100)
      setProcessingStage("Processing complete!")

      toast({
        title: "Mind Map Processed Successfully",
        description: `Detected ${result.totalCombinations} possible combinations.`,
      })
    } catch (err) {
      setError("Error processing image. Please try a clearer image of a mind map.")
      toast({
        title: "Processing Failed",
        description: "Could not process the mind map image.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Simulate a processing stage with delay
  const simulateProcessingStage = async (stage: string, progress: number) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setProcessingStage(stage)
        setProcessingProgress(progress)
        resolve()
      }, 800) // Simulate processing time
    })
  }

  // Simulate detection result
  // In a real implementation, this would use computer vision and OCR
  const simulateDetection = (): ProcessingResult => {
    // This is a simplified simulation
    // A real implementation would analyze the image pixels, detect shapes,
    // perform OCR on text, and build the structure based on connections

    const structure: DetectedNode = {
      id: "root",
      name: "Dike settlement factors table",
      level: 0,
      children: [
        {
          id: "dike-size",
          name: "Dike size",
          level: 1,
          children: [
            {
              id: "height",
              name: "Height",
              level: 2,
              children: [
                { id: "height-5m", name: "5m", level: 3, children: [] },
                { id: "height-7.5m", name: "7.5m", level: 3, children: [] },
                { id: "height-10m", name: "10m", level: 3, children: [] },
              ],
            },
            {
              id: "width",
              name: "Width",
              level: 2,
              children: [
                { id: "width-20m", name: "20m", level: 3, children: [] },
                { id: "width-25m", name: "25m", level: 3, children: [] },
                { id: "width-30m", name: "30m", level: 3, children: [] },
              ],
            },
            {
              id: "slope-ratio",
              name: "Slope ratio(V:H)",
              level: 2,
              children: [
                { id: "ratio-1:1.2", name: "1:1.2", level: 3, children: [] },
                { id: "ratio-1:1.5", name: "1:1.5", level: 3, children: [] },
                { id: "ratio-1:1.8", name: "1:1.8", level: 3, children: [] },
              ],
            },
          ],
        },
        {
          id: "earthquake",
          name: "Earthquake",
          level: 1,
          children: [
            {
              id: "pga",
              name: "PGA",
              level: 2,
              children: [
                { id: "pga-0.1g", name: "0.1g", level: 3, children: [] },
                { id: "pga-0.2g", name: "0.2g", level: 3, children: [] },
                { id: "pga-0.3g", name: "0.3g", level: 3, children: [] },
              ],
            },
          ],
        },
        {
          id: "thickness-ratio",
          name: "Liquifiable and nonliquifiable thickness ratio",
          level: 1,
          children: [
            {
              id: "h1h2",
              name: "H1/(H1+H2)",
              level: 2,
              children: [
                { id: "h1h2-0.6", name: "0.6", level: 3, children: [] },
                { id: "h1h2-0.4", name: "0.4", level: 3, children: [] },
                { id: "h1h2-0.2", name: "0.2", level: 3, children: [] },
              ],
            },
            {
              id: "groundwater",
              name: "Groundwater table",
              level: 2,
              children: [
                { id: "gw-1m", name: "-1m", level: 3, children: [] },
                { id: "gw-3m", name: "-3m", level: 3, children: [] },
                { id: "gw-5m", name: "-5m", level: 3, children: [] },
              ],
            },
          ],
        },
        {
          id: "relative-density",
          name: "Relative density",
          level: 1,
          children: [
            { id: "density-30", name: "Dr=30%", level: 2, children: [] },
            { id: "density-50", name: "Dr=50%", level: 2, children: [] },
            { id: "density-70", name: "Dr=70%", level: 2, children: [] },
          ],
        },
        {
          id: "inclination",
          name: "Inclination angle of stratum",
          level: 1,
          children: [
            { id: "inclination-1", name: "1 degree", level: 2, children: [] },
            { id: "inclination-3", name: "3 degrees", level: 2, children: [] },
            { id: "inclination-5", name: "5 degrees", level: 2, children: [] },
          ],
        },
      ],
    }

    // Calculate total combinations correctly using the same logic as the checklist generator
    const heights =
      structure.children.find((c) => c.id === "dike-size")?.children?.find((s) => s.id === "height")?.children
        ?.length || 0
    const widths =
      structure.children.find((c) => c.id === "dike-size")?.children?.find((s) => s.id === "width")?.children?.length ||
      0
    const slopeRatios =
      structure.children.find((c) => c.id === "dike-size")?.children?.find((s) => s.id === "slope-ratio")?.children
        ?.length || 0
    const pgas =
      structure.children.find((c) => c.id === "earthquake")?.children?.find((s) => s.id === "pga")?.children?.length ||
      0
    const h1h2Ratios =
      structure.children.find((c) => c.id === "thickness-ratio")?.children?.find((s) => s.id === "h1h2")?.children
        ?.length || 0
    const groundwaters =
      structure.children.find((c) => c.id === "thickness-ratio")?.children?.find((s) => s.id === "groundwater")
        ?.children?.length || 0
    const relativeDensities = structure.children.find((c) => c.id === "relative-density")?.children?.length || 0
    const inclinations = structure.children.find((c) => c.id === "inclination")?.children?.length || 0

    const totalCombinations =
      heights * widths * slopeRatios * pgas * h1h2Ratios * groundwaters * relativeDensities * inclinations

    // Extract categories, subcategories, and values
    const categories = structure.children.map((child) => child.name)

    const subcategories: Record<string, string[]> = {}
    const values: Record<string, string[]> = {}

    structure.children.forEach((category) => {
      if (category.children.length > 0) {
        subcategories[category.name] = category.children.map((sub) => sub.name)

        category.children.forEach((sub) => {
          if (sub.children.length > 0) {
            values[sub.name] = sub.children.map((val) => val.name)
          }
        })
      }
    })

    return {
      structure,
      totalCombinations,
      categories,
      subcategories,
      values,
    }
  }

  // Convert the detected structure to MindMapNode format
  const convertToMindMapNode = (detectedNode: DetectedNode): MindMapNode => {
    return {
      id: detectedNode.id,
      name: detectedNode.name,
      children: detectedNode.children.map((child) => convertToMindMapNode(child)),
    }
  }

  // Apply the detected structure to the mind map
  const applyStructure = () => {
    if (!processingResult) return

    const mindMapData = convertToMindMapNode(processingResult.structure)

    // Add colors to main categories
    if (mindMapData.children) {
      const colors = ["#f87171", "#facc15", "#4ade80", "#3b82f6", "#a855f7", "#ec4899"]
      mindMapData.children.forEach((child, index) => {
        child.color = colors[index % colors.length]
      })
    }

    // Call the callback with the new mind map data
    onImportComplete(mindMapData)

    toast({
      title: "Mind Map Structure Applied",
      description: "The detected structure has been applied to the mind map.",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-medium flex items-center">
            <FileImage className="h-5 w-5 mr-2 text-blue-500" />
            Mind Map Image Import
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Upload an image of your mind map to automatically detect its structure
          </p>
        </div>
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
        <Button onClick={triggerFileInput} disabled={isProcessing} className="group transition-all duration-300">
          <Upload className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
          Select Image
        </Button>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-6 border border-gray-200 dark:border-gray-800 shadow-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-4 flex items-center">
                    <ImageIcon className="h-5 w-5 mr-2 text-blue-500" />
                    Selected Image
                  </h4>
                  <div className="border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900 shadow-inner relative group">
                    {previewUrl && (
                      <div className="relative w-full h-[300px]">
                        <NextImage
                          src={previewUrl || "/placeholder.svg"}
                          alt="Mind Map Preview"
                          fill
                          className="object-contain"
                        />
                        <button
                          onClick={clearSelectedFile}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex justify-between">
                    <p className="text-sm text-gray-500 flex items-center">
                      <FileImage className="h-4 w-4 mr-1 text-blue-500" />
                      {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                    </p>
                    <Button
                      onClick={processImage}
                      disabled={isProcessing}
                      variant={isProcessing ? "outline" : "default"}
                      className="relative overflow-hidden"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <FileUp className="mr-2 h-4 w-4" />
                          Process Image
                        </>
                      )}
                    </Button>
                  </div>

                  {isProcessing && (
                    <div className="mt-4 space-y-2">
                      <Progress value={processingProgress} className="h-2" />
                      <p className="text-sm text-gray-500 flex items-center">
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                        {processingStage}
                      </p>
                    </div>
                  )}
                </div>

                {processingResult && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <h4 className="font-medium mb-4 flex items-center">
                      <Check className="h-5 w-5 mr-2 text-green-500" />
                      Detection Results
                    </h4>
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md flex items-start">
                        <Check className="h-5 w-5 text-green-600 dark:text-green-400 mr-2 mt-0.5" />
                        <div>
                          <p className="font-medium text-green-800 dark:text-green-300">Mind Map Structure Detected</p>
                          <p className="text-sm text-green-700 dark:text-green-400">
                            Total combinations: {processingResult.totalCombinations.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium text-sm mb-2">
                          Main Categories ({processingResult.categories.length})
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {processingResult.categories.map((category, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium text-sm mb-2">Structure Preview</h5>
                        <div className="text-xs border rounded-md p-3 max-h-[200px] overflow-y-auto font-mono bg-gray-50 dark:bg-gray-900 shadow-inner">
                          <pre className="text-gray-700 dark:text-gray-300">
                            {JSON.stringify(processingResult.structure, null, 2)}
                          </pre>
                        </div>
                      </div>

                      <Button onClick={applyStructure} className="w-full group">
                        <Check className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                        Apply Structure to Mind Map
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {!selectedFile && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
              <FileImage className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">Drag &amp; Drop Your Mind Map Image</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Or click the button below to browse your files
            </p>
            <Button onClick={triggerFileInput} className="mx-auto">
              <Upload className="mr-2 h-4 w-4" />
              Browse Files
            </Button>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">Supported formats: JPG, PNG, GIF, BMP</p>
          </div>
        </motion.div>
      )}
    </div>
  )
}
