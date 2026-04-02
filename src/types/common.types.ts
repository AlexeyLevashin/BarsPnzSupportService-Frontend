export interface PaginationParams {
    page: number;
    pageSize: number;
}

export interface PageInfo {
    pageNumber: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
}

export interface PagedResponse<T> {
    items: T[];
    pageInfo: PageInfo;
}