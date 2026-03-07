import React, { useState } from 'react';
import { Settings as SettingsIcon, RotateCcw, Loader2 } from 'lucide-react';
import { Wizard, WizardState, getInitialWizardState } from './components/Wizard';
import { SOPViewer } from './components/SOPViewer';
import { Settings } from './components/Settings';
import { useLocalStorage } from './lib/useLocalStorage';
import { generateSOP, SOPData, AIOutput } from './lib/ai';

// 1. Ini adalah Komponen Inti Aplikasi Anda
const CoreApp: React.FC<{ onNukeReset: () => void }> = ({ onNukeReset }) => {
  const [sopData, setSopData] = useLocalStorage<SOPData | null>('sopData', null);
  const [aiOutput, setAiOutput] = useLocalStorage<AIOutput | null>('aiOutput', null);
  const [wizardState, setWizardState] = useLocalStorage<WizardState>('wizardState', getInitialWizardState());
  const [settings, setSettings] = useLocalStorage('settings', {
    logo: '',
    primaryColor: '#3B82F6'
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleWizardComplete = async (data: SOPData) => {
    setIsGenerating(true);
    try {
      const output = await generateSOP(data);
      setSopData(data);
      setAiOutput(output);
    } catch (error) {
      console.error("Failed to generate SOP:", error);
      alert("Terjadi kesalahan saat membuat SOP. Silakan coba lagi.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
              S
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900">SOP MASTER</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onNukeReset}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Reset & Buat Baru"
            >
              <RotateCcw size={20} />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Pengaturan Branding"
            >
              <SettingsIcon size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center h-[60vh] space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
              <Loader2 size={48} className="text-blue-600 animate-spin relative z-10" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-gray-900">Sedang Menganalisis Proses...</h3>
              <p className="text-gray-500 max-w-md">AI sedang menyusun langkah-langkah, membuat flowchart, dan menentukan KPI untuk SOP Anda.</p>
            </div>
          </div>
        ) : !sopData ? (
          <Wizard 
            state={wizardState}
            onStateChange={setWizardState}
            onComplete={handleWizardComplete} 
          />
        ) : aiOutput ? (
          <SOPViewer 
            sopData={sopData} 
            aiOutput={aiOutput} 
            settings={settings} 
            onUpdateAiOutput={setAiOutput}
          />
        ) : null}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500 font-medium">
          © 2026. SOP MASTER by Joze Rizal
        </div>
      </footer>

      {/* Settings Modal */}
      {showSettings && (
        <Settings
          initialSettings={settings}
          onSave={setSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

// 2. Ini adalah Wrapper Utama (Pembungkus)
export default function App() {
  const [appKey, setAppKey] = useState(0);

  const handleNukeReset = () => {
    // KITA HAPUS window.confirm KARENA SERING DIBLOKIR OLEH IFRAME PREVIEW
    // Kita langsung paksa hapus dan reset!
    
    try {
      // 1. Sapu bersih seluruh local storage
      window.localStorage.clear();
      
      // 2. Trik tambahan: Timpa key spesifik untuk memastikan useLocalStorage benar-benar kosong
      window.localStorage.removeItem('sopData');
      window.localStorage.removeItem('aiOutput');
      window.localStorage.removeItem('wizardState');
    } catch (error) {
      console.warn("Iframe memblokir akses localStorage:", error);
    }
    
    // 3. Hancurkan dan bangun ulang aplikasi
    setAppKey(prev => prev + 1);
  };

  // Seluruh aplikasi dibungkus di sini. Jika appKey berubah, aplikasi reset 100%.
  return <CoreApp key={appKey} onNukeReset={handleNukeReset} />;
}