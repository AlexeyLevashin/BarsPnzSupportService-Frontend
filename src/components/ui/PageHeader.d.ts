import React, { type ReactNode } from 'react';
interface PageHeaderProps {
    title: string;
    actionLabel?: string;
    actionIcon?: ReactNode;
    onAction?: () => void;
    leftContent?: ReactNode;
}
export declare const PageHeader: React.FC<PageHeaderProps>;
export {};
//# sourceMappingURL=PageHeader.d.ts.map