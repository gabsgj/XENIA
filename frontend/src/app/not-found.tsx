export default function NotFound(){
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-2">
        <h2 className="text-3xl font-extrabold">404 – Not Found</h2>
        <p className="text-muted-foreground">The page you requested does not exist.</p>
      </div>
    </div>
  )
}

