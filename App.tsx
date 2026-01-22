
import React, { useState, useCallback } from 'react';
import { 
  AppStep, 
  AppData, 
  BoardConfig 
} from './types';
import { generateMockup } from './services/geminiService';
import { 
  Camera, 
  Building, 
  Image as ImageIcon, 
  Palette, 
  Layout, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Download,
  Share2,
  Loader2,
  RefreshCw
} from 'lucide-react';

const INITIAL_BOARD: BoardConfig = {
  headline: '',
  imagePrompt: '',
  includeLogo: true
};

const INITIAL_DATA: AppData = {
  streetPhoto: null,
  clientName: '',
  clientLogo: null,
  brandUrl: '',
  primaryColor: '#ef4444', // Default to a brand red
  boards: [
    { ...INITIAL_BOARD },
    { ...INITIAL_BOARD },
    { ...INITIAL_BOARD }
  ]
};

export default function App() {
  const [step, setStep] = useState<AppStep>(AppStep.STREET_PHOTO);
  const [formData, setFormData] = useState<AppData>(INITIAL_DATA);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isError, setIsError] = useState<string | null>(null);

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);
  const goToStep = (s: AppStep) => setStep(s);

  const handleFileUpload = (field: 'streetPhoto' | 'clientLogo', file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, [field]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleBoardChange = (index: number, updates: Partial<BoardConfig>) => {
    const newBoards = [...formData.boards];
    newBoards[index] = { ...newBoards[index], ...updates };
    setFormData(prev => ({ ...prev, boards: newBoards }));
  };

  const runGeneration = async () => {
    setStep(AppStep.GENERATING);
    setIsError(null);
    try {
      const result = await generateMockup(formData);
      setResultImage(result);
      setStep(AppStep.RESULT);
    } catch (err: any) {
      setIsError(err.message || "Failed to generate mockup. Please try again.");
      setStep(AppStep.SUMMARY);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `${formData.clientName}_Street_Mockup.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (!resultImage) return;
    try {
      const response = await fetch(resultImage);
      const blob = await response.blob();
      const file = new File([blob], `${formData.clientName}_Mockup.png`, { type: 'image/png' });
      
      if (navigator.share) {
        await navigator.share({
          title: `Ad Mockup for ${formData.clientName}`,
          text: `Check out this street pole advertisement mockup for ${formData.clientName}`,
          files: [file]
        });
      } else {
        alert("Sharing not supported on this browser. Try downloading!");
      }
    } catch (err) {
      console.error("Share error:", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8 bg-slate-50">
      {/* Header */}
      <header className="w-full max-w-4xl flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-200">
            <Layout className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Adreach Mock Up Studio</h1>
            <p className="text-sm text-red-600 font-semibold tracking-tight">Sales Rep Portal</p>
          </div>
        </div>
        {step > AppStep.STREET_PHOTO && step < AppStep.RESULT && (
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Step {step + 1} of 7
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-2xl bg-white rounded-3xl shadow-xl shadow-red-100/50 overflow-hidden border border-slate-100 flex flex-col">
        {/* Progress Bar */}
        {step < AppStep.RESULT && (
          <div className="h-1.5 w-full bg-slate-100 flex">
            {Array.from({ length: 7 }).map((_, i) => (
              <div 
                key={i} 
                className={`flex-1 transition-all duration-500 ${i <= step ? 'bg-red-500' : 'bg-transparent'}`}
              />
            ))}
          </div>
        )}

        <div className="p-8 sm:p-12">
          {step === AppStep.STREET_PHOTO && (
            <div className="space-y-6">
              <div className="text-center">
                <Camera className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-800">Upload Street Scene</h2>
                <p className="text-slate-500 mt-2">Upload a clear photo of the street pole where you want the ads placed.</p>
              </div>
              <label className="group relative border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 hover:border-red-400 hover:bg-red-50/30 transition-all cursor-pointer overflow-hidden">
                {formData.streetPhoto ? (
                  <img src={formData.streetPhoto} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <>
                    <ImageIcon className="w-10 h-10 text-slate-300 group-hover:text-red-400 transition-colors" />
                    <span className="text-sm font-medium text-slate-500">Drop image here or click to browse</span>
                  </>
                )}
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => e.target.files?.[0] && handleFileUpload('streetPhoto', e.target.files[0])} 
                />
              </label>
              <button 
                disabled={!formData.streetPhoto}
                onClick={nextStep}
                className="w-full py-4 bg-red-600 text-white rounded-xl font-semibold shadow-lg shadow-red-200 hover:bg-red-700 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === AppStep.CLIENT_INFO && (
            <div className="space-y-6">
              <div className="text-center">
                <Building className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-800">Client Identification</h2>
                <p className="text-slate-500 mt-2">Tell us which brand we're designing for.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Client Name</label>
                  <input 
                    type="text" 
                    value={formData.clientName}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                    placeholder="e.g. Acme Corporation"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-black font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Website URL (Optional)</label>
                  <input 
                    type="url" 
                    value={formData.brandUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, brandUrl: e.target.value }))}
                    placeholder="https://acme.com"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-black font-medium"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={prevStep} className="flex-1 py-4 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={nextStep} disabled={!formData.clientName} className="flex-[2] py-4 bg-red-600 text-white rounded-xl font-semibold shadow-lg shadow-red-200 hover:bg-red-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                  Branding Assets <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === AppStep.BRAND_ASSETS && (
            <div className="space-y-6">
              <div className="text-center">
                <Palette className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-800">Branding Assets</h2>
                <p className="text-slate-500 mt-2">Upload the client logo and pick a primary brand color.</p>
              </div>
              <div className="space-y-6">
                <div className="flex gap-6 items-center">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Primary Color</label>
                    <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <input 
                        type="color" 
                        value={formData.primaryColor}
                        onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="w-10 h-10 rounded-lg border-none cursor-pointer"
                      />
                      <span className="font-mono text-sm text-black font-bold">{formData.primaryColor.toUpperCase()}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Client Logo</label>
                  <label className="group relative border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-2 hover:border-red-400 hover:bg-red-50/30 transition-all cursor-pointer min-h-[160px]">
                    {formData.clientLogo ? (
                      <img src={formData.clientLogo} className="max-h-24 object-contain" />
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 text-slate-300 group-hover:text-red-400 transition-colors" />
                        <span className="text-xs font-medium text-slate-500">PNG preferred</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={(e) => e.target.files?.[0] && handleFileUpload('clientLogo', e.target.files[0])} 
                    />
                  </label>
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={prevStep} className="flex-1 py-4 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-all">Back</button>
                <button onClick={nextStep} className="flex-[2] py-4 bg-red-600 text-white rounded-xl font-semibold shadow-lg shadow-red-200 hover:bg-red-700 transition-all flex items-center justify-center gap-2">
                  Configure Board 1 <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {[AppStep.BOARD_1, AppStep.BOARD_2, AppStep.BOARD_3].includes(step) && (
            <div className="space-y-6">
              <div className="text-center">
                <Layout className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-800">Board {step - 2} Content</h2>
                <p className="text-slate-500 mt-2">Define what appears on this specific advertisement panel.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Main Headline (Max 8 words)</label>
                  <input 
                    type="text" 
                    maxLength={100}
                    value={formData.boards[step - 3].headline}
                    onChange={(e) => handleBoardChange(step - 3, { headline: e.target.value })}
                    placeholder="e.g. Elevate Your Journey Today"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-black font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Image Visual Prompt</label>
                  <textarea 
                    value={formData.boards[step - 3].imagePrompt}
                    onChange={(e) => handleBoardChange(step - 3, { imagePrompt: e.target.value })}
                    placeholder="e.g. A modern, minimalist illustration of a person hiking a mountain at sunrise"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none min-h-[100px] text-black font-medium"
                  />
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only"
                      checked={formData.boards[step - 3].includeLogo}
                      onChange={(e) => handleBoardChange(step - 3, { includeLogo: e.target.checked })}
                    />
                    <div className={`w-12 h-6 rounded-full transition-colors ${formData.boards[step - 3].includeLogo ? 'bg-red-600' : 'bg-slate-300'}`}></div>
                    <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.boards[step - 3].includeLogo ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </div>
                  <span className="text-sm font-medium text-slate-700">Include Client Logo on this board</span>
                </label>
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={prevStep} className="flex-1 py-4 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-all">Back</button>
                <button 
                  onClick={nextStep} 
                  disabled={!formData.boards[step - 3].headline || !formData.boards[step - 3].imagePrompt}
                  className="flex-[2] py-4 bg-red-600 text-white rounded-xl font-semibold shadow-lg shadow-red-200 hover:bg-red-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {step === AppStep.BOARD_3 ? 'Review Mockup' : `Configure Board ${step - 1}`} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === AppStep.SUMMARY && (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-800">Review & Finalize</h2>
                <p className="text-slate-500 mt-2">Ready to generate your high-fidelity mockup.</p>
              </div>
              
              {isError && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">
                  {isError}
                </div>
              )}

              <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-100">
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-bold">Client</span>
                    <p className="text-black font-bold">{formData.clientName}</p>
                  </div>
                  <button onClick={() => goToStep(AppStep.CLIENT_INFO)} className="text-red-600 text-xs font-bold hover:underline">Edit</button>
                </div>
                <div className="p-4 grid grid-cols-3 gap-2">
                  {formData.boards.map((b, i) => (
                    <div key={i} className="space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Board {i + 1}</span>
                      <p className="text-xs text-black font-semibold line-clamp-2">{b.headline}</p>
                    </div>
                  ))}
                  <button onClick={() => goToStep(AppStep.BOARD_1)} className="col-span-3 text-red-600 text-xs font-bold hover:underline mt-2 text-right">Edit Content</button>
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={prevStep} className="flex-1 py-4 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-all">Back</button>
                <button 
                  onClick={runGeneration}
                  className="flex-[2] py-4 bg-red-600 text-white rounded-xl font-semibold shadow-lg shadow-red-200 hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                >
                  Generate Mockup <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === AppStep.GENERATING && (
            <div className="text-center py-12 space-y-8">
              <div className="relative inline-block">
                <div className="w-24 h-24 border-4 border-slate-100 border-t-red-500 rounded-full animate-spin"></div>
                <Loader2 className="w-10 h-10 text-red-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-slate-800">Generating Masterpiece...</h3>
                <p className="text-slate-500 animate-pulse font-medium">Analyzing branding, rendering 3D perspectives, and applying light maps.</p>
              </div>
              <div className="max-w-xs mx-auto space-y-2">
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 animate-[loading_3s_ease-in-out_infinite]"></div>
                </div>
                <p className="text-[10px] text-red-600 uppercase tracking-widest font-bold">Processing Street Scene</p>
              </div>
            </div>
          )}

          {step === AppStep.RESULT && resultImage && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center p-2 bg-emerald-100 text-emerald-600 rounded-full mb-4">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Mockup Ready!</h2>
                <p className="text-slate-500 mt-2">The visual asset for {formData.clientName} has been generated.</p>
              </div>
              
              <div className="rounded-2xl overflow-hidden shadow-2xl shadow-red-100 border border-slate-200">
                <img src={resultImage} alt="Final Mockup" className="w-full h-auto" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={handleDownload}
                  className="py-4 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> Download
                </button>
                <button 
                  onClick={handleShare}
                  className="py-4 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" /> Share with Client
                </button>
              </div>

              <button 
                onClick={() => {
                  setFormData(INITIAL_DATA);
                  setStep(AppStep.STREET_PHOTO);
                }}
                className="w-full py-4 text-slate-500 text-sm font-bold hover:text-red-600 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Start New Project
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="mt-8 text-center text-slate-400 text-sm font-medium">
        <p>&copy; 2024 Adreach Mock Up Studio. Powered by <span className="text-red-500">Gemini AI</span>.</p>
      </footer>

      <style>{`
        @keyframes loading {
          0% { width: 0%; left: 0; }
          50% { width: 100%; left: 0; }
          100% { width: 0%; left: 100%; }
        }
      `}</style>
    </div>
  );
}
