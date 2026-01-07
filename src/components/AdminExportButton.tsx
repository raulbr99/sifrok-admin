'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, FileJson, Loader2 } from 'lucide-react';

interface AdminExportButtonProps {
  className?: string;
}

export default function AdminExportButton({ className = '' }: AdminExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const exportData = async (type: string, format: string) => {
    setIsExporting(true);
    try {
      const response = await fetch(
        `/api/admin/export?type=${type}&format=${format}`
      );

      if (!response.ok) {
        throw new Error('Error al exportar');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download =
        response.headers
          .get('Content-Disposition')
          ?.match(/filename="(.+)"/)?.[1] || `export.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Error al exportar los datos');
    } finally {
      setIsExporting(false);
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
      >
        {isExporting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Download className="w-5 h-5" />
        )}
        Exportar
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border p-3 z-50 min-w-[250px]">
            <p className="text-xs text-gray-500 uppercase font-medium mb-2 px-2">
              Pedidos
            </p>
            <button
              onClick={() => exportData('orders', 'csv')}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors text-left"
            >
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
              <span>Pedidos (CSV)</span>
            </button>
            <button
              onClick={() => exportData('orders', 'json')}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors text-left"
            >
              <FileJson className="w-5 h-5 text-blue-600" />
              <span>Pedidos (JSON)</span>
            </button>

            <hr className="my-2" />

            <p className="text-xs text-gray-500 uppercase font-medium mb-2 px-2">
              Usuarios
            </p>
            <button
              onClick={() => exportData('users', 'csv')}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors text-left"
            >
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
              <span>Usuarios (CSV)</span>
            </button>

            <hr className="my-2" />

            <p className="text-xs text-gray-500 uppercase font-medium mb-2 px-2">
              Reviews
            </p>
            <button
              onClick={() => exportData('reviews', 'csv')}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors text-left"
            >
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
              <span>Reviews (CSV)</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
