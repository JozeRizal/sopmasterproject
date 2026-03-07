import React, { useRef, useState, useEffect } from 'react';
import { FileText, Activity, Share2, Plus, Trash2, Printer, CheckSquare } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Mermaid from './Mermaid';
import { SOPData, AIOutput } from '../lib/ai';

interface SOPViewerProps {
  sopData: SOPData;
  aiOutput: AIOutput;
  settings: { logo: string; primaryColor: string };
  onUpdateAiOutput: (newOutput: AIOutput) => void;
}

export const SOPViewer: React.FC<SOPViewerProps> = ({ sopData, aiOutput, settings, onUpdateAiOutput }) => {
  const sopRef = useRef<HTMLDivElement>(null);
  const flowchartRef = useRef<HTMLDivElement>(null);
  const [newKpi, setNewKpi] = useState('');
  const [newChecklist, setNewChecklist] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  
  // Generate metadata once
  const [metaData, setMetaData] = useState({
    docNumber: `SOP-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
    revision: '1.0',
    effectiveDate: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    page: '1 dari 1'
  });

  const handleMetadataChange = (key: keyof typeof metaData, value: string) => {
    setMetaData(prev => ({ ...prev, [key]: value }));
  };

  const exportToPDF = async (elementRef: React.RefObject<HTMLDivElement>, filename: string) => {
    if (!elementRef.current) return;

    setIsExporting(true);
    try {
      window.scrollTo(0, 0);
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(elementRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const elements = clonedDoc.querySelectorAll('.hide-on-export');
          elements.forEach((el) => el.remove());
          
          // Fix for flowchart truncation (horizontal scroll)
          const scrollables = clonedDoc.querySelectorAll('.overflow-x-auto');
          scrollables.forEach((el) => {
            const element = el as HTMLElement;
            element.style.overflow = 'visible';
            element.style.width = 'fit-content';
            element.style.maxWidth = 'none';
            // Also ensure parent doesn't clip
            if (element.parentElement) {
               element.parentElement.style.overflow = 'visible';
               element.parentElement.style.width = 'fit-content';
            }
          });
        }
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Determine orientation based on image aspect ratio for better fit
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const orientation = imgWidth > imgHeight ? 'l' : 'p';
      
      const pdf = new jsPDF(orientation, 'mm', 'a4');
      const pdfPageWidth = pdf.internal.pageSize.getWidth();
      const pdfPageHeight = pdf.internal.pageSize.getHeight();
      
      const pdfImgHeight = (imgHeight * pdfPageWidth) / imgWidth;
      
      let heightLeft = pdfImgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfPageWidth, pdfImgHeight);
      heightLeft -= pdfPageHeight;

      while (heightLeft > 0) {
        position = heightLeft - pdfImgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfPageWidth, pdfImgHeight);
        heightLeft -= pdfPageHeight;
      }

      pdf.save(`${filename}.pdf`);
    } catch (error) {
      console.error("Export Error:", error);
      alert("Gagal mengekspor. Silakan coba lagi.");
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    const printContent = sopRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert("Pop-up diblokir. Mohon izinkan pop-up untuk mencetak dokumen ini.");
      return;
    }

    const doc = printWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cetak SOP - ${sopData.title}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              @page { margin: 15mm; size: A4; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .print\\:hidden { display: none !important; }
            }
            body { font-family: sans-serif; }
            .print\\:hidden { display: none !important; }
            
            /* Ensure table borders are visible */
            table, th, td { border-color: #1f2937 !important; }
          </style>
        </head>
        <body class="bg-white text-gray-900">
          <div class="p-8 w-full mx-auto">
            ${printContent.innerHTML}
          </div>
          <script>
            // Extra cleanup for interactive elements
            document.querySelectorAll('button').forEach(el => el.remove());
            document.querySelectorAll('input').forEach(el => el.remove());
            
            window.onload = () => {
              setTimeout(() => {
                window.print();
              }, 1000);
            };
          </script>
        </body>
      </html>
    `);
    doc.close();
  };

  const handleAddKpi = () => {
    if (newKpi.trim()) {
      const updatedKpis = [...aiOutput.kpis, newKpi.trim()];
      onUpdateAiOutput({ ...aiOutput, kpis: updatedKpis });
      setNewKpi('');
    }
  };

  const handleDeleteKpi = (index: number) => {
    const updatedKpis = aiOutput.kpis.filter((_, i) => i !== index);
    onUpdateAiOutput({ ...aiOutput, kpis: updatedKpis });
  };

  const handleAddChecklist = () => {
    if (newChecklist.trim()) {
      const updatedChecklist = [...aiOutput.checklist, `[ ] ${newChecklist.trim()}`];
      onUpdateAiOutput({ ...aiOutput, checklist: updatedChecklist });
      setNewChecklist('');
    }
  };

  const handleDeleteChecklist = (index: number) => {
    const updatedChecklist = aiOutput.checklist.filter((_, i) => i !== index);
    onUpdateAiOutput({ ...aiOutput, checklist: updatedChecklist });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <style>{`
        @media print {
          @page {
            margin: 15mm;
            size: A4;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            background-color: white;
          }
          body * {
            visibility: hidden;
          }
          #sop-container, #sop-container * {
            visibility: visible;
          }
          #sop-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            box-shadow: none !important;
            border: none !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .break-inside-avoid {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}</style>

      {/* Action Bar */}
      <div className="flex justify-end gap-4 sticky top-4 z-10 bg-white/80 backdrop-blur-md p-4 rounded-xl shadow-sm border border-gray-100 print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
        >
          <Printer size={16} />
          Cetak / Simpan PDF
        </button>
        <button
          onClick={() => exportToPDF(flowchartRef, `Flowchart-${sopData.title}`)}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? <Activity size={16} className="animate-spin" /> : <Activity size={16} />}
          {isExporting ? 'Mengekspor...' : 'Ekspor Diagram Alur'}
        </button>
      </div>

      {/* Main SOP Document - Corporate Grade */}
      <div 
        ref={sopRef}
        id="sop-container"
        className="bg-white p-8 md:p-12 shadow-xl min-h-[297mm] w-full mx-auto text-gray-900 font-sans"
        style={{ borderTop: `8px solid ${settings.primaryColor}` }}
      >
        {/* Corporate Header Table */}
        <div className="mb-8 border-2" style={{ borderColor: settings.primaryColor }}>
          <div className="grid grid-cols-12 h-32">
            {/* Logo Column */}
            <div className="col-span-3 p-2 flex items-center justify-center overflow-hidden">
              {settings.logo && (
                <img src={settings.logo} alt="Logo" className="w-full h-full object-contain" />
              )}
            </div>
            
            {/* Title Column */}
            <div className="col-span-6 p-4 text-center flex flex-col justify-center border-l-2 border-r-2" style={{ borderColor: settings.primaryColor }}>
              <h2 className="text-2xl font-bold uppercase tracking-wide leading-tight" style={{ color: settings.primaryColor }}>{sopData.title}</h2>
            </div>
            
            {/* Metadata Column */}
            <div className="col-span-3 text-xs flex flex-col bg-gray-50 font-medium">
              <div className="flex-1 flex items-center px-3 border-b" style={{ borderColor: settings.primaryColor }}>
                <div className="grid grid-cols-3 w-full items-center">
                  <span className="font-bold text-gray-700">No. Dok</span>
                  <div className="col-span-2 flex items-center">
                    <span className="mr-1">:</span>
                    <input 
                      type="text" 
                      value={metaData.docNumber}
                      onChange={(e) => handleMetadataChange('docNumber', e.target.value)}
                      className="bg-transparent border-b border-transparent hover:border-gray-300 focus:border-gray-500 focus:outline-none w-full px-1"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex-1 flex items-center px-3 border-b" style={{ borderColor: settings.primaryColor }}>
                <div className="grid grid-cols-3 w-full items-center">
                  <span className="font-bold text-gray-700">Revisi</span>
                  <div className="col-span-2 flex items-center">
                    <span className="mr-1">:</span>
                    <input 
                      type="text" 
                      value={metaData.revision}
                      onChange={(e) => handleMetadataChange('revision', e.target.value)}
                      className="bg-transparent border-b border-transparent hover:border-gray-300 focus:border-gray-500 focus:outline-none w-full px-1"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex-1 flex items-center px-3 border-b" style={{ borderColor: settings.primaryColor }}>
                <div className="grid grid-cols-3 w-full items-center">
                  <span className="font-bold text-gray-700">Tgl Efektif</span>
                  <div className="col-span-2 flex items-center">
                    <span className="mr-1">:</span>
                    <input 
                      type="text" 
                      value={metaData.effectiveDate}
                      onChange={(e) => handleMetadataChange('effectiveDate', e.target.value)}
                      className="bg-transparent border-b border-transparent hover:border-gray-300 focus:border-gray-500 focus:outline-none w-full px-1"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex-1 flex items-center px-3">
                <div className="grid grid-cols-3 w-full items-center">
                  <span className="font-bold text-gray-700">Halaman</span>
                  <div className="col-span-2 flex items-center">
                    <span className="mr-1">:</span>
                    <input 
                      type="text" 
                      value={metaData.page}
                      onChange={(e) => handleMetadataChange('page', e.target.value)}
                      className="bg-transparent border-b border-transparent hover:border-gray-300 focus:border-gray-500 focus:outline-none w-full px-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="space-y-8">
          {/* 1. Tujuan */}
          <section className="break-inside-avoid">
            <div className="flex items-center gap-3 mb-3 border-b pb-2" style={{ borderColor: settings.primaryColor }}>
              <span className="text-white text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: settings.primaryColor }}>1.0</span>
              <h3 className="text-lg font-bold uppercase tracking-tight" style={{ color: settings.primaryColor }}>Tujuan</h3>
            </div>
            <p className="text-justify leading-relaxed text-gray-700 pl-2">
              {sopData.objective}
            </p>
          </section>

          {/* 2. Prosedur */}
          <section>
            <div className="flex items-center gap-3 mb-4 border-b pb-2 break-after-avoid" style={{ borderColor: settings.primaryColor }}>
              <span className="text-white text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: settings.primaryColor }}>2.0</span>
              <h3 className="text-lg font-bold uppercase tracking-tight" style={{ color: settings.primaryColor }}>Langkah-langkah Prosedur</h3>
            </div>
            <div className="pl-2">
              <ol className="list-decimal pl-5 space-y-4 marker:font-bold" style={{ color: settings.primaryColor }}>
                {sopData.steps.map((step, i) => (
                  <li key={i} className="pl-2 leading-relaxed text-gray-800">
                    <span className="text-gray-800">{step.replace(/^(\d+[\.\)\-]\s*)+/, '').replace(/\*\*/g, '').trim()}</span>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* 3. KPI */}
          <section>
            <div className="flex items-center gap-3 mb-4 border-b pb-2 break-after-avoid" style={{ borderColor: settings.primaryColor }}>
              <span className="text-white text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: settings.primaryColor }}>3.0</span>
              <h3 className="text-lg font-bold uppercase tracking-tight" style={{ color: settings.primaryColor }}>Indikator Kinerja Utama (KPI)</h3>
            </div>
            <div className="pl-2">
              <div className="grid grid-cols-1 gap-3">
                {aiOutput.kpis.map((kpi, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-100 rounded-lg group hover:border-gray-300 transition-colors break-inside-avoid">
                    <CheckSquare size={20} className="mt-0.5 flex-shrink-0" style={{ color: settings.primaryColor }} />
                    <span className="flex-grow font-medium text-gray-700">{kpi}</span>
                    <button
                      onClick={() => handleDeleteKpi(i)}
                      className="print:hidden opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity p-1"
                      title="Hapus KPI"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Add KPI Input */}
              <div className="print:hidden mt-4 flex gap-2 pl-1">
                <input
                  type="text"
                  value={newKpi}
                  onChange={(e) => setNewKpi(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddKpi()}
                  placeholder="Tambah KPI manual..."
                  className="flex-grow px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-500 outline-none"
                />
                <button
                  onClick={handleAddKpi}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm font-bold"
                >
                  <Plus size={16} />
                  Tambah
                </button>
              </div>
            </div>
          </section>

          {/* 4. Checklist */}
          <section>
            <div className="flex items-center gap-3 mb-4 border-b pb-2 break-after-avoid" style={{ borderColor: settings.primaryColor }}>
              <span className="text-white text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: settings.primaryColor }}>4.0</span>
              <h3 className="text-lg font-bold uppercase tracking-tight" style={{ color: settings.primaryColor }}>Daftar Periksa Harian</h3>
            </div>
            <div className="pl-2">
              <div className="space-y-0 border border-gray-200 rounded-lg overflow-hidden">
                {aiOutput.checklist.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 border-b border-gray-200 last:border-0 hover:bg-gray-50 group break-inside-avoid">
                    <div className="w-5 h-5 border-2 border-gray-300 rounded flex-shrink-0" />
                    <span className="flex-grow text-gray-700">{item.replace(/^\[ \]\s*/, '').replace('[ ] ', '')}</span>
                    <button
                      onClick={() => handleDeleteChecklist(i)}
                      className="print:hidden opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity p-1"
                      title="Hapus Item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Checklist Input */}
              <div className="print:hidden mt-4 flex gap-2 pl-1">
                <input
                  type="text"
                  value={newChecklist}
                  onChange={(e) => setNewChecklist(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddChecklist()}
                  placeholder="Tambah item checklist manual..."
                  className="flex-grow px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-500 outline-none"
                />
                <button
                  onClick={handleAddChecklist}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm font-bold"
                >
                  <Plus size={16} />
                  Tambah
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Signature Block - Corporate Style */}
        <div className="mt-16 break-inside-avoid page-break-inside-avoid">
          <table className="w-full border-collapse border border-gray-800 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-800 p-3 w-1/3 text-center font-bold uppercase tracking-wider">Disiapkan Oleh</th>
                <th className="border border-gray-800 p-3 w-1/3 text-center font-bold uppercase tracking-wider">Ditinjau Oleh</th>
                <th className="border border-gray-800 p-3 w-1/3 text-center font-bold uppercase tracking-wider">Disetujui Oleh</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-800 h-32 align-bottom p-4">
                  <div className="text-center">
                    <div className="border-b border-gray-400 w-3/4 mx-auto mb-2"></div>
                    <p className="font-bold text-gray-900">Staf Operasional</p>
                    <p className="text-xs text-gray-500">Tanggal: ....................</p>
                  </div>
                </td>
                <td className="border border-gray-800 h-32 align-bottom p-4">
                  <div className="text-center">
                    <div className="border-b border-gray-400 w-3/4 mx-auto mb-2"></div>
                    <p className="font-bold text-gray-900">Supervisor</p>
                    <p className="text-xs text-gray-500">Tanggal: ....................</p>
                  </div>
                </td>
                <td className="border border-gray-800 h-32 align-bottom p-4">
                  <div className="text-center">
                    <div className="border-b border-gray-400 w-3/4 mx-auto mb-2"></div>
                    <p className="font-bold text-gray-900">Manajer Divisi</p>
                    <p className="text-xs text-gray-500">Tanggal: ....................</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-[10px] text-gray-400 border-t border-gray-200 pt-2 font-mono">
          Dokumen ini dihasilkan oleh sistem SOP MASTER. Penggunaan tidak sah dilarang. | Dicetak pada: {new Date().toLocaleString('id-ID')}
        </div>
      </div>

      {/* Flowchart Section (Separate for export) */}
      <div ref={flowchartRef} className="bg-white p-8 shadow-lg rounded-xl border border-gray-100 print:hidden">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-800">
          <Activity size={20} />
          Diagram Alur Proses
        </h3>
        <div className="flex justify-center p-4 bg-gray-50 rounded-lg border border-gray-100 overflow-x-auto">
          <Mermaid chart={aiOutput.mermaidCode} />
        </div>
      </div>

      {/* Cross-Linkage Notification */}
      {aiOutput.linkage && (
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-start gap-3 print:hidden">
          <div className="p-2 bg-blue-100 rounded-full text-blue-600">
            <Share2 size={16} />
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 text-sm">Saran Lintas Departemen</h4>
            <p className="text-blue-700 text-sm mt-1">{aiOutput.linkage}</p>
          </div>
        </div>
      )}
    </div>
  );
};
