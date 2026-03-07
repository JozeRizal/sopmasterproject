import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mic, MicOff, ArrowRight, ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { generateSteps } from '../lib/ai';

export interface WizardState {
  step: number;
  formData: {
    title: string;
    division: string;
    objective: string;
    steps: string[];
  };
}

export const getInitialWizardState = (): WizardState => ({
  step: 0,
  formData: {
    title: '',
    division: '',
    objective: '',
    steps: ['']
  }
});

interface WizardProps {
  state: WizardState;
  onStateChange: (newState: WizardState) => void;
  onComplete: (data: any) => void;
}

export const Wizard: React.FC<WizardProps> = ({ state, onStateChange, onComplete }) => {
  const { step, formData } = state;
  const [isListening, setIsListening] = useState(false);
  const [isGeneratingSteps, setIsGeneratingSteps] = useState(false);

  const updateFormData = (newData: Partial<typeof formData>) => {
    onStateChange({
      ...state,
      formData: { ...formData, ...newData }
    });
  };

  const handleGenerateSteps = async () => {
    if (!formData.title || !formData.division || !formData.objective) {
      alert("Mohon lengkapi Nama SOP, Divisi, dan Tujuan terlebih dahulu.");
      return;
    }
    
    setIsGeneratingSteps(true);
    try {
      const generatedSteps = await generateSteps(formData.title, formData.division, formData.objective);
      updateFormData({ steps: generatedSteps });
    } catch (error) {
      console.error("Failed to generate steps:", error);
      alert("Gagal membuat langkah-langkah. Silakan coba lagi.");
    } finally {
      setIsGeneratingSteps(false);
    }
  };

  const setStep = (newStep: number) => {
    onStateChange({
      ...state,
      step: newStep
    });
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else onComplete(formData);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert('Browser Anda tidak mendukung fitur Voice-to-Text.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'id-ID';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (step === 3) {
        const newSteps = [...formData.steps];
        // If the last step is empty, replace it. Otherwise add a new one.
        const lastIndex = newSteps.length - 1;
        if (newSteps[lastIndex].trim() === '') {
          newSteps[lastIndex] = transcript;
        } else {
          newSteps.push(transcript);
        }
        updateFormData({ steps: newSteps });
      } else if (step === 0) {
        updateFormData({ title: formData.title ? `${formData.title} ${transcript}` : transcript });
      } else if (step === 1) {
        updateFormData({ division: formData.division ? `${formData.division} ${transcript}` : transcript });
      } else if (step === 2) {
        updateFormData({ objective: formData.objective ? `${formData.objective} ${transcript}` : transcript });
      }
    };

    recognition.start();
  };

  const renderVoiceButton = () => (
    <button
      onClick={handleVoiceInput}
      className={`mt-2 px-4 py-2 text-sm flex items-center gap-2 rounded-lg transition-colors ${isListening ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
    >
      {isListening ? <MicOff size={16} /> : <Mic size={16} />}
      {isListening ? 'Mendengarkan...' : 'Dikte (Voice)'}
    </button>
  );

  const steps = [
    {
      title: "Nama SOP",
      description: "Apa judul dari Prosedur Operasional Standar ini?",
      field: (
        <div>
          <input
            type="text"
            className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Contoh: Prosedur Penerimaan Barang"
            value={formData.title}
            onChange={(e) => updateFormData({ title: e.target.value })}
          />
          {renderVoiceButton()}
        </div>
      )
    },
    {
      title: "Divisi",
      description: "Divisi mana yang bertanggung jawab?",
      field: (
        <div>
          <input
            type="text"
            className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Contoh: Gudang / Logistik"
            value={formData.division}
            onChange={(e) => updateFormData({ division: e.target.value })}
          />
          {renderVoiceButton()}
        </div>
      )
    },
    {
      title: "Tujuan",
      description: "Apa tujuan utama dari SOP ini?",
      field: (
        <div>
          <textarea
            className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-32"
            placeholder="Contoh: Memastikan barang diterima sesuai pesanan..."
            value={formData.objective}
            onChange={(e) => updateFormData({ objective: e.target.value })}
          />
          {renderVoiceButton()}
        </div>
      )
    },
    {
      title: "Langkah-langkah",
      description: "Jelaskan langkah-langkah detailnya.",
      field: (
        <div className="space-y-4">
          {formData.steps.map((s, index) => (
            <div key={index} className="flex gap-2">
              <span className="font-mono text-gray-500 pt-3">{index + 1}.</span>
              <textarea
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={s}
                onChange={(e) => {
                  const newSteps = [...formData.steps];
                  newSteps[index] = e.target.value;
                  updateFormData({ steps: newSteps });
                }}
              />
            </div>
          ))}
          <div className="flex gap-2 mt-2 flex-wrap">
            <button
              onClick={() => updateFormData({ steps: [...formData.steps, ''] })}
              className="px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              + Tambah Langkah
            </button>
            
            <button
              onClick={handleGenerateSteps}
              disabled={isGeneratingSteps}
              className="px-4 py-2 text-sm flex items-center gap-2 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingSteps ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {isGeneratingSteps ? 'Sedang Membuat...' : 'Buatkan Langkah (AI)'}
            </button>

            {renderVoiceButton()}
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-lg mt-10">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">{steps[step].title}</h2>
          <span className="text-sm text-gray-500">Langkah {step + 1} dari 4</span>
        </div>
        <p className="text-gray-600 mb-6">{steps[step].description}</p>
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {steps[step].field}
        </motion.div>
      </div>

      <div className="flex justify-between mt-8 pt-6 border-t">
        <button
          onClick={handleBack}
          disabled={step === 0}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors ${step === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          <ArrowLeft size={20} />
          Kembali
        </button>
        <button
          onClick={handleNext}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
        >
          {step === 3 ? 'Buat SOP' : 'Lanjut'}
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};
