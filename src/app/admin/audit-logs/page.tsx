'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { formatDateTime } from '@/lib/utils/date-utils';

interface AuditLog {
  id: number;
  adminUserId: number;
  adminName: string;
  adminUsername: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues: any;
  newValues: any;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Filters
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [page, entityType, action]);

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (entityType) params.append('entityType', entityType);
      if (action) params.append('action', action);

      const response = await fetch(`/api/admin/audit-logs?${params}`);
      const data = await response.json();

      if (data.success) {
        setLogs(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderJsonDiff = (oldVal: any, newVal: any) => {
    if (!oldVal && !newVal) return <p className="text-gray-500 italic">No details provided</p>;

    return (
      <div className="grid grid-cols-2 gap-4 text-xs font-mono">
        <div className="bg-red-50 p-3 rounded border border-red-100 overflow-auto max-h-60">
          <h4 className="font-bold text-red-700 mb-2 uppercase tracking-tight text-[10px]">
            Old Values
          </h4>
          <pre>{JSON.stringify(oldVal, null, 2)}</pre>
        </div>
        <div className="bg-green-50 p-3 rounded border border-green-100 overflow-auto max-h-60">
          <h4 className="font-bold text-green-700 mb-2 uppercase tracking-tight text-[10px]">
            New Values
          </h4>
          <pre>{JSON.stringify(newVal, null, 2)}</pre>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
            <p className="mt-1 text-sm text-gray-500">
              Track administrative activities and system changes
            </p>
          </div>
          <div className="text-sm font-medium bg-gray-100 px-4 py-2 rounded-full">
            Total Logs: <span className="font-bold">{total}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 flex gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
              Module / Entity
            </label>
            <select
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-black focus:ring-black text-sm"
              value={entityType}
              onChange={(e) => {
                setEntityType(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Modules</option>
              <option value="product">Product</option>
              <option value="order">Order</option>
              <option value="user">User</option>
              <option value="category">Category</option>
              <option value="inventory">Inventory</option>
              <option value="voucher">Voucher</option>
              <option value="flash_sale">Flash Sale</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
              Action Type
            </label>
            <select
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-black focus:ring-black text-sm"
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="login">Login</option>
              <option value="status_change">Status Change</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Module
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Detail
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {log.adminName || log.adminUsername}
                      </div>
                      <div className="text-xs text-gray-500">{log.adminUsername}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          log.action === 'create'
                            ? 'bg-green-100 text-green-800'
                            : log.action === 'delete'
                              ? 'bg-red-100 text-red-800'
                              : log.action === 'update'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                      {log.entityType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {log.entityId || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                      {log.ipAddress}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-black hover:underline text-sm font-medium"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <p className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </p>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold">Activity Details</h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-500 hover:text-black text-2xl"
              >
                &times;
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <p>
                  <span className="text-gray-500">Admin:</span>{' '}
                  <span className="font-semibold">
                    {selectedLog.adminName} ({selectedLog.adminUsername})
                  </span>
                </p>
                <p>
                  <span className="text-gray-500">Timestamp:</span>{' '}
                  <span>{formatDateTime(selectedLog.createdAt)}</span>
                </p>
                <p>
                  <span className="text-gray-500">Action:</span>{' '}
                  <span className="uppercase font-bold text-xs">{selectedLog.action}</span>
                </p>
                <p>
                  <span className="text-gray-500">Entity:</span>{' '}
                  <span className="capitalize">
                    {selectedLog.entityType} #{selectedLog.entityId}
                  </span>
                </p>
                <p className="col-span-2">
                  <span className="text-gray-500">IP Address:</span>{' '}
                  <span>{selectedLog.ipAddress}</span>
                </p>
                <p className="col-span-2">
                  <span className="text-gray-500">User Agent:</span>{' '}
                  <span className="text-xs break-all">{selectedLog.userAgent}</span>
                </p>
              </div>

              <div className="pt-4 border-t">
                <h3 className="text-sm font-bold mb-3 uppercase tracking-wider text-gray-700">
                  Data Comparison
                </h3>
                {renderJsonDiff(selectedLog.oldValues, selectedLog.newValues)}
              </div>
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 text-right">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
