export interface PaginationParams {
    take: number; // Current page number
    skip: number; // Number of rows per page
  }
  
  export interface SearchPaginationParams extends PaginationParams {
    search: string; // Search query string
  }
  