
import { Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface InfoTooltipProps {
  content: string
  className?: string
}

export const InfoTooltip = ({ content, className = "" }: InfoTooltipProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className={`h-4 w-4 text-muted-foreground hover:text-foreground cursor-help transition-colors ${className}`} />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-sm">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
