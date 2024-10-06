import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, Loader2, X, XCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"

import type { ImageDetails } from "~agent"

import { ScrollArea } from "./ui/scroll-area"

export function ProductiveBrowserExtension() {
  const [mistralApiKey, setMistralApiKey] = useState("")
  const [tavilyApiKey, setTavilyApiKey] = useState("")
  const [userInfo, setUserInfo] = useState("")
  const [customCategories, setCustomCategories] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [categoryTimesData, setCategoryTimesData] = useState<
    { name: string; value: number; color: string }[]
  >([])
  const [isLoading, setIsLoading] = useState(false)
  const [additionalInstructions, setAdditionalInstructions] = useState("")
  const [timeSaved, setTimeSaved] = useState(0)
  const [userSummary, setUserSummary] = useState("")
  const [winsOfTheDay, setWinsOfTheDay] = useState<string[]>([])
  const [historyData, setHistoryData] = useState<ImageDetails[]>([])

  useEffect(() => {
    chrome.storage.local.get(
      [
        "mistralApiKey",
        "tavilyApiKey",
        "userInfo",
        "customCategories",
        "categoryTimes",
        "additionalInstructions",
        "timeSaved",
        "userSummary",
        "winsOfTheDay",
        "historyData"
      ],
      (result) => {
        setMistralApiKey(result.mistralApiKey || "")
        setTavilyApiKey(result.tavilyApiKey || "")
        setUserInfo(result.userInfo || "")
        setCustomCategories(result.customCategories || [])
        setAdditionalInstructions(result.additionalInstructions || "")
        setTimeSaved(result.timeSaved || 0)
        setUserSummary(
          result.userSummary || "No summary yet. Browse something productive!"
        )
        setWinsOfTheDay(result.winsOfTheDay || [])
        setHistoryData(result.historyData || [])
        // Map categoryTimes to the desired format
        const mappedCategoryTimes = Object.entries(
          result.categoryTimes || {}
        ).map(([name, value], index) => ({
          name,
          value: value as number,
          color: `hsl(var(--chart-${(index % 5) + 1}))`
        }))
        console.log(mappedCategoryTimes)
        setCategoryTimesData(mappedCategoryTimes)
      }
    )
  }, [])

  const formatTime = (totalMinutes: number) => {
    console.log(JSON.stringify(totalMinutes, null, 2))
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    if (hours === 0) {
      return `${minutes.toFixed(0)} mins`
    } else {
      return `${hours.toFixed(0)} hours ${minutes.toFixed(0)} mins`
    }
  }

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newTag.trim() !== "") {
      e.preventDefault()
      setCustomCategories((customCategories) => [
        ...customCategories,
        newTag.trim()
      ])
      setNewTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setCustomCategories(customCategories.filter((tag) => tag !== tagToRemove))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission here
    setIsLoading(true)
    console.log("Mistral API Key:", mistralApiKey)
    console.log("Tavily API Key:", tavilyApiKey)
    console.log("User Info:", userInfo)
    console.log("Custom Categories:", customCategories)
    console.log("Additional Instructions:", additionalInstructions)
    // const timeSaved = 0
    chrome.storage.local.set(
      {
        mistralApiKey,
        tavilyApiKey,
        userInfo,
        customCategories,
        categoryTimes: {},
        additionalInstructions
        //  timeSaved
      },
      () => {
        console.log("Settings saved to local storage")
        setTimeout(() => {
          setIsLoading(false)
        }, 1000)
      }
    )
  }

  return (
    <Card className="w-[400px] bg-background shadow-lg">
      <CardHeader className="bg-primary text-primary-foreground">
        <CardTitle className="text-2xl font-bold">ProductiveBrowser</CardTitle>
        <CardDescription className="text-primary-foreground/70">
          Track your browsing habits
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="insights" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="insights" className="p-4 space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Browsing Activity</h3>
              <p className="text-sm text-muted-foreground">{userSummary}</p>
              {winsOfTheDay.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-semibold">Wins of the day:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {winsOfTheDay.map((win, index) => (
                      <li key={index}>{win}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">
                Your Browsing Time Today:{" "}
                {formatTime(
                  categoryTimesData.reduce((acc, item) => acc + item.value, 0)
                )}
              </h3>
              <ChartContainer
                config={{
                  ...Object.fromEntries(
                    categoryTimesData.map((item) => [
                      item.name,
                      { label: item.name, color: item.color }
                    ])
                  )
                }}
                className="h-[200px]">
                {categoryTimesData.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <h3 className="text-lg text-muted-foreground font-bold ">
                      No data yet
                    </h3>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryTimesData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value">
                        {categoryTimesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </ChartContainer>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Time Saved Today</h3>
              <p className="text-3xl font-bold text-primary">
                {formatTime(timeSaved)}
              </p>
              <p className="text-sm text-muted-foreground">
                from unproductive video binging
              </p>
            </div>
          </TabsContent>
          <TabsContent value="history" className="p-4">
            <ScrollArea className="h-[400px] pr-4">
              {historyData.length === 0
                ? "No history yet"
                : historyData.reverse().map((item: ImageDetails, index) => (
                    <Card key={index} className="mb-4 bg-secondary">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2 text-secondary-foreground">
                          {item.productive ? (
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                          )}
                          <span className="truncate">{item.activity}</span>
                        </CardTitle>
                        <CardDescription className="text-secondary-foreground/70">
                          Productivity Score: {item.score}/5
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="text-sm mb-2 text-secondary-foreground">
                          {item.reason}
                        </p>
                        {item.video_title && (
                          <p className="text-xs text-secondary-foreground/70">
                            Video: {item.video_title}{" "}
                            {item.video_duration && `(${item.video_duration})`}
                          </p>
                        )}
                        {item.warningMessage && (
                          <p className="text-xs italic text-yellow-500 mt-2">
                            {item.warningMessage}
                          </p>
                        )}
                        <Badge
                          variant="outline"
                          className="mt-2 text-primary-foreground bg-primary">
                          {item.tag}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
            </ScrollArea>
          </TabsContent>
          <TabsContent value="settings" className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="api-key" className="text-sm font-medium">
                  Mistral API Key
                </label>
                <Input
                  id="api-key"
                  placeholder="Enter your API key"
                  value={mistralApiKey}
                  onChange={(e) => setMistralApiKey(e.target.value)}
                />
              </div>
              {/* <div className="space-y-2">
                <label htmlFor="api-key" className="text-sm font-medium">
                  Tavily API Key
                </label>
                <Input
                  id="api-key"
                  placeholder="Enter your API key"
                  value={tavilyApiKey}
                  onChange={(e) => setTavilyApiKey(e.target.value)}
                />
              </div> */}
              <div className="space-y-2">
                <label htmlFor="user-info" className="text-sm font-medium">
                  User Info
                </label>
                <Textarea
                  id="user-info"
                  placeholder="Mention what's productive for you and your goals or any other useful information, for example: I want to be a software engineer"
                  value={userInfo}
                  onChange={(e) => setUserInfo(e.target.value)}
                  className="min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground">
                  This info helps personalize AI decisions to your activity.
                </p>
              </div>
              <div className="space-y-2">
                <label htmlFor="tags" className="text-sm font-medium">
                  Custom Tags
                </label>
                <Input
                  id="tags"
                  placeholder="Add custom tags to classify your browsing (press Enter)"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={handleAddTag}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {customCategories.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="pl-2 pr-1 py-1 text-sm">
                      {tag}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => handleRemoveTag(tag)}>
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="additional-instructions"
                  className="text-sm font-medium">
                  Additional Instructions
                </label>
                <Textarea
                  id="additional-instructions"
                  placeholder="Provide additional instructions to personalize AI decisions. For example: Call me out when I am browsing amazon, we need to block that page"
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                  className="min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground">
                  This info helps personalize AI decisions to your activity.
                </p>
              </div>
              {isLoading ? (
                <Button disabled className="w-full">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </Button>
              ) : (
                <Button type="submit" className="w-full">
                  Save Settings
                </Button>
              )}
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="bg-muted/50 text-xs text-muted-foreground">
        © 2023 ProductiveBrowser. All rights reserved.
      </CardFooter>
    </Card>
  )
}
