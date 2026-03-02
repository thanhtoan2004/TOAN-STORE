'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  const getVisiblePages = () => {
    const visiblePages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      visiblePages.push(i);
    }

    return visiblePages;
  };

  return (
    <div className="flex items-center justify-center mt-12">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`flex items-center px-3 py-1 rounded-md mr-2 ${
          currentPage === 1
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-black hover:bg-gray-100'
        }`}
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Trước
      </button>

      <div className="flex">
        {getVisiblePages().map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`mx-1 w-8 h-8 rounded-md ${
              currentPage === page
                ? 'bg-black text-white'
                : 'hover:bg-gray-100'
            }`}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`flex items-center px-3 py-1 rounded-md ml-2 ${
          currentPage === totalPages
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-black hover:bg-gray-100'
        }`}
      >
        Sau
        <ChevronRight className="w-4 h-4 ml-1" />
      </button>
    </div>
  );
};

export default Pagination;
