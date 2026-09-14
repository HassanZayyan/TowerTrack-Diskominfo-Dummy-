import React from 'react';

interface PaginationProps {
  currentPage: number;
  lastPage: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  lastPage,
  onPageChange,
}) => {
  const pageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (lastPage <= maxPagesToShow) {
      // If we have 5 or fewer pages, show all of them
      for (let i = 1; i <= lastPage; i++) {
        pages.push(i);
      }
    } else {
      // Always include first page, current page, and last page
      pages.push(1);

      // Calculate start and end of the range
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(lastPage - 1, currentPage + 1);

      // Adjust the range if we're at the beginning or end
      if (currentPage <= 2) {
        end = 3;
      } else if (currentPage >= lastPage - 1) {
        start = lastPage - 2;
      }

      // Add ellipsis if needed
      if (start > 2) {
        pages.push('...');
      }

      // Add the range of pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis if needed
      if (end < lastPage - 1) {
        pages.push('...');
      }

      // Add the last page if it's not already included
      if (lastPage > 1) {
        pages.push(lastPage);
      }
    }

    return pages;
  };

  const handlePageClick = (page: number | string) => {
    if (typeof page === 'number') {
      onPageChange(page);
    }
  };

  if (lastPage <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Halaman <span className="font-medium">{currentPage}</span> dari <span className="font-medium">{lastPage}</span>
      </div>

      <nav className="flex items-center space-x-1">
        {/* Previous Button */}
        <button
          onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={`px-3 py-1 rounded-md ${currentPage <= 1
              ? 'text-placeholder cursor-not-allowed'
              : 'text-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Page Numbers */}
        <div className="hidden sm:flex space-x-1">
          {pageNumbers().map((page, index) => (
            <button
              key={index}
              onClick={() => handlePageClick(page)}
              disabled={page === '...'}
              className={`px-3 py-1 rounded-md ${page === currentPage
                  ? 'bg-primary text-primary-foreground'
                  : page === '...'
                    ? 'text-muted-foreground cursor-default'
                    : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
            >
              {page}
            </button>
          ))}
        </div>

        {/* Mobile version shows current/total */}
        <div className="sm:hidden text-sm text-muted-foreground px-2">
          {currentPage} / {lastPage}
        </div>

        {/* Next Button */}
        <button
          onClick={() => currentPage < lastPage && onPageChange(currentPage + 1)}
          disabled={currentPage >= lastPage}
          className={`px-3 py-1 rounded-md ${currentPage >= lastPage
              ? 'text-placeholder cursor-not-allowed'
              : 'text-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </nav>
    </div>
  );
};
