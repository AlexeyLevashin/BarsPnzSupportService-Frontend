import React, { type ReactNode } from 'react';
interface TableToolbarProps {
    searchPlaceholder?: string;
    onSearch?: (value: string) => void;
    filters?: ReactNode;
}

export const TableToolbar: React.FC<TableToolbarProps> = ({ searchPlaceholder, onSearch, filters }) => {
    return (
        <div className="table-toolbar">
            <div className="filters">
                {filters}
            </div>

            {searchPlaceholder && (
                <div className="search-box">
                    <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        onChange={(e) => onSearch && onSearch(e.target.value)}
                    />
                </div>
            )}
        </div>
    );
};