'use client';

import React, { useState, useRef } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import Link from 'next/link';

interface ImportResult {
  imported: number;
  skipped: number;
  total: number;
  errors: string[];
}

export default function BulkImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv',
      ];
      if (!validTypes.includes(selected.type) && !selected.name.match(/\.(xlsx|xls|csv)$/i)) {
        setError('Vui lòng chọn file Excel (.xlsx, .xls) hoặc CSV');
        return;
      }
      setFile(selected);
      setError('');
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setUploading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/products/bulk', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Lỗi khi upload file. Vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch('/api/admin/products/bulk');
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Lỗi khi xuất file. Vui lòng thử lại.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link href="/admin/products" className="text-gray-400 hover:text-gray-600">
                ← Sản phẩm
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Import / Export Sản phẩm</h1>
            <p className="mt-1 text-sm text-gray-500">
              Nhập hàng loạt từ file Excel hoặc xuất danh sách sản phẩm
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Import Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Import Sản phẩm
            </h2>

            {/* Upload Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-black hover:bg-gray-50 transition-colors"
            >
              <svg
                className="w-10 h-10 text-gray-400 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              {file ? (
                <p className="text-sm font-medium text-gray-900">
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              ) : (
                <>
                  <p className="text-sm text-gray-600">Click để chọn file hoặc kéo thả vào đây</p>
                  <p className="text-xs text-gray-400 mt-1">.xlsx, .xls, .csv</p>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              onClick={handleImport}
              disabled={!file || uploading}
              className={`mt-4 w-full py-2.5 rounded-lg text-sm font-semibold transition-all ${
                file && !uploading
                  ? 'bg-black text-white hover:bg-gray-800'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {uploading ? 'Đang xử lý...' : 'Bắt đầu Import'}
            </button>

            {/* Template Info */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
              <p className="font-medium text-gray-700 mb-1">Cấu trúc cột bắt buộc:</p>
              <code className="text-xs">name, price_cache</code>
              <p className="font-medium text-gray-700 mt-2 mb-1">Cột tùy chọn:</p>
              <code className="text-xs">
                sku, slug, msrp_price, short_description, description, category_name, brand_name,
                is_active, is_featured, is_new_arrival
              </code>
            </div>
          </div>

          {/* Export Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Export Sản phẩm
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Xuất toàn bộ danh sách sản phẩm ra file Excel. File này có thể dùng để chỉnh sửa và
              import lại.
            </p>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="w-full py-2.5 bg-white border-2 border-black text-black rounded-lg text-sm font-semibold hover:bg-black hover:text-white transition-all"
            >
              {exporting ? 'Đang xuất...' : 'Tải file Excel'}
            </button>
          </div>
        </div>

        {/* Results */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
            {error}
          </div>
        )}

        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Kết quả Import</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{result.imported}</p>
                <p className="text-sm text-green-700">Thành công</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{result.skipped}</p>
                <p className="text-sm text-red-700">Bỏ qua</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-600">{result.total}</p>
                <p className="text-sm text-gray-700">Tổng</p>
              </div>
            </div>
            {result.errors.length > 0 && (
              <div>
                <p className="text-sm font-medium text-red-600 mb-2">Chi tiết lỗi:</p>
                <ul className="text-xs text-red-500 space-y-1 max-h-40 overflow-y-auto">
                  {result.errors.map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
