'use client'

import { MainLayout } from '@/components/navigation'
import { ErrorBoundaryTest } from '@/components/test/ErrorBoundaryTest'

export default function TestErrorBoundariesPage() {
  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Error Boundary Testing</h1>
          <p className="text-muted-foreground mt-2">
            Test the error boundaries implemented across the application to ensure they provide appropriate fallback UIs.
          </p>
        </div>
        
        <ErrorBoundaryTest />
      </div>
    </MainLayout>
  )
}