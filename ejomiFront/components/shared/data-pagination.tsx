import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

interface DataPaginationProps {
  pagination: PaginationInfo | null
  onPageChange: (page: number) => void
}

export function DataPagination({ pagination, onPageChange }: DataPaginationProps) {
  if (!pagination) {
    return null
  }

  const { page, totalPages, hasNext, hasPrev, total } = pagination

  if (totalPages <= 1) {
    return null
  }

  // Générer les numéros de page à afficher
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (page <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push("...")
        pages.push(totalPages)
      } else if (page >= totalPages - 2) {
        pages.push(1)
        pages.push("...")
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push("...")
        for (let i = page - 1; i <= page + 1; i++) {
          pages.push(i)
        }
        pages.push("...")
        pages.push(totalPages)
      }
    }

    return pages
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4">
      <div className="text-sm text-muted-foreground">
        {total} élément{total > 1 ? "s" : ""} au total
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrev}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Page précédente</span>
        </Button>

        <div className="hidden sm:flex items-center space-x-1">
          {getPageNumbers().map((pageNum, index) =>
            pageNum === "..." ? (
              <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                ...
              </span>
            ) : (
              <Button
                key={pageNum}
                variant={pageNum === page ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNum as number)}
                className="min-w-[40px]"
              >
                {pageNum}
              </Button>
            )
          )}
        </div>

        <div className="sm:hidden text-sm">
          Page {page} / {totalPages}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNext}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Page suivante</span>
        </Button>
      </div>
    </div>
  )
}
