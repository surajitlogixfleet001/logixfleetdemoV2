"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AppSidebar } from "@/components/AppSidebar"
import { useToast } from "@/hooks/use-toast"
import { Phone, Send, Clock, CheckCircle, XCircle, AlertTriangle, Plus, Search, Fuel, ShieldAlert, ImageIcon, FileText, MapPin } from 'lucide-react'

interface WhatsAppNotification {
  id: string
  recipient: string
  message: string
  type: "fuel_theft" | "low_fuel" | "maintenance" | "emergency" | "custom"
  status: "sent" | "delivered" | "read" | "failed" | "pending"
  timestamp: string
  vehicleName?: string
  hasMedia?: boolean
  mediaType?: "image" | "document" | "location"
  cost: number
}

const demoWhatsAppData: WhatsAppNotification[] = [
  {
    id: "wa_001",
    recipient: "+1234567890",
    message:
      "🚨 FUEL THEFT ALERT 🚨\n\nVehicle: KDE366F (GHI-789)\nAmount Stolen: 45L\nTime: 14:32\nLocation: 40.7128,-74.0060\n\nImmediate action required!",
    type: "fuel_theft",
    status: "read",
    timestamp: "2024-01-20T14:35:00Z",
    vehicleName: "KDE366F",
    hasMedia: true,
    mediaType: "location",
    cost: 0.08,
  },
  {
    id: "wa_002",
    recipient: "+1234567891",
    message:
      "⚠️ LOW FUEL WARNING ⚠️\n\nVehicle: KDE386N (DEF-456)\nCurrent Level: 8L\nRange: ~50km\n\nPlease refuel immediately to avoid breakdown.",
    type: "low_fuel",
    status: "delivered",
    timestamp: "2024-01-20T13:22:00Z",
    vehicleName: "KDE386N",
    hasMedia: true,
    mediaType: "image",
    cost: 0.08,
  },
  {
    id: "wa_003",
    recipient: "+1234567892",
    message:
      "🔧 MAINTENANCE REMINDER 🔧\n\nVehicle: KDA381X (JKL-012)\nService Due: In 2 days\nMileage: 48,500 km\n\nPlease schedule service appointment.",
    type: "maintenance",
    status: "sent",
    timestamp: "2024-01-20T12:15:00Z",
    vehicleName: "KDA381X",
    hasMedia: true,
    mediaType: "document",
    cost: 0.08,
  },
  {
    id: "wa_004",
    recipient: "+1234567890",
    message:
      "🚨 EMERGENCY ALERT 🚨\n\nVehicle: KDE386N (ABC-123)\nIssue: Engine temperature critical\nStatus: Vehicle stopped\nDriver: Contacted and safe\n\nTowing service dispatched.",
    type: "emergency",
    status: "read",
    timestamp: "2024-01-20T11:45:00Z",
    vehicleName: "KDE386N",
    hasMedia: true,
    mediaType: "location",
    cost: 0.08,
  },
  {
    id: "wa_005",
    recipient: "+1234567893",
    message:
      "🛡️ SECURITY ALERT 🛡️\n\nMultiple fuel theft incidents detected across fleet today.\n\nTotal stolen: 127L\nVehicles affected: 3\n\nReview security protocols immediately.",
    type: "fuel_theft",
    status: "failed",
    timestamp: "2024-01-20T10:30:00Z",
    cost: 0.08,
  },
  {
    id: "wa_006",
    recipient: "+1234567891",
    message:
      "📊 Daily Fleet Report 📊\n\nAll vehicles operational ✅\nFuel efficiency: 87.3% (+2.1%)\nTotal distance: 1,247 km\nFuel consumed: 234L\n\nDetailed report attached.",
    type: "custom",
    status: "read",
    timestamp: "2024-01-20T09:00:00Z",
    hasMedia: true,
    mediaType: "document",
    cost: 0.08,
  },
  {
    id: "wa_007",
    recipient: "+1234567890",
    message:
      "⛽ FUEL LEVEL UPDATE ⛽\n\nVehicle: KDE366F (MNO-345)\nCurrent Level: 12L\nRecommended Action: Refuel within 2 hours\nNearest Station: 2.3km away",
    type: "low_fuel",
    status: "pending",
    timestamp: "2024-01-20T08:45:00Z",
    vehicleName: "KDE366F",
    cost: 0.08,
  },
]

const WhatsAppNotifications = () => {
  const [notifications, setNotifications] = useState<WhatsAppNotification[]>(demoWhatsAppData)
  const [filteredNotifications, setFilteredNotifications] = useState<WhatsAppNotification[]>(demoWhatsAppData)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false)
  const [newMessage, setNewMessage] = useState({
    recipient: "",
    message: "",
    type: "custom" as const,
    hasMedia: false,
    mediaType: "image" as const,
  })

  const { toast } = useToast()

  // Filter notifications
  useEffect(() => {
    let filtered = notifications

    if (searchTerm) {
      filtered = filtered.filter(
        (notification) =>
          notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
          notification.recipient.includes(searchTerm) ||
          notification.vehicleName?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((notification) => notification.status === statusFilter)
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((notification) => notification.type === typeFilter)
    }

    setFilteredNotifications(filtered)
  }, [notifications, searchTerm, statusFilter, typeFilter])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "read":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Read
          </Badge>
        )
      case "delivered":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Delivered
          </Badge>
        )
      case "sent":
        return (
          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
            <Clock className="h-3 w-3 mr-1" />
            Sent
          </Badge>
        )
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "fuel_theft":
        return <ShieldAlert className="h-4 w-4 text-red-500" />
      case "low_fuel":
        return <Fuel className="h-4 w-4 text-orange-500" />
      case "maintenance":
        return <AlertTriangle className="h-4 w-4 text-blue-500" />
      case "emergency":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Phone className="h-4 w-4 text-green-500" />
    }
  }

  const getMediaIcon = (mediaType?: string) => {
    switch (mediaType) {
      case "image":
        return <ImageIcon className="h-3 w-3 text-blue-500" />
      case "document":
        return <FileText className="h-3 w-3 text-green-500" />
      case "location":
        return <MapPin className="h-3 w-3 text-red-500" />
      default:
        return null
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "fuel_theft":
        return "Fuel Theft"
      case "low_fuel":
        return "Low Fuel"
      case "maintenance":
        return "Maintenance"
      case "emergency":
        return "Emergency"
      default:
        return "Custom"
    }
  }

  const handleSendMessage = () => {
    if (!newMessage.recipient || !newMessage.message) return

    const message: WhatsAppNotification = {
      id: `wa_${Date.now()}`,
      recipient: newMessage.recipient,
      message: newMessage.message,
      type: newMessage.type,
      status: "pending",
      timestamp: new Date().toISOString(),
      vehicleName: newMessage.vehicleName,
      hasMedia: newMessage.hasMedia,
      mediaType: newMessage.hasMedia ? newMessage.mediaType : undefined,
      cost: 0.08,
    }

    setNotifications([message, ...notifications])
    setNewMessage({ recipient: "", message: "", type: "custom", hasMedia: false, mediaType: "image", vehicleName: "" })
    setIsNewMessageOpen(false)

    toast({
      title: "Message sent!",
      description: "Your message has been added to the queue.",
    })

    // Simulate delivery after 2 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.map((n) => (n.id === message.id ? { ...n, status: "delivered" as const } : n)))
      toast({
        title: "Message delivered!",
        description: `Message to ${message.recipient} has been delivered.`,
      })
    }, 2000)

    // Simulate read after 5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.map((n) => (n.id === message.id ? { ...n, status: "read" as const } : n)))
      toast({
        title: "Message read!",
        description: `Message to ${message.recipient} has been read.`,
      })
    }, 5000)
  }

  const totalCost = notifications.reduce((sum, notification) => sum + notification.cost, 0)
  const readCount = notifications.filter((n) => n.status === "read").length
  const deliveredCount = notifications.filter((n) => n.status === "delivered").length

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
            <div className="container mx-auto space-y-6">
              {/* Header */}
              <div className="flex items-center gap-4 mb-8">
                <SidebarTrigger />
                <div className="flex-1">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
                    WhatsApp Notifications
                  </h1>
                  <p className="text-muted-foreground mt-2">Manage and monitor WhatsApp alerts for your fleet</p>
                </div>
                <Dialog open={isNewMessageOpen} onOpenChange={setIsNewMessageOpen}>
                  {/*<DialogTrigger asChild>
                    <Button className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4" />
                      Send WhatsApp
                    </Button>
                  </DialogTrigger>*/}
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Send New WhatsApp Message</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Recipient Phone Number</label>
                        <Input
                          placeholder="+1234567890"
                          value={newMessage.recipient}
                          onChange={(e) => setNewMessage({ ...newMessage, recipient: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Vehicle Name</label>
                        <Input
                          placeholder="Enter vehicle name..."
                          value={newMessage.vehicleName}
                          onChange={(e) => setNewMessage({ ...newMessage, vehicleName: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Message Type</label>
                        <Select
                          value={newMessage.type}
                          onValueChange={(value: any) => setNewMessage({ ...newMessage, type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="custom">Custom</SelectItem>
                            <SelectItem value="fuel_theft">Fuel Theft</SelectItem>
                            <SelectItem value="low_fuel">Low Fuel</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="emergency">Emergency</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Message</label>
                        <Textarea
                          placeholder="Enter your message..."
                          value={newMessage.message}
                          onChange={(e) => setNewMessage({ ...newMessage, message: e.target.value })}
                          rows={4}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="hasMedia"
                          checked={newMessage.hasMedia}
                          onChange={(e) => setNewMessage({ ...newMessage, hasMedia: e.target.checked })}
                        />
                        <label htmlFor="hasMedia" className="text-sm font-medium">
                          Include Media
                        </label>
                      </div>
                      {newMessage.hasMedia && (
                        <div>
                          <label className="text-sm font-medium">Media Type</label>
                          <Select
                            value={newMessage.mediaType}
                            onValueChange={(value: any) => setNewMessage({ ...newMessage, mediaType: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="image">Image</SelectItem>
                              <SelectItem value="document">Document</SelectItem>
                              <SelectItem value="location">Location</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <Button onClick={handleSendMessage} className="w-full bg-green-600 hover:bg-green-700">
                        <Send className="h-4 w-4 mr-2" />
                        Send WhatsApp Message
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                    <Phone className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{notifications.length}</div>
                    <p className="text-xs text-muted-foreground">All time</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Read Messages</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{readCount}</div>
                    <p className="text-xs text-muted-foreground">
                      {((readCount / notifications.length) * 100).toFixed(1)}% read rate
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Delivered Messages</CardTitle>
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{deliveredCount}</div>
                    <p className="text-xs text-muted-foreground">Awaiting read</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">$0.08 per message</p>
                  </CardContent>
                </Card>
              </div>

              {/* Messages List */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent WhatsApp Messages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredNotifications.map((notification) => (
                      <div key={notification.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getTypeIcon(notification.type)}
                            <div>
                              <div className="font-medium">{notification.recipient}</div>
                              <div className="text-sm text-muted-foreground">{notification.vehicleName}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(notification.status)}
                            <span className="text-xs text-muted-foreground">
                              {new Date(notification.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="bg-green-50 border-l-4 border-green-400 rounded p-3">
                          <p className="text-sm whitespace-pre-wrap font-mono">{notification.message}</p>
                        </div>
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>Cost: ${notification.cost.toFixed(2)}</span>
                          <span>Type: {notification.type.replace("_", " ").toUpperCase()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

export default WhatsAppNotifications
