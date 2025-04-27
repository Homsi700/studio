import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  // You can add any UI inside Loading, including a Skeleton.
  return (
     <div className="container mx-auto p-4 md:p-8">
       <header className="mb-8 flex items-center justify-between">
         <div>
           <Skeleton className="h-8 w-48 mb-2" />
           <Skeleton className="h-4 w-64" />
         </div>
         <div className="flex items-center space-x-2">
            <Skeleton className="h-10 w-10 rounded-md" />
            <Skeleton className="h-10 w-32 rounded-md" />
            <Skeleton className="h-10 w-10 rounded-md" />
         </div>
       </header>

       <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
         {Array.from({ length: 8 }).map((_, index) => (
           <div key={index} className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 space-y-4">
              <div className="flex justify-between items-start">
                <Skeleton className="h-6 w-3/5" />
                <Skeleton className="h-5 w-1/4" />
              </div>
              <Skeleton className="h-4 w-2/5" />
              <div className="grid grid-cols-2 gap-4 mt-4">
                 <Skeleton className="h-4 w-3/4" />
                 <Skeleton className="h-4 w-3/4" />
                 <Skeleton className="h-4 w-3/4" />
                 <Skeleton className="h-4 w-3/4" />
              </div>
           </div>
         ))}
       </div>
     </div>
  )
}
