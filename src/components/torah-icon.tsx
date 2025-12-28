import * as React from "react"
import { cn } from "@/lib/utils"

export const TorahIcon = React.forwardRef<
  SVGSVGElement,
  React.SVGProps<SVGSVGElement>
>(({ className, ...props }, ref) => (
  <svg
    ref={ref}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("lucide lucide-scroll-text", className)}
    {...props}
  >
    <path d="M8 21h12a2 2 0 0 0 2-2v-2h-3" />
    <path d="M4 21a2 2 0 0 1-2-2v-2h3" />
    <path d="M21 17a2 2 0 0 0-2-2h-1" />
    <path d="M3 17a2 2 0 0 1 2-2h1" />
    <path d="M21 15a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2" />
    <path d="M21 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2" />
    <path d="M7 21v-2" />
    <path d="M17 21v-2" />
    <path d="M7 3v2" />
    <path d="M17 3v2" />
    <path d="M9 7h6" />
    <path d="M9 11h6" />
  </svg>
));
TorahIcon.displayName = "TorahIcon";
