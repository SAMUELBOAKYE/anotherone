import { useState, useMemo, useCallback, useEffect, useRef } from 'react';

/**
 * Custom hook for managing pagination state and logic.
 * 
 * @param {number} totalItems - Total number of items to paginate
 * @param {Object} options - Configuration options
 * @param {number} [options.itemsPerPage=10] - Number of items per page
 * @param {number} [options.initialPage=1] - Initial page number
 * @param {number} [options.maxPagesToShow=5] - Maximum number of page buttons to show
 * @param {boolean} [options.autoResetPage=true] - Reset to page 1 when totalItems or itemsPerPage changes
 * @param {boolean} [options.showEllipsis=true] - Show ellipsis when page numbers are truncated
 * @param {Function} [options.onPageChange] - Callback when page changes
 * @param {boolean} [options.debug=false] - Enable debug logging
 * @returns {Object} Pagination controls and state
 */
export const usePagination = (totalItems, options = {}) => {
  const {
    itemsPerPage: initialItemsPerPage = 10,
    initialPage = 1,
    maxPagesToShow = 5,
    autoResetPage = true,
    showEllipsis = true,
    onPageChange,
    debug = false
  } = options;

  const debugRef = useRef(debug);
  useEffect(() => {
    debugRef.current = debug;
  }, [debug]);

  const log = useCallback((...args) => {
    if (debugRef.current && process.env.NODE_ENV === 'development') {
      console.log('[usePagination]', ...args);
    }
  }, []);

  // Validate inputs
  const validatedTotalItems = useMemo(() => {
    if (typeof totalItems !== 'number' || totalItems < 0 || isNaN(totalItems)) {
      console.warn('[usePagination] Invalid totalItems value. Using 0.');
      return 0;
    }
    return totalItems;
  }, [totalItems]);

  const validatedItemsPerPage = useMemo(() => {
    if (typeof initialItemsPerPage !== 'number' || initialItemsPerPage <= 0 || isNaN(initialItemsPerPage)) {
      console.warn('[usePagination] Invalid itemsPerPage value. Using 10.');
      return 10;
    }
    return initialItemsPerPage;
  }, [initialItemsPerPage]);

  const [currentPage, setCurrentPage] = useState(() => {
    const validInitialPage = Math.max(1, Math.min(initialPage, Math.ceil(validatedTotalItems / validatedItemsPerPage) || 1));
    log('Initializing with page:', validInitialPage);
    return validInitialPage;
  });

  const [itemsPerPage, setItemsPerPage] = useState(validatedItemsPerPage);

  // Calculate total pages
  const totalPages = useMemo(() => {
    if (validatedTotalItems === 0) return 1;
    const pages = Math.ceil(validatedTotalItems / itemsPerPage);
    log('Total pages calculated:', pages);
    return Math.max(1, pages);
  }, [validatedTotalItems, itemsPerPage, log]);

  // Validate and adjust current page
  useEffect(() => {
    if (currentPage > totalPages) {
      log('Current page exceeds total pages, resetting to:', totalPages);
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages, log]);

  // Auto-reset to page 1 when total items or items per page changes
  useEffect(() => {
    if (autoResetPage) {
      log('Auto-resetting to page 1');
      setCurrentPage(1);
    }
  }, [validatedTotalItems, itemsPerPage, autoResetPage, log]);

  // Calculate pagination indices for slicing
  const paginationIndices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, validatedTotalItems);
    
    return {
      startIndex,
      endIndex,
      totalItems: validatedTotalItems,
      itemsPerPage,
      currentPage
    };
  }, [currentPage, itemsPerPage, validatedTotalItems]);

  // Generate page numbers with ellipsis
  const pageNumbers = useMemo(() => {
    const pages = [];
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const leftSibling = Math.floor(maxPagesToShow / 2);
      const rightSibling = maxPagesToShow - leftSibling - 1;
      
      let startPage = currentPage - leftSibling;
      let endPage = currentPage + rightSibling;
      
      if (startPage <= 1) {
        startPage = 1;
        endPage = maxPagesToShow;
      }
      
      if (endPage >= totalPages) {
        endPage = totalPages;
        startPage = totalPages - maxPagesToShow + 1;
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis indicators
      if (showEllipsis) {
        if (startPage > 1) {
          pages.unshift('...');
          pages.unshift(1);
        }
        
        if (endPage < totalPages) {
          pages.push('...');
          pages.push(totalPages);
        }
      }
    }
    
    log('Page numbers generated:', pages);
    return pages;
  }, [currentPage, totalPages, maxPagesToShow, showEllipsis, log]);

  // Navigation functions
  const goToPage = useCallback((page) => {
    if (page === '...') return;
    
    const pageNumber = Math.max(1, Math.min(page, totalPages));
    
    if (pageNumber !== currentPage) {
      log('Navigating to page:', pageNumber);
      setCurrentPage(pageNumber);
      
      if (onPageChange && typeof onPageChange === 'function') {
        onPageChange(pageNumber, {
          previousPage: currentPage,
          totalPages,
          itemsPerPage,
          totalItems: validatedTotalItems
        });
      }
    }
  }, [currentPage, totalPages, itemsPerPage, validatedTotalItems, onPageChange, log]);

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    } else {
      log('Already on last page');
    }
  }, [currentPage, totalPages, goToPage, log]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    } else {
      log('Already on first page');
    }
  }, [currentPage, goToPage, log]);

  const firstPage = useCallback(() => {
    if (currentPage !== 1) {
      goToPage(1);
    }
  }, [currentPage, goToPage]);

  const lastPage = useCallback(() => {
    if (currentPage !== totalPages) {
      goToPage(totalPages);
    }
  }, [currentPage, totalPages, goToPage]);

  const setItemsPerPageCallback = useCallback((newItemsPerPage) => {
    if (typeof newItemsPerPage === 'number' && newItemsPerPage > 0 && !isNaN(newItemsPerPage)) {
      log('Changing items per page to:', newItemsPerPage);
      setItemsPerPage(newItemsPerPage);
    } else {
      console.warn('[usePagination] Invalid itemsPerPage value:', newItemsPerPage);
    }
  }, [log]);

  // Helper booleans
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  // Range information for display
  const pageRange = useMemo(() => {
    const startItem = validatedTotalItems === 0 ? 0 : paginationIndices.startIndex + 1;
    const endItem = paginationIndices.endIndex;
    
    return {
      startItem,
      endItem,
      totalItems: validatedTotalItems
    };
  }, [paginationIndices, validatedTotalItems]);

  // Pagination info object
  const paginationInfo = useMemo(() => ({
    currentPage,
    totalPages,
    itemsPerPage,
    totalItems: validatedTotalItems,
    hasNextPage,
    hasPrevPage,
    isFirstPage,
    isLastPage,
    startIndex: paginationIndices.startIndex,
    endIndex: paginationIndices.endIndex,
    pageRange,
    pageNumbers
  }), [
    currentPage,
    totalPages,
    itemsPerPage,
    validatedTotalItems,
    hasNextPage,
    hasPrevPage,
    isFirstPage,
    isLastPage,
    paginationIndices,
    pageRange,
    pageNumbers
  ]);

  // Memoize return value
  const returnValue = useMemo(() => ({
    // State
    currentPage,
    totalPages,
    itemsPerPage,
    totalItems: validatedTotalItems,
    
    // Navigation methods
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    setItemsPerPage: setItemsPerPageCallback,
    
    // Indices for slicing data
    startIndex: paginationIndices.startIndex,
    endIndex: paginationIndices.endIndex,
    
    // Helper booleans
    hasNextPage,
    hasPrevPage,
    isFirstPage,
    isLastPage,
    
    // UI helpers
    pageNumbers,
    pageRange,
    
    // Complete pagination info
    paginationInfo,
    
    // Utility
    reset: () => goToPage(1),
    
    // Check if page exists
    hasPage: (page) => page >= 1 && page <= totalPages
  }), [
    currentPage,
    totalPages,
    itemsPerPage,
    validatedTotalItems,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    setItemsPerPageCallback,
    paginationIndices.startIndex,
    paginationIndices.endIndex,
    hasNextPage,
    hasPrevPage,
    isFirstPage,
    isLastPage,
    pageNumbers,
    pageRange,
    paginationInfo
  ]);

  log('Hook state:', {
    currentPage,
    totalPages,
    itemsPerPage,
    totalItems: validatedTotalItems,
    pageRange
  });

  return returnValue;
};

/**
 * Hook for paginating an array of data client-side.
 * 
 * @param {Array} data - The full array of data to paginate
 * @param {Object} options - Pagination options
 * @returns {Object} Paginated data and controls
 */
export const usePaginatedData = (data, options = {}) => {
  const {
    itemsPerPage = 10,
    initialPage = 1,
    ...paginationOptions
  } = options;

  // Validate data is an array
  const validatedData = useMemo(() => {
    if (!Array.isArray(data)) {
      console.warn('[usePaginatedData] Data must be an array. Received:', typeof data);
      return [];
    }
    return data;
  }, [data]);

  const pagination = usePagination(validatedData.length, {
    itemsPerPage,
    initialPage,
    ...paginationOptions
  });

  const { startIndex, endIndex } = pagination;
  
  const paginatedData = useMemo(() => {
    return validatedData.slice(startIndex, endIndex);
  }, [validatedData, startIndex, endIndex]);

  const returnValue = useMemo(() => ({
    ...pagination,
    paginatedData,
    totalItems: validatedData.length,
    allData: validatedData
  }), [pagination, paginatedData, validatedData]);

  return returnValue;
};

/**
 * Hook for paginated API requests (server-side pagination).
 * 
 * @param {Function} fetchFunction - Async function that fetches a page of data
 * @param {Object} options - Configuration options
 * @returns {Object} Pagination controls, data, and loading state
 */
export const usePaginatedAPI = (fetchFunction, options = {}) => {
  const {
    itemsPerPage = 10,
    initialPage = 1,
    onSuccess,
    onError,
    onLoadingChange,
    autoFetch = true,
    ...paginationOptions
  } = options;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPagesFromAPI, setTotalPagesFromAPI] = useState(null);

  const pagination = usePagination(totalItems, {
    itemsPerPage,
    initialPage,
    ...paginationOptions
  });

  const { currentPage, goToPage } = pagination;

  const fetchPage = useCallback(async (page = currentPage) => {
    try {
      setLoading(true);
      setError(null);
      
      if (onLoadingChange) {
        onLoadingChange(true);
      }
      
      const response = await fetchFunction({
        page,
        limit: itemsPerPage,
        offset: (page - 1) * itemsPerPage
      });
      
      // Support different API response structures
      let items = [];
      let total = 0;
      let totalPages = null;
      
      if (Array.isArray(response)) {
        items = response;
        total = response.length;
      } else if (response.data && Array.isArray(response.data)) {
        items = response.data;
        total = response.total || response.totalItems || response.count || response.data.length;
        totalPages = response.totalPages || response.pageCount;
      } else if (response.items && Array.isArray(response.items)) {
        items = response.items;
        total = response.total || response.items.length;
      } else {
        items = response.data || response.items || [];
        total = response.total || response.totalItems || response.count || items.length;
      }
      
      setData(items);
      setTotalItems(total);
      if (totalPages) {
        setTotalPagesFromAPI(totalPages);
      }
      
      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess({ data: items, total, page, limit: itemsPerPage });
      }
      
    } catch (err) {
      const errorMessage = err.message || err.response?.data?.message || 'An error occurred while fetching data';
      setError(errorMessage);
      
      if (onError && typeof onError === 'function') {
        onError(err);
      }
    } finally {
      setLoading(false);
      if (onLoadingChange) {
        onLoadingChange(false);
      }
    }
  }, [currentPage, itemsPerPage, fetchFunction, onSuccess, onError, onLoadingChange]);

  // Auto-fetch on mount and when page changes
  useEffect(() => {
    if (autoFetch) {
      fetchPage();
    }
  }, [fetchPage, autoFetch]);

  const refresh = useCallback(() => {
    goToPage(1);
  }, [goToPage]);

  const returnValue = useMemo(() => ({
    ...pagination,
    data,
    loading,
    error,
    refresh,
    totalItems,
    totalPages: totalPagesFromAPI || pagination.totalPages,
    fetchPage,
    isEmpty: data.length === 0 && !loading,
    hasData: data.length > 0
  }), [pagination, data, loading, error, refresh, totalItems, totalPagesFromAPI, fetchPage]);

  return returnValue;
};

/**
 * Hook for infinite scrolling pagination.
 * 
 * @param {Function} fetchFunction - Async function that fetches a page of data
 * @param {Object} options - Configuration options
 * @returns {Object} Infinite scroll controls and state
 */
export const useInfinitePagination = (fetchFunction, options = {}) => {
  const {
    itemsPerPage = 10,
    initialPage = 1,
    threshold = 100, // pixels from bottom to trigger load
    onSuccess,
    onError,
    autoFetch = true
  } = options;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalItems, setTotalItems] = useState(0);

  const loadMoreRef = useRef(null);
  const observerRef = useRef(null);

  const fetchPage = useCallback(async (page) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetchFunction({
        page,
        limit: itemsPerPage,
        offset: (page - 1) * itemsPerPage
      });
      
      let items = [];
      let total = 0;
      
      if (Array.isArray(response)) {
        items = response;
        total = response.length;
      } else if (response.data && Array.isArray(response.data)) {
        items = response.data;
        total = response.total || response.totalItems || response.count;
      } else {
        items = response.data || response.items || [];
        total = response.total || response.totalItems || response.count;
      }
      
      if (page === 1) {
        setData(items);
      } else {
        setData(prev => [...prev, ...items]);
      }
      
      if (total) {
        setTotalItems(total);
        const hasMoreData = data.length + items.length < total;
        setHasMore(hasMoreData);
      } else {
        setHasMore(items.length === itemsPerPage);
      }
      
      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess({ data: items, page, itemsPerPage });
      }
      
    } catch (err) {
      const errorMessage = err.message || 'An error occurred while fetching data';
      setError(errorMessage);
      setHasMore(false);
      
      if (onError && typeof onError === 'function') {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, itemsPerPage, data.length, onSuccess, onError]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchPage(nextPage);
    }
  }, [loading, hasMore, currentPage, fetchPage]);

  // Setup intersection observer
  useEffect(() => {
    if (!autoFetch) return;
    
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: `${threshold}px` }
    );
    
    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, loadMore, autoFetch, threshold]);

  // Initial load
  useEffect(() => {
    if (autoFetch) {
      setCurrentPage(initialPage);
      setData([]);
      setHasMore(true);
      fetchPage(initialPage);
    }
  }, [autoFetch, initialPage, fetchPage]);

  const reset = useCallback(() => {
    setCurrentPage(initialPage);
    setData([]);
    setHasMore(true);
    setError(null);
    fetchPage(initialPage);
  }, [initialPage, fetchPage]);

  const returnValue = useMemo(() => ({
    data,
    loading,
    hasMore,
    error,
    loadMore,
    reset,
    totalItems,
    currentPage,
    loadMoreRef
  }), [data, loading, hasMore, error, loadMore, reset, totalItems, currentPage]);

  return returnValue;
};

// Add display names for better debugging
usePagination.displayName = 'usePagination';
usePaginatedData.displayName = 'usePaginatedData';
usePaginatedAPI.displayName = 'usePaginatedAPI';
useInfinitePagination.displayName = 'useInfinitePagination';

// Export all hooks
export default usePagination;