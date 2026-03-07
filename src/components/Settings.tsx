import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';

interface SettingsProps {
  onSave: (settings: { logo: string; primaryColor: string }) => void;
  initialSettings: { logo: string; primaryColor: string };
  onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onSave, initialSettings, onClose }) => {
  const [logo, setLogo] = useState(initialSettings.logo);
  const [primaryColor, setPrimaryColor] = useState(initialSettings.primaryColor);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>
        
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Pengaturan Branding</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Logo Perusahaan</label>
            <div className="flex items-center gap-4">
              {logo ? (
                <div className="relative w-24 h-24 border rounded-lg overflow-hidden">
                  <img src={logo} alt="Logo Perusahaan" className="w-full h-full object-contain" />
                  <button 
                    onClick={() => setLogo('')}
                    className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl-lg hover:bg-red-600"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400">
                  <Upload size={24} />
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleLogoUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Warna Tema Utama</label>
            <div className="flex flex-wrap gap-3 mb-3">
              {[
                '#000000', // Black
                '#3B82F6', // Blue
                '#EF4444', // Red
                '#10B981', // Green
                '#F59E0B', // Yellow
                '#8B5CF6', // Purple
                '#EC4899', // Pink
                '#6366F1', // Indigo
                '#14B8A6', // Teal
                '#F97316', // Orange
                '#06B6D4', // Cyan
                '#84CC16', // Lime
                '#F43F5E', // Rose
                '#64748B', // Slate
              ].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setPrimaryColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${primaryColor === color ? 'border-gray-900 scale-125 shadow-md' : 'border-transparent hover:scale-110'}`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Atau pilih warna kustom:</span>
              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-300 shadow-sm">
                <input 
                  type="color" 
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer"
                />
              </div>
              <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">{primaryColor}</span>
            </div>
          </div>

          <button
            onClick={() => {
              onSave({ logo, primaryColor });
              onClose();
            }}
            className="w-full py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Simpan Pengaturan
          </button>
        </div>
      </div>
    </div>
  );
};
