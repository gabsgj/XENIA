'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search, Home, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NotFound(){
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Page Not Found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-center">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          
          <div className="flex gap-2">
            <Button onClick={() => window.history.back()} variant="outline" className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Link href="/" className="flex-1">
              <Button className="w-full">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

