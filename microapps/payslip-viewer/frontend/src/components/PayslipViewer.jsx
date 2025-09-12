import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { fetchPayslipByEmployee, getErrorMessage } from '../utils/api';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import PayslipCard from './PayslipCard';

export default function PayslipViewer() {
  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hardcoded employee ID for now
  const employeeId = 'EMP003';

  useEffect(() => {
    const loadPayslip = async () => {
      try {
        const response = await fetchPayslipByEmployee(employeeId);
        console.log('Fetched employeeId:', employeeId);
        // log response for debugging
        console.log('API Response:', response);
        setPayslip(response.data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    loadPayslip();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Payslip</h1>
          <p className="text-gray-600 text-sm">Employee ID: {employeeId}</p>
        </div>

        {/* Loading */}
        {loading && <LoadingSpinner text="Loading payslip..." size="lg" />}

        {/* Error */}
        {error && !loading && (
          <ErrorMessage
            message={error}
            type="error"
            dismissible
            onDismiss={() => setError(null)}
          />
        )}

        {/* Payslip */}
        {payslip && !loading && (
          <div className="animate-in fade-in duration-500">
            <PayslipCard payslip={payslip} showActions={false} />

            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Important Information</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li>This payslip is for reference purposes only</li>
                    <li>For official documentation, please contact HR</li>
                    <li>All amounts are in LKR</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}




// import React, { useState, useEffect } from 'react';
// import { Search, RefreshCw, AlertCircle } from 'lucide-react';
// import { 
//   fetchPayslipByEmployee, 
//   validateEmployeeId, 
//   getErrorMessage 
// } from '../utils/api';
// import LoadingSpinner from './LoadingSpinner';
// import ErrorMessage from './ErrorMessage';
// import PayslipCard from './PayslipCard';

// /**
//  * Main PayslipViewer component
//  * Provides search functionality and displays payslip information
//  */
// export default function PayslipViewer() {
//   const [employeeId, setEmployeeId] = useState('');
//   const [payslip, setPayslip] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [hasSearched, setHasSearched] = useState(false);

//   // Clear error when employee ID changes
//   useEffect(() => {
//     if (error) {
//       setError(null);
//     }
//   }, [employeeId]);

//   /**
//    * Handle search for payslip
//    */
//   const handleSearch = async () => {
//     // Reset previous state
//     setError(null);
//     setPayslip(null);
//     setHasSearched(true);

//     // Validate employee ID
//     const trimmedId = employeeId.trim().toUpperCase();
//     if (!trimmedId) {
//       setError('Please enter an Employee ID');
//       return;
//     }

//     if (!validateEmployeeId(trimmedId)) {
//       setError('Invalid Employee ID format. Please use format: ABC123 (3 letters + 3-6 digits)');
//       return;
//     }

//     setLoading(true);

//     try {
//       const response = await fetchPayslipByEmployee(trimmedId);
//       setPayslip(response.data);
//     } catch (err) {
//       setError(getErrorMessage(err));
//     } finally {
//       setLoading(false);
//     }
//   };

//   /**
//    * Handle form submission
//    */
//   const handleSubmit = (e) => {
//     e.preventDefault();
//     handleSearch();
//   };

//   /**
//    * Handle input key press
//    */
//   const handleKeyPress = (e) => {
//     if (e.key === 'Enter') {
//       handleSearch();
//     }
//   };

//   /**
//    * Clear search results
//    */
//   const handleClear = () => {
//     setEmployeeId('');
//     setPayslip(null);
//     setError(null);
//     setHasSearched(false);
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <div className="max-w-4xl mx-auto px-4 py-6">
//         {/* Header */}
//         <div className="text-center mb-8">
//           <h1 className="text-3xl font-bold text-gray-900 mb-2">
//             Payslip Viewer
//           </h1>
//           <p className="text-gray-600">
//             Enter your Employee ID to view your payslip details
//           </p>
//         </div>

//         {/* Search Form */}
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div>
//               <label 
//                 htmlFor="employeeId" 
//                 className="block text-sm font-medium text-gray-700 mb-2"
//               >
//                 Employee ID
//               </label>
//               <div className="relative">
//                 <input
//                   type="text"
//                   id="employeeId"
//                   value={employeeId}
//                   onChange={(e) => setEmployeeId(e.target.value)}
//                   onKeyPress={handleKeyPress}
//                   placeholder="e.g., EMP001"
//                   className="
//                     w-full px-4 py-3 pr-12 
//                     border border-gray-300 rounded-lg 
//                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500
//                     text-base font-mono
//                     placeholder-gray-400
//                   "
//                   disabled={loading}
//                 />
//                 <div className="absolute inset-y-0 right-0 flex items-center pr-3">
//                   <Search className="h-5 w-5 text-gray-400" />
//                 </div>
//               </div>
//               <p className="mt-1 text-xs text-gray-500">
//                 Format: 3 letters followed by 3-6 digits (e.g., EMP001)
//               </p>
//             </div>

//             <div className="flex space-x-3">
//               <button
//                 type="submit"
//                 disabled={loading || !employeeId.trim()}
//                 className="
//                   flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg 
//                   font-medium text-base
//                   hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
//                   disabled:bg-gray-300 disabled:cursor-not-allowed
//                   transition-colors
//                   flex items-center justify-center space-x-2
//                 "
//               >
//                 {loading ? (
//                   <>
//                     <RefreshCw className="h-4 w-4 animate-spin" />
//                     <span>Searching...</span>
//                   </>
//                 ) : (
//                   <>
//                     <Search className="h-4 w-4" />
//                     <span>Search Payslip</span>
//                   </>
//                 )}
//               </button>

//               {(hasSearched || payslip) && (
//                 <button
//                   type="button"
//                   onClick={handleClear}
//                   disabled={loading}
//                   className="
//                     px-4 py-3 border border-gray-300 rounded-lg 
//                     text-gray-700 font-medium text-base
//                     hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
//                     disabled:bg-gray-100 disabled:cursor-not-allowed
//                     transition-colors
//                   "
//                 >
//                   Clear
//                 </button>
//               )}
//             </div>
//           </form>
//         </div>

//         {/* Loading State */}
//         {loading && (
//           <LoadingSpinner 
//             text="Searching for payslip..." 
//             size="lg" 
//           />
//         )}

//         {/* Error State */}
//         {error && !loading && (
//           <ErrorMessage 
//             message={error} 
//             type="error" 
//             dismissible 
//             onDismiss={() => setError(null)} 
//           />
//         )}

//         {/* No Results State */}
//         {hasSearched && !loading && !error && !payslip && (
//           <div className="text-center py-12">
//             <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
//             <h3 className="text-lg font-medium text-gray-900 mb-2">
//               No Payslip Found
//             </h3>
//             <p className="text-gray-600 mb-4">
//               No payslip was found for Employee ID: <strong>{employeeId.toUpperCase()}</strong>
//             </p>
//             <p className="text-sm text-gray-500">
//               Please check the Employee ID and try again.
//             </p>
//           </div>
//         )}

//         {/* Payslip Results */}
//         {payslip && !loading && (
//           <div className="animate-in fade-in duration-500">
//             <PayslipCard 
//               payslip={payslip} 
//               showActions={true} 
//             />
            
//             {/* Additional Info */}
//             <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
//               <div className="flex items-start">
//                 <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
//                 <div className="text-sm text-blue-800">
//                   <p className="font-medium mb-1">Important Information</p>
//                   <ul className="list-disc list-inside space-y-1 text-blue-700">
//                     <li>This payslip is for reference purposes only</li>
//                     <li>For official documentation, please contact HR department</li>
//                     <li>All amounts are in Sri Lankan Rupees (LKR)</li>
//                   </ul>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Sample Employee IDs for Testing */}
//         {!hasSearched && (
//           <div className="mt-8 bg-gray-100 rounded-lg p-4">
//             <h3 className="text-sm font-medium text-gray-700 mb-2">
//               Sample Employee IDs for Testing:
//             </h3>
//             <div className="flex flex-wrap gap-2">
//               {['EMP001', 'EMP002', 'EMP003'].map((id) => (
//                 <button
//                   key={id}
//                   onClick={() => setEmployeeId(id)}
//                   className="
//                     px-3 py-1 bg-white border border-gray-300 rounded 
//                     text-sm font-mono text-gray-700
//                     hover:bg-gray-50 transition-colors
//                   "
//                 >
//                   {id}
//                 </button>
//               ))}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
