import { Link2, Sparkles, Syringe } from 'lucide-react';

interface TreatmentPlanProps {
  darkMode: boolean;
}

export function TreatmentPlan({ darkMode }: TreatmentPlanProps) {
  return (
    <div className={`rounded-xl border p-6 mt-6 ${
      darkMode 
        ? 'bg-gray-900 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`size-12 rounded-full flex items-center justify-center ${
            darkMode ? 'bg-teal-900/30' : 'bg-teal-100'
          }`}>
            <Link2 className={`size-6 ${darkMode ? 'text-teal-400' : 'text-teal-600'}`} />
          </div>
          <div>
            <h3 className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Treatment Plan</h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>AI-generated treatment recommendations</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-teal-400 hover:bg-teal-500 text-white rounded-lg text-sm font-medium transition-all">
          <Sparkles className="size-4" />
          Generate Treatment
        </button>
      </div>
      
      <div className="mt-8 flex flex-col items-center justify-center py-12 text-center">
        <div className={`size-20 rounded-2xl flex items-center justify-center mb-4 ${
          darkMode ? 'bg-teal-900/20' : 'bg-teal-50'
        }`}>
          <Syringe className={`size-10 ${darkMode ? 'text-teal-500' : 'text-teal-400'}`} />
        </div>
        <h4 className={`font-semibold mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>No Treatment Plan Yet</h4>
        <p className={`text-sm max-w-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Click "Generate Treatment" after recording the encounter to get AI-powered medication and treatment recommendations.
        </p>
      </div>
    </div>
  );
}