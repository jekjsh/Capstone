export default function UserPagination({
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  rowsPerPage,
  totalRecords,
  onPageChange,
  onRowsPerPageChange,
  onFirstPage,
  onLastPage,
  onPreviousPage,
  onNextPage
}) {
  if (totalRecords === 0) return null;

  return (
    <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Data Range Indicator */}
      <div className="text-sm text-gray-600">
        Showing <span className="font-semibold">{startIndex + 1}–{Math.min(endIndex, totalRecords)}</span> of <span className="font-semibold">{totalRecords}</span> records
      </div>

      {/* Rows Per Page Selector */}
      <div className="flex items-center gap-2">
        <label htmlFor="rowsPerPage" className="text-sm font-medium text-gray-700">
          Rows per page:
        </label>
        <select
          id="rowsPerPage"
          value={rowsPerPage}
          onChange={onRowsPerPageChange}
          className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>

      {/* Pagination Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onFirstPage}
          disabled={currentPage === 1}
          className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          title="First page"
        >
          {'<<'}
        </button>
        <button
          onClick={onPreviousPage}
          disabled={currentPage === 1}
          className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          title="Previous page"
        >
          Prev
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .slice(Math.max(0, currentPage - 2), Math.min(totalPages, currentPage + 1))
            .map(pageNum => (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === pageNum
                    ? 'bg-indigo-600 text-white'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            ))}
        </div>

        <button
          onClick={onNextPage}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          title="Next page"
        >
          Next
        </button>
        <button
          onClick={onLastPage}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          title="Last page"
        >
          {'>>'}
        </button>
      </div>
    </div>
  );
}
