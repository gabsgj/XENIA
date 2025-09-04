"use client";

import { AlertCircle, CheckCircle, Info, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="w-12 h-12 text-destructive" />
          </div>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>
            An unexpected error occurred while loading this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-mono text-muted-foreground">
              {error.message || "Unknown error"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={reset} 
              className="flex-1"
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button 
              onClick={() => window.location.href = "/dashboard"} 
              className="flex-1"
            >
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface NotificationProps {
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function Notification({ type, title, message, onClose, action }: NotificationProps) {
  const typeConfig = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      iconColor: 'text-green-600',
      textColor: 'text-green-800 dark:text-green-200'
    },
    error: {
      icon: AlertCircle,
      bgColor: 'bg-red-50 dark:bg-red-900/20', 
      borderColor: 'border-red-200 dark:border-red-800',
      iconColor: 'text-red-600',
      textColor: 'text-red-800 dark:text-red-200'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800', 
      iconColor: 'text-blue-600',
      textColor: 'text-blue-800 dark:text-blue-200'
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      iconColor: 'text-yellow-600', 
      textColor: 'text-yellow-800 dark:text-yellow-200'
    }
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className={`fixed top-4 right-4 z-50 w-96 rounded-lg border p-4 shadow-lg ${config.bgColor} ${config.borderColor}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} />
        <div className="flex-1">
          <h4 className={`font-medium ${config.textColor}`}>{title}</h4>
          {message && (
            <p className={`text-sm mt-1 ${config.textColor}`}>{message}</p>
          )}
          {action && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={action.onClick}
              className="mt-2"
            >
              {action.label}
            </Button>
          )}
        </div>
        {onClose && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            ×
          </Button>
        )}
      </div>
    </div>
  );
}

export function GlobalErrorFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <AlertCircle className="w-16 h-16 text-destructive" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Application Error</h1>
          <p className="text-muted-foreground mt-2">
            The application encountered an unexpected error. Please refresh the page or contact support if the problem persists.
          </p>
        </div>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Page
          </Button>
          <Button variant="outline" onClick={() => window.location.href = "/"}>
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}