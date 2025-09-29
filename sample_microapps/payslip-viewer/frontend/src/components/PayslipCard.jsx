import { Calendar, User, Building, CreditCard, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, formatPayPeriod } from '../utils/api';

/**
 * PayslipCard component - displays payslip information in a clean card format
 * @param {Object} props - Component props
 * @param {Object} props.payslip - Payslip data object
 * @param {boolean} props.showActions - Whether to show action buttons
 */
export default function PayslipCard({ payslip, showActions = false }) {
  if (!payslip) return null;

  const {
    employeeId,
    name,
    designation,
    department,
    payPeriod,
    basicSalary,
    allowances,
    deductions,
    netSalary
  } = payslip;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{name}</h2>
            <p className="text-blue-100 text-sm">{designation}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-100">Employee ID</p>
            <p className="font-mono font-semibold">{employeeId}</p>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {department && (
            <div className="flex items-center space-x-2">
              <Building className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Department:</span>
              <span className="text-sm font-medium text-gray-900">{department}</span>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Pay Period:</span>
            <span className="text-sm font-medium text-gray-900">{formatPayPeriod(payPeriod)}</span>
          </div>
        </div>
      </div>

      {/* Salary Breakdown */}
      <div className="px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Salary Breakdown</h3>
        
        <div className="space-y-3">
          {/* Basic Salary */}
          <div className="flex justify-between items-center py-2">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-gray-700">Basic Salary</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {formatCurrency(basicSalary)}
            </span>
          </div>

          {/* Allowances */}
          <div className="flex justify-between items-center py-2">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-gray-700">Allowances</span>
            </div>
            <span className="text-sm font-semibold text-green-600">
              +{formatCurrency(allowances)}
            </span>
          </div>

          {/* Deductions */}
          <div className="flex justify-between items-center py-2">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-gray-700">Deductions</span>
            </div>
            <span className="text-sm font-semibold text-red-600">
              -{formatCurrency(deductions)}
            </span>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 my-2"></div>

          {/* Net Salary */}
          <div className="flex justify-between items-center py-3 bg-gray-50 -mx-6 px-6 rounded-lg">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-blue-600" />
              <span className="text-base font-semibold text-gray-900">Net Salary</span>
            </div>
            <span className="text-lg font-bold text-blue-600">
              {formatCurrency(netSalary)}
            </span>
          </div>
        </div>
      </div>

      {/* Actions Section */}
      {showActions && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <div className="flex space-x-3">
            <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              Download PDF
            </button>
            <button className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">
              Share
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
