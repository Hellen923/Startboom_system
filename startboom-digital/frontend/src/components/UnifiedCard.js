import React from 'react';
import dm from '../utils/darkModeClasses';

/**
 * Standard card used across all roles — neutral elevated header, theme-aware body.
 */
const UnifiedCard = ({
  title,
  subtitle,
  headerAction,
  children,
  footer,
  className = '',
  bodyClassName = '',
  noPadding = false,
}) => (
  <div className={`${dm.unifiedCard} ${className}`}>
    {title && (
      <div className={dm.unifiedCardHeader}>
        <div className="min-w-0">
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {headerAction}
      </div>
    )}
    <div className={noPadding ? bodyClassName : `${dm.unifiedCardBody} ${bodyClassName}`}>
      {children}
    </div>
    {footer && <div className={dm.unifiedCardFooter}>{footer}</div>}
  </div>
);

export default UnifiedCard;
