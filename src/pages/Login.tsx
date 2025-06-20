"use client"

import type React from "react"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Fuel } from "lucide-react"

const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Demo login - accept any email and password
      if (email && password) {
        localStorage.setItem("authToken", "demo-token")
        localStorage.setItem("userFname", email.split("@")[0])
        localStorage.setItem("isLoggedIn", "true")

        toast({
          title: "Login Successful",
          description: "Welcome to Siphy",
        })

        navigate("/dashboard")
      } else {
        throw new Error("Please enter email and password")
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Simple Diagonal Stripe Background */}
      <div
        className="absolute inset-0"
        style={{
          background: `repeating-linear-gradient(
            -45deg,
            #fbbf24 0px,
            #fbbf24 80px,
            #1f2937 80px,
            #1f2937 160px
          )`,
        }}
      ></div>

      {/* Login Form */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-yellow-400 border-0 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center mb-4">
                                <img src="/si.png" alt="logo" className="h-10 w-70 object-cover" />
            </div>
            {/*<CardTitle className="text-3xl font-bold text-gray-900">Siphy</CardTitle>*/}
            <CardDescription className="text-gray-800 font-medium">
              Sign in to access your vehicle dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-900 font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white border-0 text-gray-900 placeholder:text-gray-500 h-12 rounded-lg shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-900 font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white border-0 text-gray-900 placeholder:text-gray-500 h-12 rounded-lg shadow-sm"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gray-900 hover:bg-gray-800 text-white h-12 rounded-lg font-semibold text-base shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-800 font-medium">Demo credentials: any email and password</p>
              <p className="text-sm text-gray-800 font-medium flex items-center justify-center gap-1">
                Proudly Made in Kenya 🇰🇪
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Login
