import { type ReactNode } from 'react';
export interface ColumnDef<T> {
    header: ReactNode;
    key?: keyof T;
    width?: number | string;
    renderCell?: (item: T) => ReactNode;
}
interface DataTableProps<T> {
    columns: ColumnDef<T>[];
    data: T[];
    isLoading?: boolean;
    onRowClick?: (item: T) => void;
    emptyMessage?: string;
}
export declare function DataTable<T>({ columns, data, isLoading, onRowClick, emptyMessage }: DataTableProps<T>): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=DataTable.d.ts.map