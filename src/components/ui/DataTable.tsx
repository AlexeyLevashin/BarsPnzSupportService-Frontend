import React, { type ReactNode } from 'react';
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

export function DataTable<T>({ columns, data, isLoading, onRowClick, emptyMessage = "Нет данных" }: DataTableProps<T>) {
    return (
        <div className="table-container">
            <table className="data-table table-hoverable">
                <thead>
                <tr>
                    {columns.map((col, index) => (
                        <th key={index} style={{width: col.width}}>{col.header}</th>))}
                </tr>
                </thead>
                <tbody>
                {isLoading ? (
                    <tr>
                        <td colSpan={columns.length} style={{ padding: '20px', textAlign: 'center' }}>
                            Загрузка...
                        </td>
                    </tr>
                ) : data.length === 0 ? (
                    <tr>
                        <td colSpan={columns.length} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                            {emptyMessage}
                        </td>
                    </tr>
                ) : (
                    data.map((item, rowIndex) => (
                        <tr key={rowIndex} onClick={() => onRowClick && onRowClick(item)}>
                            {columns.map((col, colIndex) => (
                                <td key={colIndex}>
                                    {col.renderCell ? col.renderCell(item) : col.key ? String(item[col.key]) : null}
                                </td>
                            ))}
                        </tr>
                    ))
                )}
                </tbody>
            </table>
        </div>
    );
}