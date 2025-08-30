
import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-primary p-6 rounded-lg shadow-lg ${className}`}>
      {children}
    </div>
  );
};

export default Card;
