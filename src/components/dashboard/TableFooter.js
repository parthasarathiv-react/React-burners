import { LayoutList } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '../ui/pagination';
import { useMemo } from 'react';

const DEFAULT_PAGE_SIZES = [
  { label: 'Show 5', value: '5' },
  { label: 'Show 10', value: '10' },
  { label: 'Show 25', value: '25' },
  { label: 'Show 50', value: '50' },
];

function TableFooter({ totalRows, currentPage, setCurrentPage, pageSize, setPageSize, itemLabel = 'Master Studies' }) {
  const dynamicPageSizes = useMemo(() => {
    const existing = DEFAULT_PAGE_SIZES.map(s => s.value);
    if (!existing.includes(pageSize)) {
      return [...DEFAULT_PAGE_SIZES, { label: `Show ${pageSize}`, value: pageSize }].sort((a, b) => parseInt(a.value) - parseInt(b.value));
    }
    return DEFAULT_PAGE_SIZES;
  }, [pageSize]);

  const totalPages = Math.ceil(totalRows / parseInt(pageSize, 10)) || 1;

  const visiblePages = useMemo(() => {
    if (totalPages <= 4) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 'ellipsis-end'];
    }

    if (currentPage >= totalPages - 2) {
      return ['ellipsis-start', totalPages - 2, totalPages - 1, totalPages];
    }

    return ['ellipsis-start', currentPage - 1, currentPage, currentPage + 1, 'ellipsis-end'];
  }, [currentPage, totalPages]);

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePageSizeChange = (val) => {
    setPageSize(val);
    setCurrentPage(1);
  };

  const startIdx = totalRows === 0 ? 0 : (currentPage - 1) * parseInt(pageSize, 10) + 1;
  const endIdx = Math.min(currentPage * parseInt(pageSize, 10), totalRows);

  return (
    <div className="h-16 border-t border-ot-border/30 bg-black/20 px-6 flex items-center justify-between backdrop-blur-md relative overflow-visible z-[500] w-full">
      <div className="flex items-center gap-4 relative">
        <div className="flex items-center gap-2 text-ot-text-muted">
          <LayoutList size={14} />
          <span className="text-[10px] font-bold uppercase tracking-widest leading-none hidden sm:inline-block">Entries per page</span>
        </div>
        <div className="relative z-[600]">
          <Select
            value={pageSize}
            onValueChange={handlePageSizeChange}
          >
            <SelectTrigger className="w-32 bg-ot-bg-top/50 border border-ot-border/50 text-white rounded-xl py-2 px-4 text-[10px] sm:text-xs font-bold uppercase tracking-widest min-h-[44px] transition-all hover:border-ot-action-top/50 shadow-inner data-[state=open]:border-ot-action-top data-[state=open]:ring-2 data-[state=open]:ring-ot-action-top/10">
              <SelectValue placeholder="Entries" />
            </SelectTrigger>
            <SelectContent side="top" className="bg-ot-bg-mid border border-ot-border/50 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[9999] backdrop-blur-2xl text-white">
              {dynamicPageSizes.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="w-full px-4 py-2 text-[10px] uppercase tracking-widest cursor-pointer focus:bg-ot-action-top/10 focus:text-white"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-6">
        <span className="text-[10px] font-bold text-ot-text-muted/60 uppercase tracking-widest hidden sm:inline-block">
          Displaying {startIdx} to {endIdx} of {totalRows} {itemLabel}
        </span>
        <Pagination className="mx-0 w-auto">
          <PaginationContent className="gap-1 sm:gap-2">
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => { e.preventDefault(); handlePrev(); }}
                className={`h-9 gap-2 border-0 bg-transparent px-1.5 text-xs font-bold text-white shadow-none hover:bg-transparent hover:text-white/75 sm:px-2 [&_svg]:h-4 [&_svg]:w-4 ${currentPage === 1 ? 'opacity-40 pointer-events-none' : ''}`}
              />
            </PaginationItem>
            {visiblePages.map((page) => (
              typeof page === 'number' ? (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    isActive={page === currentPage}
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(page);
                    }}
                    className={`h-9 w-9 rounded-xl border text-sm font-bold shadow-none ${
                      page === currentPage
                        ? 'border-white/20 bg-white/[0.06] text-white hover:bg-white/[0.08] hover:text-white'
                        : 'border-transparent bg-transparent text-white hover:bg-transparent hover:text-white/75'
                    }`}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ) : (
                <PaginationItem key={page}>
                  <PaginationEllipsis className="h-9 w-9 text-white [&_svg]:h-4 [&_svg]:w-4" />
                </PaginationItem>
              )
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => { e.preventDefault(); handleNext(); }}
                className={`h-9 gap-2 border-0 bg-transparent px-1.5 text-xs font-bold text-white shadow-none hover:bg-transparent hover:text-white/75 sm:px-2 [&_svg]:h-4 [&_svg]:w-4 ${currentPage === totalPages ? 'opacity-40 pointer-events-none' : ''}`}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}

export default TableFooter;
