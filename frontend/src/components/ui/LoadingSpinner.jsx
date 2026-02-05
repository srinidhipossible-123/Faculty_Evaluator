import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ size = 24, className = "" }) => {
    return (
        <div className={`flex items-center justify-center ${className}`}>
            <Loader2 className={`animate-spin text-blue-600`} size={size} />
        </div>
    );
};

export default LoadingSpinner;
