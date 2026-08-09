import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  X, 
  UploadCloud, 
  FileSpreadsheet, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Package, 
  ArrowRight,
  FileText
} from 'lucide-react';
import { Product } from '../../types';
import { importProductsBatch } from '../../lib/productsService';

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingProducts?: Product[];
}

export const ImportExcelModal: React.FC<ImportExcelModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  existingProducts = []
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedItems, setParsedItems] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [updateExisting, setUpdateExisting] = useState<boolean>(true);
  const [importResult, setImportResult] = useState<{ added: number; updated: number } | null>(null);

  if (!isOpen) return null;

  // Helper to generate & download sample Excel template
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Loại hàng': 'Hàng hóa',
        'Nhóm hàng': 'Vật liệu chống thấm',
        'Mã hàng': 'SP00101',
        'Mã vạch': '893500000101',
        'Tên hàng': 'Màng chống thấm khò nóng Sika Bituseal T130 SG (10m²/cuộn)',
        'Thương hiệu': 'Sika',
        'Giá bán': 1250000,
        'Giá vốn': 980000,
        'Tồn kho': 45,
        'ĐVT': 'Cuộn',
        'Mô tả': 'Màng chống thấm gốc bitum khò nóng dày 3mm'
      },
      {
        'Loại hàng': 'Hàng hóa',
        'Nhóm hàng': 'Keo dán gạch & chà ron',
        'Mã hàng': 'SP00102',
        'Mã vạch': '893500000102',
        'Tên hàng': 'Keo dán gạch Weber.tai gres xám 25kg',
        'Thương hiệu': 'Weber',
        'Giá bán': 380000,
        'Giá vốn': 295000,
        'Tồn kho': 120,
        'ĐVT': 'Bao',
        'Mô tả': 'Keo dán gạch cao cấp cho gạch kích thước lớn'
      },
      {
        'Loại hàng': 'Dịch vụ',
        'Nhóm hàng': 'Dịch vụ thi công',
        'Mã hàng': 'DV0001',
        'Mã vạch': '',
        'Tên hàng': 'Dịch vụ thi công chống thấm sàn mái (m²)',
        'Thương hiệu': 'Chống Thấm 36',
        'Giá bán': 150000,
        'Giá vốn': 90000,
        'Tồn kho': 0,
        'ĐVT': 'm²',
        'Mô tả': 'Bao gồm vật tư phụ và công thợ trọn gói'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 12 }, // Loại hàng
      { wch: 25 }, // Nhóm hàng
      { wch: 12 }, // Mã hàng
      { wch: 15 }, // Mã vạch
      { wch: 45 }, // Tên hàng
      { wch: 15 }, // Thương hiệu
      { wch: 12 }, // Giá bán
      { wch: 12 }, // Giá vốn
      { wch: 10 }, // Tồn kho
      { wch: 8 },  // ĐVT
      { wch: 40 }  // Mô tả
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách hàng hóa');
    XLSX.writeFile(workbook, 'Mau_Import_Hang_Hoa_ChongTham36.xlsx');
  };

  // Process uploaded Excel / CSV file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setErrorMsg(null);
    setImportResult(null);
    setSelectedFile(file);
    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        // Parse to JSON objects
        const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });

        if (!rawData || rawData.length === 0) {
          setErrorMsg('File Excel không có dữ liệu hoặc định dạng không đúng!');
          setParsedItems([]);
          setIsLoading(false);
          return;
        }

        // Map columns to Product format intelligently
        const productsList: Product[] = [];
        let autoCodeIndex = Date.now();

        rawData.forEach((row, idx) => {
          // Normalize row keys (lowercase trimmed)
          const normalized: Record<string, any> = {};
          Object.keys(row).forEach((k) => {
            normalized[k.trim().toLowerCase()] = row[k];
          });

          // Extract fields with fallbacks
          const name = 
            row['Tên hàng'] || row['Tên sản phẩm'] || row['Tên SP'] ||
            normalized['name'] || normalized['tên hàng'] || normalized['tên sản phẩm'] || '';

          if (!name || String(name).trim() === '') return; // Skip empty name rows

          let code = 
            row['Mã hàng'] || row['Mã sản phẩm'] || row['Mã SP'] || row['SKU'] ||
            normalized['code'] || normalized['mã hàng'] || '';
          
          if (!code || String(code).trim() === '') {
            code = `SP${autoCodeIndex + idx}`;
          } else {
            code = String(code).trim();
          }

          const loaiHang = row['Loại hàng'] || normalized['loại hàng'] || 'Hàng hóa';
          const nhomHang = row['Nhóm hàng'] || row['Nhóm hàng(3 Cấp)'] || normalized['nhóm hàng'] || normalized['category'] || 'Vật liệu chống thấm';
          const maVach = String(row['Mã vạch'] || normalized['mã vạch'] || normalized['barcode'] || '');
          const brand = String(row['Thương hiệu'] || normalized['thương hiệu'] || normalized['brand'] || '');
          const unit = String(row['ĐVT'] || row['Đơn vị tính'] || normalized['đvt'] || normalized['unit'] || 'Cái');
          
          const price = Number(row['Giá bán'] || row['Đơn giá'] || normalized['giá bán'] || normalized['price'] || 0) || 0;
          const costPrice = Number(row['Giá vốn'] || row['Giá nhập'] || normalized['giá vốn'] || normalized['costprice'] || 0) || 0;
          const stock = Number(row['Tồn kho'] || row['Số lượng'] || normalized['tồn kho'] || normalized['stock'] || 0) || 0;
          const description = String(row['Mô tả'] || normalized['mô tả'] || normalized['description'] || '');

          productsList.push({
            id: code,
            loaiHang: String(loaiHang),
            nhomHang: String(nhomHang),
            category: String(nhomHang),
            code: String(code),
            maVach: maVach,
            name: String(name).trim(),
            brand: brand,
            price: price,
            costPrice: costPrice,
            stock: stock,
            unit: unit,
            maDvtCoBan: '',
            quyDoi: 1,
            imageUrl: '',
            tichDiem: 1,
            dangKinhDoanh: 1,
            duocBanTrucTiep: 1,
            description: description
          });
        });

        if (productsList.length === 0) {
          setErrorMsg('Không tìm thấy cột "Tên hàng" hợp lệ trong file!');
        } else {
          setParsedItems(productsList);
        }
      } catch (err) {
        console.error('Error parsing Excel file:', err);
        setErrorMsg('Không thể đọc được file Excel này. Vui lòng kiểm tra định dạng file!');
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Perform bulk import into Firestore
  const handleExecuteImport = async () => {
    if (parsedItems.length === 0) return;
    setIsImporting(true);
    setErrorMsg(null);

    try {
      const res = await importProductsBatch(parsedItems, updateExisting);
      setImportResult(res);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      console.error('Import error:', err);
      setErrorMsg('Có lỗi xảy ra khi lưu dữ liệu lên Firestore. Vui lòng thử lại!');
    } finally {
      setIsImporting(false);
    }
  };

  const resetState = () => {
    setSelectedFile(null);
    setParsedItems([]);
    setErrorMsg(null);
    setImportResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-4 bg-[#1e0b54] text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-400 text-[#1e0b54] rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-snug">Import Danh Sách Hàng Hóa từ Excel</h3>
              <p className="text-xs text-indigo-200">Nhập nhanh hàng loạt sản phẩm, bảng giá và tồn kho ban đầu</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          
          {/* Top Banner: Download Template */}
          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3 text-xs text-blue-900">
              <FileText className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <p className="font-bold text-sm">Chưa có file mẫu Excel?</p>
                <p className="text-blue-700">Tải file mẫu chuẩn đã cấu hình sẵn cột dữ liệu tiêu chuẩn Chống Thấm 36</p>
              </div>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="bg-white hover:bg-blue-100 text-blue-800 font-bold px-3.5 py-1.5 rounded-lg text-xs border border-blue-300 flex items-center shadow-2xs transition-colors shrink-0"
            >
              <Download className="w-4 h-4 mr-1.5 text-blue-600" />
              Tải File Excel Mẫu (.xlsx)
            </button>
          </div>

          {/* Upload Drop Zone */}
          {!parsedItems.length && !isLoading && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-gray-300 hover:border-[#1e0b54] rounded-xl p-8 text-center bg-gray-50 hover:bg-indigo-50/30 transition-all cursor-pointer group"
            >
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
                id="excel-file-upload"
              />
              <label htmlFor="excel-file-upload" className="cursor-pointer block">
                <div className="w-14 h-14 bg-indigo-100 text-[#1e0b54] rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <p className="text-sm font-bold text-gray-800">
                  Nhấp để chọn file hoặc kéo thả file Excel vào đây
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Hỗ trợ các định dạng: <span className="font-semibold text-gray-700">.xlsx, .xls, .csv</span>
                </p>
              </label>
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#1e0b54] animate-spin mx-auto" />
              <p className="text-xs font-semibold text-gray-600">Đang đọc và xử lý dữ liệu từ file Excel...</p>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Import Success Result Alert */}
          {importResult && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs space-y-1">
              <div className="flex items-center space-x-2 font-bold text-sm text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Nhập dữ liệu hoàn tất!</span>
              </div>
              <p className="text-xs text-emerald-700 pl-7">
                Thêm mới thành công <strong className="text-emerald-900">{importResult.added}</strong> sản phẩm. 
                {importResult.updated > 0 && (
                  <> Cập nhật thông tin <strong className="text-emerald-900">{importResult.updated}</strong> sản phẩm trùng mã.</>
                )}
              </p>
            </div>
          )}

          {/* Parsed File Preview & Summary */}
          {parsedItems.length > 0 && !importResult && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gray-100 p-3 rounded-xl gap-2 text-xs">
                <div className="flex items-center space-x-2">
                  <FileSpreadsheet className="w-4 h-4 text-[#1e0b54]" />
                  <span className="font-bold text-gray-800">{selectedFile?.name}</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {parsedItems.length} mặt hàng
                  </span>
                </div>

                <button
                  onClick={resetState}
                  className="text-xs text-red-600 hover:text-red-800 font-semibold underline"
                >
                  Chọn file khác
                </button>
              </div>

              {/* Import Options */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-3 text-xs space-y-2">
                <p className="font-bold text-amber-900">Tùy chọn xử lý khi trùng Mã hàng:</p>
                <div className="flex flex-wrap gap-4 text-amber-800">
                  <label className="flex items-center space-x-2 cursor-pointer font-medium">
                    <input
                      type="radio"
                      name="updateExisting"
                      checked={updateExisting === true}
                      onChange={() => setUpdateExisting(true)}
                      className="text-[#1e0b54] focus:ring-[#1e0b54]"
                    />
                    <span>Cập nhật thông tin (Giá bán, Tồn kho...) nếu trùng Mã hàng</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer font-medium">
                    <input
                      type="radio"
                      name="updateExisting"
                      checked={updateExisting === false}
                      onChange={() => setUpdateExisting(false)}
                      className="text-[#1e0b54] focus:ring-[#1e0b54]"
                    />
                    <span>Bỏ qua không cập nhật sản phẩm trùng Mã</span>
                  </label>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex justify-between items-center text-xs font-bold text-gray-700">
                  <span>Xem trước danh sách ({Math.min(parsedItems.length, 50)}/{parsedItems.length} dòng đầu):</span>
                </div>
                <div className="max-h-60 overflow-x-auto overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100 text-gray-700 sticky top-0 border-b border-gray-200">
                      <tr>
                        <th className="p-2 border-r border-gray-200">#</th>
                        <th className="p-2 border-r border-gray-200">Mã hàng</th>
                        <th className="p-2 border-r border-gray-200 min-w-[180px]">Tên hàng</th>
                        <th className="p-2 border-r border-gray-200">Nhóm hàng</th>
                        <th className="p-2 border-r border-gray-200 text-right">Giá bán</th>
                        <th className="p-2 border-r border-gray-200 text-right">Giá vốn</th>
                        <th className="p-2 border-r border-gray-200 text-right">Tồn kho</th>
                        <th className="p-2">ĐVT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-gray-800">
                      {parsedItems.slice(0, 50).map((item, i) => (
                        <tr key={i} className="hover:bg-indigo-50/40">
                          <td className="p-2 border-r border-gray-200 text-gray-400 font-mono text-[11px]">{i + 1}</td>
                          <td className="p-2 border-r border-gray-200 font-bold text-[#1e0b54]">{item.code}</td>
                          <td className="p-2 border-r border-gray-200 font-medium">{item.name}</td>
                          <td className="p-2 border-r border-gray-200 text-gray-600">{item.nhomHang}</td>
                          <td className="p-2 border-r border-gray-200 text-right font-semibold text-emerald-700">
                            {item.price.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="p-2 border-r border-gray-200 text-right text-gray-600">
                            {item.costPrice.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="p-2 border-r border-gray-200 text-right font-bold text-gray-900">
                            {item.stock}
                          </td>
                          <td className="p-2 text-gray-600">{item.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Đóng
          </button>

          {parsedItems.length > 0 && !importResult && (
            <button
              onClick={handleExecuteImport}
              disabled={isImporting}
              className="bg-[#1e0b54] hover:bg-[#15073c] text-white font-bold px-5 py-2.5 rounded-lg text-xs flex items-center shadow-md transition-colors disabled:opacity-50"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin text-amber-400" />
                  Đang lưu vào Firestore...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2 text-amber-400" />
                  Thực hiện Import ({parsedItems.length} hàng hóa)
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
