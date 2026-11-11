import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Download,
  RefreshCw,
  Sparkles,
  Info,
  Check,
  FileWarning,
} from 'lucide-react';
import {
  parseExcelBuffer,
  autoDetectColumnMapping,
  previewExcelRows,
  executeCustomerImport,
  generateSampleExcelFile,
  ExcelImportRow,
  ImportResultSummary,
} from '../../lib/customer-store';
import { useAuth } from '../../context/AuthContext';
import { Customer } from '../../types/database';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingCustomers: Customer[];
}

type ImportStep = 'upload' | 'mapping' | 'preview' | 'summary';

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  existingCustomers,
}) => {
  const { user, role } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
  const [fileName, setFileName] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({
    companyName: '',
    picName: '',
    whatsapp: '',
    email: '',
    address: '',
    city: '',
    segment: '',
    taxId: '',
  });

  const [previewRows, setPreviewRows] = useState<ExcelImportRow[]>([]);
  const [duplicateMode, setDuplicateMode] = useState<'skip' | 'update'>('skip');
  const [isProcessing, setIsProcessing] = useState(false);
  const [importSummary, setImportSummary] = useState<ImportResultSummary | null>(null);

  if (!isOpen) return null;

  // Handler for uploading files
  const handleFileUpload = async (file: File) => {
    setFileName(file.name);
    const buffer = await file.arrayBuffer();
    const result = parseExcelBuffer(buffer);

    setHeaders(result.headers);
    setRawRows(result.rawRows);

    // Auto map columns
    const autoMap = autoDetectColumnMapping(result.headers);
    setColumnMap(autoMap);

    setCurrentStep('mapping');
  };

  // Handler for isolated test sample
  const handleLoadSampleTestData = () => {
    setFileName('sample_customer_cpms_test.xlsx');
    const sampleBuffer = generateSampleExcelFile();
    const result = parseExcelBuffer(sampleBuffer.buffer as ArrayBuffer);

    setHeaders(result.headers);
    setRawRows(result.rawRows);

    const autoMap = autoDetectColumnMapping(result.headers);
    setColumnMap(autoMap);

    setCurrentStep('mapping');
  };

  // Download isolated sample Excel template
  const handleDownloadSampleTemplate = () => {
    const sampleBuffer = generateSampleExcelFile();
    const blob = new Blob([sampleBuffer as BlobPart], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Template_Import_Customer_CPMS.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Step 2 to Step 3: Run preview & validation
  const handleProceedToPreview = () => {
    const rows = previewExcelRows(rawRows, columnMap, existingCustomers);
    setPreviewRows(rows);
    setCurrentStep('preview');
  };

  // Step 3 to Step 4: Execute final import
  const handleExecuteImport = async () => {
    if (!user) return;
    setIsProcessing(true);

    try {
      const summary = await executeCustomerImport(previewRows, duplicateMode, user.email, role);
      setImportSummary(summary);
      setCurrentStep('summary');
      onSuccess(); // Refresh customer table in background
    } catch (err) {
      console.error('Import execution error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Download CSV error report
  const handleDownloadErrorReport = () => {
    if (!importSummary || importSummary.errors.length === 0) return;

    let csvContent = 'Baris Excel,Nama Perusahaan,Alasan Kegagalan / Peringatan\n';
    importSummary.errors.forEach((err) => {
      const escapedCompany = `"${err.company.replace(/"/g, '""')}"`;
      const escapedReason = `"${err.reason.replace(/"/g, '""')}"`;
      csvContent += `${err.row},${escapedCompany},${escapedReason}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_Error_Import_Customer_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setCurrentStep('upload');
    setFileName('');
    setHeaders([]);
    setRawRows([]);
    setPreviewRows([]);
    setImportSummary(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-4xl w-full my-6 shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Import Database Customer dari Excel / CSV
              </h2>
              <p className="text-xs text-slate-500">
                Migrasi data pelanggan kontraktor & batching plant tanpa menghapus data lama
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between px-8 py-3 bg-slate-100/70 border-b border-slate-200 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                currentStep === 'upload' ? 'bg-orange-600 text-white' : 'bg-slate-300 text-slate-700'
              }`}
            >
              1
            </span>
            <span className={currentStep === 'upload' ? 'font-bold text-slate-900' : 'text-slate-500'}>
              Upload File
            </span>
          </div>

          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />

          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                currentStep === 'mapping' ? 'bg-orange-600 text-white' : 'bg-slate-300 text-slate-700'
              }`}
            >
              2
            </span>
            <span className={currentStep === 'mapping' ? 'font-bold text-slate-900' : 'text-slate-500'}>
              Mapping Kolom
            </span>
          </div>

          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />

          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                currentStep === 'preview' ? 'bg-orange-600 text-white' : 'bg-slate-300 text-slate-700'
              }`}
            >
              3
            </span>
            <span className={currentStep === 'preview' ? 'font-bold text-slate-900' : 'text-slate-500'}>
              Validasi & Preview
            </span>
          </div>

          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />

          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                currentStep === 'summary' ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
              }`}
            >
              4
            </span>
            <span className={currentStep === 'summary' ? 'font-bold text-slate-900' : 'text-slate-500'}>
              Ringkasan Hasil
            </span>
          </div>
        </div>

        {/* Wizard Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* STEP 1: UPLOAD & TESTING */}
          {currentStep === 'upload' && (
            <div className="space-y-6">
              {/* Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-orange-500 rounded-2xl p-10 text-center bg-slate-50/50 hover:bg-orange-50/30 transition-all cursor-pointer group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
                <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                  <Upload className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">
                  Klik untuk Memilih File atau Tarik File ke Sini
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Mendukung format Microsoft Excel (<strong>.xlsx</strong>, <strong>.xls</strong>) dan CSV (<strong>.csv</strong>)
                </p>
                <span className="inline-block mt-3 text-[11px] font-semibold text-orange-700 bg-orange-100/70 px-3 py-1 rounded-full">
                  Maksimal 5.000 baris data per file
                </span>
              </div>

              {/* Sample Data & Testing Section */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Uji Coba Import Data Terpisah (Sebelum Import Database Asli)
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sesuai panduan bisnis CPMS, Anda disarankan menguji alur import dengan data contoh (memuat kontraktor BUMN, mitra batching plant, nomor WA valid, nomor duplikat, dan nomor format salah) untuk memverifikasi akurasi validasi.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleLoadSampleTestData}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Muat Data Contoh Uji Coba (1-Klik)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadSampleTemplate}
                    className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh File Template Excel (.xlsx)</span>
                  </button>
                </div>
              </div>

              {/* Preservation Notice */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2 text-xs text-blue-900">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Keamanan Data:</strong> Proses import hanya akan menambahkan data baru (*append*) atau memperbarui data yang cocok (*merge*). Data pelanggan yang sudah ada di sistem tidak akan pernah terhapus.
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: MAPPING KOLOM */}
          {currentStep === 'mapping' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Pemetaan Kolom Excel ke Database CPMS
                  </h3>
                  <p className="text-xs text-slate-500">
                    File: <strong className="text-slate-800 font-mono">{fileName}</strong> ({rawRows.length} baris terdeteksi)
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-800 font-semibold rounded border border-emerald-200 font-mono">
                  {headers.length} Kolom Header
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Field 1 */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Nama Perusahaan / Kontraktor <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={columnMap.companyName}
                    onChange={(e) => setColumnMap({ ...columnMap, companyName: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs"
                  >
                    <option value="">-- Pilih Kolom Excel --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* Field 2 */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Nama PIC / Kontak Lapangan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={columnMap.picName}
                    onChange={(e) => setColumnMap({ ...columnMap, picName: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs"
                  >
                    <option value="">-- Pilih Kolom Excel --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* Field 3 */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Nomor WhatsApp / HP (Indonesia) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={columnMap.whatsapp}
                    onChange={(e) => setColumnMap({ ...columnMap, whatsapp: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs"
                  >
                    <option value="">-- Pilih Kolom Excel --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* Field 4 */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Email Kontak / Kantor
                  </label>
                  <select
                    value={columnMap.email}
                    onChange={(e) => setColumnMap({ ...columnMap, email: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs"
                  >
                    <option value="">-- Lewati / Tidak Ada --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* Field 5 */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Alamat Proyek / Kantor
                  </label>
                  <select
                    value={columnMap.address}
                    onChange={(e) => setColumnMap({ ...columnMap, address: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs"
                  >
                    <option value="">-- Lewati / Tidak Ada --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* Field 6 */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Kota / Wilayah Cor
                  </label>
                  <select
                    value={columnMap.city}
                    onChange={(e) => setColumnMap({ ...columnMap, city: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs"
                  >
                    <option value="">-- Lewati / Tidak Ada --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* Field 7 */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Kategori / Segmentasi
                  </label>
                  <select
                    value={columnMap.segment}
                    onChange={(e) => setColumnMap({ ...columnMap, segment: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs"
                  >
                    <option value="">-- Default: Kontraktor Swasta --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* Field 8 */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Nomor NPWP
                  </label>
                  <select
                    value={columnMap.taxId}
                    onChange={(e) => setColumnMap({ ...columnMap, taxId: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs"
                  >
                    <option value="">-- Lewati / Tidak Ada --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW DATA & DUPLICATE SETTINGS */}
          {currentStep === 'preview' && (
            <div className="space-y-5">
              {/* Duplicate Strategy Radio Selector */}
              <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-orange-950 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  Kebijakan Penanganan Data Duplikat:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    duplicateMode === 'skip'
                      ? 'border-orange-500 bg-white ring-1 ring-orange-400 font-semibold text-slate-900'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="dupMode"
                      checked={duplicateMode === 'skip'}
                      onChange={() => setDuplicateMode('skip')}
                      className="mr-2"
                    />
                    <span>Lewati Duplikat (Skip)</span>
                    <p className="text-[11px] text-slate-500 font-normal mt-0.5 ml-5">
                      Pertahankan data customer lama, abaikan baris yang sama dari Excel.
                    </p>
                  </label>

                  <label className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    duplicateMode === 'update'
                      ? 'border-orange-500 bg-white ring-1 ring-orange-400 font-semibold text-slate-900'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="dupMode"
                      checked={duplicateMode === 'update'}
                      onChange={() => setDuplicateMode('update')}
                      className="mr-2"
                    />
                    <span>Perbarui Data yang Ada (Update / Merge)</span>
                    <p className="text-[11px] text-slate-500 font-normal mt-0.5 ml-5">
                      Sinkronkan alamat, PIC, dan email terbaru tanpa menghapus riwayat transaksi.
                    </p>
                  </label>
                </div>
              </div>

              {/* Table Preview */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">
                    Preview Data Hasil Mapping ({previewRows.length} Baris)
                  </span>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-emerald-700 font-medium">
                      ✓ Valid: {previewRows.filter((r) => r.isValidWA && !r.isDuplicate).length}
                    </span>
                    <span className="text-amber-700 font-medium">
                      ⚠ Duplikat: {previewRows.filter((r) => r.isDuplicate).length}
                    </span>
                    <span className="text-rose-700 font-medium">
                      ✕ Error WA: {previewRows.filter((r) => !r.isValidWA).length}
                    </span>
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-600 sticky top-0 font-semibold text-[11px]">
                      <tr>
                        <th className="py-2 px-3">No</th>
                        <th className="py-2 px-3">Nama Perusahaan</th>
                        <th className="py-2 px-3">PIC</th>
                        <th className="py-2 px-3">No WhatsApp</th>
                        <th className="py-2 px-3">Validasi WA</th>
                        <th className="py-2 px-3">Status Duplikasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewRows.map((row) => (
                        <tr
                          key={row.rowNumber}
                          className={`hover:bg-slate-50/80 ${
                            !row.isValidWA
                              ? 'bg-rose-50/40'
                              : row.isDuplicate
                              ? 'bg-amber-50/40'
                              : ''
                          }`}
                        >
                          <td className="py-2 px-3 text-slate-400 font-mono">{row.rowNumber}</td>
                          <td className="py-2 px-3 font-semibold text-slate-800">{row.companyName || '-'}</td>
                          <td className="py-2 px-3 text-slate-600">{row.picName || '-'}</td>
                          <td className="py-2 px-3 font-mono text-slate-800">{row.whatsapp}</td>
                          <td className="py-2 px-3">
                            {row.isValidWA ? (
                              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3 h-3" />
                                Valid (+62)
                              </span>
                            ) : (
                              <span
                                title={row.waError}
                                className="text-[10px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-medium flex items-center gap-1 w-fit"
                              >
                                <AlertCircle className="w-3 h-3" />
                                Format Salah
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            {row.isDuplicate ? (
                              <span
                                title={`Cocok dengan: ${row.matchedExisting?.company_name} (${row.matchedExisting?.customer_code})`}
                                className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium flex items-center gap-1 w-fit"
                              >
                                ⚠ Duplikat ({duplicateMode.toUpperCase()})
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-mono">
                                Baru
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: SUMMARY & ERROR DOWNLOAD */}
          {currentStep === 'summary' && importSummary && (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Proses Import Selesai Dijalankan
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Data pelanggan telah diproses ke database Supabase CPMS
                </p>
              </div>

              {/* Stats Box */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-2xl mx-auto text-left">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total Baris</span>
                  <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">{importSummary.totalProcessed}</span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-[10px] text-emerald-700 uppercase font-semibold block">Data Baru</span>
                  <span className="text-xl font-bold text-emerald-800 font-mono tabular-nums">{importSummary.importedCount}</span>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <span className="text-[10px] text-blue-700 uppercase font-semibold block">Diperbarui</span>
                  <span className="text-xl font-bold text-blue-800 font-mono tabular-nums">{importSummary.updatedCount}</span>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <span className="text-[10px] text-amber-700 uppercase font-semibold block">Dilewati</span>
                  <span className="text-xl font-bold text-amber-800 font-mono tabular-nums">{importSummary.skippedCount}</span>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-rose-700 uppercase font-semibold block">Gagal / Error</span>
                  <span className="text-xl font-bold text-rose-800 font-mono tabular-nums">{importSummary.errorCount}</span>
                </div>
              </div>

              {/* Error report button if any */}
              {importSummary.errorCount > 0 && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleDownloadErrorReport}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-semibold rounded-lg inline-flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-rose-600" />
                    <span>Download Laporan Kesalahan ({importSummary.errorCount} Baris Gagal)</span>
                  </button>
                  <p className="text-[11px] text-slate-400 mt-1">
                    File CSV memuat nomor baris Excel, nama kontraktor, dan penyebab kegagalan nomor WA.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          {currentStep === 'mapping' && (
            <button
              onClick={() => setCurrentStep('upload')}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Ganti File</span>
            </button>
          )}

          {currentStep === 'preview' && (
            <button
              onClick={() => setCurrentStep('mapping')}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Mapping</span>
            </button>
          )}

          {currentStep === 'upload' && <div></div>}
          {currentStep === 'summary' && <div></div>}

          <div className="flex items-center gap-2">
            {currentStep === 'upload' && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Tutup
              </button>
            )}

            {currentStep === 'mapping' && (
              <button
                type="button"
                disabled={!columnMap.companyName || !columnMap.whatsapp}
                onClick={handleProceedToPreview}
                className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <span>Validasi & Preview Data</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {currentStep === 'preview' && (
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleExecuteImport}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isProcessing ? (
                  <span>Mengimpor Data...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Eksekusi Import ({previewRows.length} Baris)</span>
                  </>
                )}
              </button>
            )}

            {currentStep === 'summary' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  handleReset();
                }}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Selesai & Buka Daftar Customer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
