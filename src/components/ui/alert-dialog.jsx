import * as React from "react"

import { cn } from "src/lib/utils"
import { Button } from "src/components/ui/button"

const AlertDialog = ({ open, children }) => {
  if (!open) return null
  return children
}

const AlertDialogContent = React.forwardRef(({ className, ...props }, ref) => (
  <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
    <div
      ref={ref}
      className={cn(
        "w-full max-w-md rounded-2xl border border-ot-border/60 bg-ot-bg-top/95 p-6 text-white shadow-2xl",
        className
      )}
      {...props}
    />
  </div>
))
AlertDialogContent.displayName = "AlertDialogContent"

const AlertDialogHeader = ({ className, ...props }) => (
  <div className={cn("space-y-2", className)} {...props} />
)
AlertDialogHeader.displayName = "AlertDialogHeader"

const AlertDialogFooter = ({ className, ...props }) => (
  <div className={cn("mt-6 flex justify-end gap-3", className)} {...props} />
)
AlertDialogFooter.displayName = "AlertDialogFooter"

const AlertDialogTitle = React.forwardRef(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-lg font-black tracking-tight text-white", className)}
    {...props}
  >
    {children}
  </h3>
))
AlertDialogTitle.displayName = "AlertDialogTitle"

const AlertDialogDescription = React.forwardRef(({ className, children, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm leading-6 text-ot-text-muted", className)}
    {...props}
  >
    {children}
  </p>
))
AlertDialogDescription.displayName = "AlertDialogDescription"

const AlertDialogCancel = React.forwardRef(({ className, ...props }, ref) => (
  <Button
    ref={ref}
    type="button"
    variant="outline"
    className={cn(
      "h-10 rounded-xl border-ot-border bg-transparent px-5 text-xs font-bold uppercase tracking-wider text-ot-text-muted hover:bg-white/5 hover:text-white",
      className
    )}
    {...props}
  />
))
AlertDialogCancel.displayName = "AlertDialogCancel"

const AlertDialogAction = React.forwardRef(({ className, ...props }, ref) => (
  <Button
    ref={ref}
    type="button"
    className={cn("h-10 rounded-xl px-5 text-xs font-bold uppercase tracking-wider text-white", className)}
    {...props}
  />
))
AlertDialogAction.displayName = "AlertDialogAction"

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
}
