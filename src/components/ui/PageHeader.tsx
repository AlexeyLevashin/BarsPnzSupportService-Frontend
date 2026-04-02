import React, { type ReactNode } from 'react';
interface PageHeaderProps {
    title: string;
    actionLabel?: string;
    actionIcon?: ReactNode;
    onAction?: () => void;
    leftContent?: ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, actionLabel, actionIcon, onAction, leftContent }) => {
    return (
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <h2 className="page-title" style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>{title}</h2>
                {leftContent}
            </div>

            {actionLabel && (
                <div className="header-right">
                    <button className="action-btn-primary" onClick={onAction}>
                        {actionIcon}
                        {actionLabel}
                    </button>
                </div>
            )}
        </div>
    );
};