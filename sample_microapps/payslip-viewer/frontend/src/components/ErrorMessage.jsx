import { AlertCircle, X } from 'lucide-react';

/**
 * Reusable error message component
 * @param {Object} props - Component props
 * @param {string} props.message - Error message to display
 * @param {string} props.type - Error type (error, warning, info)
 * @param {boolean} props.dismissible - Whether error can be dismissed
 * @param {Function} props.onDismiss - Callback when error is dismissed
 */
export default function ErrorMessage({ 
  message, 
  type = 'error', 
  dismissible = false, 
  onDismiss 
}) {
  if (!message) return null;

  const typeStyles = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const iconStyles = {
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500'
  };

  return (
    <div className={`
      rounded-lg border p-4 mb-4 
      ${typeStyles[type]}
    `}>
      <div className="flex items-start">
        <AlertCircle className={`
          h-5 w-5 mt-0.5 mr-3 flex-shrink-0
          ${iconStyles[type]}
        `} />
        
        <div className="flex-1">
          <p className="text-sm font-medium leading-5">
            {message}
          </p>
        </div>
        
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className={`
              ml-3 flex-shrink-0 rounded-md p-1 
              hover:bg-opacity-20 hover:bg-gray-600
              ${iconStyles[type]}
            `}
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
