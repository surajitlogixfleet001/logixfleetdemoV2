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
import {
  MessageSquare,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Search,
  Phone,
  Fuel,
  ShieldAlert,
} from "lucide-react"

interface SMSNotification {
  id: string
  recipient: string
  message: string
  type: "fuel_theft" | "low_fuel" | "maintenance" | "emergency" | "custom"
  status: "sent" | "delivered" | "failed" | "pending"
  timestamp: string
  vehicleId?: string
  vehicleName?: string
  cost: number
}

const demoSMSData: SMSNotification[] = [
  {
    id: "sms_001",
    recipient: "+1234567890",
    message: "ALERT: Fuel theft detected on KDE366F (GHI-789). 45L stolen at 14:32. Location: 40.7128,-74.0060",
    type: "fuel_theft",
    status: "delivered",
    timestamp: "2024-01-20T14:35:00Z",
    vehicleId: "003",
    vehicleName: "KDE366F",
    cost: 0.05,
  },
  {
    id: "sms_002",
    recipient: "+1234567891",
    message: "WARNING: KDE386N (DEF-456) fuel level critically low: 8L remaining. Immediate refuel required.",
    type: "low_fuel",
    status: "delivered",
    timestamp: "2024-01-20T13:22:00Z",
    vehicleId: "002",
    vehicleName: "KDE386N",
    cost: 0.05,
  },
  {
    id: "sms_003",
    recipient: "+1234567892",
    message: "MAINTENANCE: KDA381X (JKL-012) scheduled maintenance due in 2 days. Book service appointment.",
    type: "maintenance",
    status: "sent",
    timestamp: "2024-01-20T12:15:00Z",
    vehicleId: "004",
    vehicleName: "KDA381X",
    cost: 0.05,
  },
  {
    id: "sms_004",
    recipient: "+1234567890",
    message: "EMERGENCY: KDA381X (ABC-123) engine temperature critical. Vehicle stopped. Driver contacted.",
    type: "emergency",
    status: "delivered",
    timestamp: "2024-01-20T11:45:00Z",
    vehicleId: "001",
    vehicleName: "KDA381X",
    cost: 0.05,
  },
  {
    id: "sms_005",
    recipient: "+1234567893",
    message: "THEFT ALERT: Multiple fuel theft incidents detected across fleet. Review security protocols immediately.",
    type: "fuel_theft",
    status: "failed",
    timestamp: "2024-01-20T10:30:00Z",
    cost: 0.05,
  },
  {
    id: "sms_006",
    recipient: "+1234567891",
    message: "Fleet update: All vehicles operational. Daily fuel efficiency report attached to email.",
    type: "custom",
    status: "delivered",
    timestamp: "2024-01-20T09:00:00Z",
    cost: 0.05,
  },
  {
    id: "sms_007",
    recipient: "+1234567890",
    message: "LOW FUEL: KDE386N (MNO-345) fuel level: 12L. Refuel recommended within 2 hours.",
    type: "low_fuel",
    status: "pending",
    timestamp: "2024-01-20T08:45:00Z",
    vehicleId: "005",
    vehicleName: "KDE386N",
    cost: 0.05,
  },
]

const SMSNotifications = () => {
  const [notifications, setNotifications] = useState<SMSNotification[]>(demoSMSData)
  const [filteredNotifications, setFilteredNotifications] = useState<SMSNotification[]>(demoSMSData)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [isNewSMSOpen, setIsNewSMSOpen] = useState(false)
  const [newSMS, setNewSMS] = useState({
    recipient: "",
    message: "",
    type: "custom" as const,
  })

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
      case "delivered":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Delivered
          </Badge>
        )
      case "sent":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
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
        return <MessageSquare className="h-4 w-4 text-gray-500" />
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

  const handleSendSMS = () => {
    if (!newSMS.recipient || !newSMS.message) return

    const sms: SMSNotification = {
      id: `sms_${Date.now()}`,
      recipient: newSMS.recipient,
      message: newSMS.message,
      type: newSMS.type,
      status: "pending",
      timestamp: new Date().toISOString(),
      cost: 0.05,
    }

    setNotifications([sms, ...notifications])
    setNewSMS({ recipient: "", message: "", type: "custom" })
    setIsNewSMSOpen(false)

    // Simulate delivery after 2 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.map((n) => (n.id === sms.id ? { ...n, status: "delivered" as const } : n)))
    }, 2000)
  }

  const totalCost = notifications.reduce((sum, notification) => sum + notification.cost, 0)
  const deliveredCount = notifications.filter((n) => n.status === "delivered").length
  const failedCount = notifications.filter((n) => n.status === "failed").length

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
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    SMS Notifications
                  </h1>
                  <p className="text-muted-foreground mt-2">Manage and monitor SMS alerts for your fleet</p>
                </div>
                <Dialog open={isNewSMSOpen} onOpenChange={setIsNewSMSOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Send SMS
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Send New SMS</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Recipient Phone Number</label>
                        <Input
                          placeholder="+1234567890"
                          value={newSMS.recipient}
                          onChange={(e) => setNewSMS({ ...newSMS, recipient: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Message Type</label>
                        <Select
                          value={newSMS.type}
                          onValueChange={(value: any) => setNewSMS({ ...newSMS, type: value })}
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
                          value={newSMS.message}
                          onChange={(e) => setNewSMS({ ...newSMS, message: e.target.value })}
                          rows={4}
                        />
                      </div>
                      <Button onClick={handleSendSMS} className="w-full">
                        <Send className="h-4 w-4 mr-2" />
                        Send SMS
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total SMS Sent</CardTitle>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{notifications.length}</div>
                    <p className="text-xs text-muted-foreground">All time</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Delivered</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{deliveredCount}</div>
                    <p className="text-xs text-muted-foreground">
                      {((deliveredCount / notifications.length) * 100).toFixed(1)}% success rate
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Failed</CardTitle>
                    <XCircle className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{failedCount}</div>
                    <p className="text-xs text-muted-foreground">Requires attention</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">$0.05 per SMS</p>
                  </CardContent>
                </Card>
              </div>

              {/* Filters and Search */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <CardTitle>SMS History ({filteredNotifications.length} messages)</CardTitle>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="Search messages..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-full sm:w-64"
                        />
                      </div>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-32">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-full sm:w-32">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="fuel_theft">Fuel Theft</SelectItem>
                          <SelectItem value="low_fuel">Low Fuel</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="emergency">Emergency</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Recipient</TableHead>
                          <TableHead>Message</TableHead>
                          <TableHead>Vehicle</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Timestamp</TableHead>
                          <TableHead>Cost</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredNotifications.map((notification) => (
                          <TableRow key={notification.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getTypeIcon(notification.type)}
                                <span className="text-sm font-medium">{getTypeLabel(notification.type)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">{notification.recipient}</TableCell>
                            <TableCell>
                              <div className="max-w-md">
                                <p className="text-sm truncate" title={notification.message}>
                                  {notification.message}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {notification.vehicleName ? (
                                <div className="text-sm">
                                  <div className="font-medium">{notification.vehicleName}</div>
                                  <div className="text-muted-foreground">ID: {notification.vehicleId}</div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>{getStatusBadge(notification.status)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(notification.timestamp).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-sm font-mono">${notification.cost.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

export default SMSNotifications
