'use client';

import { MindMap } from "@/components/mind-map"
import { ChecklistGenerator } from "@/components/checklist-generator"
import { DataCollectionForm } from "@/components/data-collection-form"
import { AdvancedAnalytics } from "@/components/advanced-analytics"
import { useState } from 'react'
import { Tabs, TabsContent, TabsTrigger, TabsList } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, BarChart2, CheckSquare, Database, Network, ArrowLeft } from "lucide-react"
import { DCALogo } from "@/components/dca-logo"

export default function Home() {
  const phases = ['mindmap', 'checklist', 'data-collection', 'advanced-analytics'];
  const [activeTab, setActiveTab] = useState<string>(phases[0]);
  const [furthestPhaseIndex, setFurthestPhaseIndex] = useState<number>(0);

  const handleNextPhase = () => {
    const currentIndex = phases.indexOf(activeTab);
    if (currentIndex < phases.length - 1) {
      const nextPhase = phases[currentIndex + 1];
      setActiveTab(nextPhase);
      setFurthestPhaseIndex(Math.max(furthestPhaseIndex, currentIndex + 1));
    }
  };

  const handlePreviousPhase = () => {
    const currentIndex = phases.indexOf(activeTab);
    if (currentIndex > 0) {
      const previousPhase = phases[currentIndex - 1];
      setActiveTab(previousPhase);
    }
  };

  const handleTabChange = (value: string) => {
    console.log('Tab changed to:', value);
    setActiveTab(value);
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800">
      <header className="bg-background text-foreground shadow-md border-b border-border sticky top-0 z-10">
        <div className="container mx-auto py-6 px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center">
              <DCALogo size="lg" />
              <div className="ml-4">
                <p className="max-w-2xl">
                  AI-Powered tool for dike settlement analysis, data organization, and 3D visualization
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm">Ready to analyze</span>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4 pb-20 md:pb-8"> {/* Added padding-bottom for bottom nav */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="mb-8 overflow-x-auto pb-2">
            <TabsList className="grid min-w-max w-full grid-cols-4 p-1 bg-muted text-muted-foreground rounded-xl">
              <TabsTrigger
                value="mindmap"
                className="flex items-center justify-center gap-2 py-3 rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-200"
                             >
                <Network className="h-5 w-5" />
                <span>Mind Map</span>
              </TabsTrigger>
              <TabsTrigger
                value="checklist"
                className="flex items-center justify-center gap-2 py-3 rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-200"
                             >
                <CheckSquare className="h-5 w-5" />
                <span>Generated Checklist</span>
              </TabsTrigger>
              <TabsTrigger
                value="data-collection"
                className="flex items-center justify-center gap-2 py-3 rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-200"
                             >
                <Database className="h-5 w-5" />
                <span>Data Collection</span>
              </TabsTrigger>
              <TabsTrigger
                value="advanced-analytics"
                className="flex items-center justify-center gap-2 py-3 rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-200"
                             >
                <BarChart2 className="h-5 w-5" />
                <span>Advanced Analytics</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="grid grid-cols-1 gap-8">
            <TabsContent value="mindmap" className="w-full mt-0 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="md:col-span-3 overflow-hidden border-none shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                    <CardTitle className="flex items-center text-2xl">
                      <Network className="h-6 w-6 mr-2" />
                      Dike Settlement Factors
                    </CardTitle>
                    <CardDescription className="text-blue-100">
                      Visualize the dike settlement factors to generate comprehensive checklists
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <MindMap />
                    <div className="mt-6 flex justify-between">
                      <Button onClick={handlePreviousPhase} disabled={phases.indexOf(activeTab) <= 0}>
                        Previous Phase <ArrowLeft className="mr-2 h-4 w-4" />
                      </Button>
                      <Button onClick={handleNextPhase} disabled={phases.indexOf(activeTab) >= phases.length -1}>
                        Next Phase <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="checklist" className="mt-0">
              <Card className="overflow-hidden border-none shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                  <CardTitle className="flex items-center text-2xl">
                    <CheckSquare className="h-6 w-6 mr-2" />
                    Automated Checklist
                  </CardTitle>
                  <CardDescription className="text-green-100">
                    All possible combinations based on dike settlement factors
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <ChecklistGenerator />
                  <div className="mt-6 flex justify-between">
                    <Button onClick={handlePreviousPhase} disabled={phases.indexOf(activeTab) <= 0}>
                      Previous Phase <ArrowLeft className="mr-2 h-4 w-4" />
                    </Button>
                    <Button onClick={handleNextPhase} disabled={phases.indexOf(activeTab) >= phases.length -1}>
                      Next Phase <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="data-collection" className="mt-0">
              <Card className="overflow-hidden border-none shadow-lg">
                <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
                  <CardTitle className="flex items-center text-2xl">
                    <Database className="h-6 w-6 mr-2" />
                    Data Collection Interface
                  </CardTitle>
                  <CardDescription className="text-amber-100">
                    Input numerical data for each checklist item
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <DataCollectionForm />
                  <div className="mt-6 flex justify-between">
                    <Button onClick={handlePreviousPhase} disabled={phases.indexOf(activeTab) <= 0}>
                      Previous Phase <ArrowLeft className="mr-2 h-4 w-4" />
                    </Button>
                    <Button onClick={handleNextPhase} disabled={phases.indexOf(activeTab) >= phases.length -1}>
                      Next Phase <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advanced-analytics" className="mt-0">
              <Card className="overflow-hidden border-none shadow-lg">
                <CardHeader className="bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white">
                  <CardTitle className="flex items-center text-2xl">
                    <BarChart2 className="h-6 w-6 mr-2" />
                    Advanced Analytics
                  </CardTitle>
                  <CardDescription className="text-purple-100">
                    Interactive 3D visualizations and statistical analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <AdvancedAnalytics />
                  <div className="mt-6 flex justify-between">
                    <Button onClick={handlePreviousPhase} disabled={phases.indexOf(activeTab) <= 0}>
                      Previous Phase <ArrowLeft className="mr-2 h-4 w-4" />
                    </Button>
                    <Button onClick={handleNextPhase}>
                      Finish Analysis
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-none shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <Network className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <ArrowRight className="h-5 w-5 text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-lg font-medium mt-4 text-blue-800 dark:text-blue-200">Mind Map</h3>
              <p className="text-sm text-blue-600 dark:text-blue-300 mt-2">
                Create and visualize dike settlement factors
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-none shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <CheckSquare className="h-8 w-8 text-green-600 dark:text-green-400" />
                <ArrowRight className="h-5 w-5 text-green-600 dark:text-green-400 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-lg font-medium mt-4 text-green-800 dark:text-green-200">Checklist</h3>
              <p className="text-sm text-green-600 dark:text-green-300 mt-2">
                Generate and manage comprehensive checklists
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-none shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <Database className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                <ArrowRight className="h-5 w-5 text-amber-600 dark:text-amber-400 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-lg font-medium mt-4 text-amber-800 dark:text-amber-200">Data Collection</h3>
              <p className="text-sm text-amber-600 dark:text-amber-300 mt-2">Collect and organize settlement data</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-none shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <BarChart2 className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                <ArrowRight className="h-5 w-5 text-purple-600 dark:text-purple-400 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-lg font-medium mt-4 text-purple-800 dark:text-purple-200">Analytics</h3>
              <p className="text-sm text-purple-600 dark:text-purple-300 mt-2">Visualize and analyze settlement data</p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 bg-background border-t border-border p-2 md:hidden">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-4 gap-1 bg-muted text-muted-foreground rounded-lg p-1">
            <TabsTrigger value="mindmap" className={`flex flex-col items-center justify-center p-2 rounded-md text-xs ${activeTab === 'mindmap' ? 'bg-primary text-primary-foreground' : 'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground'}`}>
              <Network className="h-5 w-5 mb-1" />
              <span>Mind Map</span>
            </TabsTrigger>
            <TabsTrigger value="checklist" className={`flex flex-col items-center justify-center p-2 rounded-md text-xs ${activeTab === 'checklist' ? 'bg-primary text-primary-foreground' : 'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground'}`}>
              <CheckSquare className="h-5 w-5 mb-1" />
              <span>Checklist</span>
            </TabsTrigger>
            <TabsTrigger value="data-collection" className={`flex flex-col items-center justify-center p-2 rounded-md text-xs ${activeTab === 'data-collection' ? 'bg-primary text-primary-foreground' : 'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground'}`}>
              <Database className="h-5 w-5 mb-1" />
              <span>Data Collection</span>
            </TabsTrigger>
            <TabsTrigger value="advanced-analytics" className={`flex flex-col items-center justify-center p-2 rounded-md text-xs ${activeTab === 'advanced-analytics' ? 'bg-primary text-primary-foreground' : 'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground'}`}>
              <BarChart2 className="h-5 w-5 mb-1" />
              <span>Advanced Analytics</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </nav>

      <footer className="bg-background border-t border-border py-6 mt-12 md:mb-0 mb-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center">
              <DCALogo size="sm" />
              <span className="ml-2 font-semibold text-foreground">Dike Checklist Analyzer</span>
            </div>
            <div className="mt-4 md:mt-0">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} DCA - All rights reserved
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
