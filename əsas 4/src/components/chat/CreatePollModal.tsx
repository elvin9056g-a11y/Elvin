import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BarChart2, Plus, Trash2 } from 'lucide-react';

interface CreatePollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePoll: (question: string, options: string[]) => void;
  isDark?: boolean;
}

export const CreatePollModal: React.FC<CreatePollModalProps> = ({
  isOpen,
  onClose,
  onCreatePoll,
  isDark = true,
}) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);

  if (!isOpen) return null;

  const handleAddOption = () => {
    if (options.length < 8) {
      setOptions([...options, '']);
    }
  };

  const handleOptionChange = (idx: number, val: string) => {
    const updated = [...options];
    updated[idx] = val;
    setOptions(updated);
  };

  const handleRemoveOption = (idx: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== idx));
    }
  };

  const validOptions = options.map((o) => o.trim()).filter(Boolean);
  const isValid = question.trim().length > 0 && validOptions.length >= 2;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onCreatePoll(question.trim(), validOptions);
    setQuestion('');
    setOptions(['', '']);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.2 }}
          className={`w-full max-w-md rounded-3xl p-5 shadow-2xl border flex flex-col max-h-[88vh] overflow-hidden ${
            isDark
              ? 'bg-[#182229] border-white/15 text-white'
              : 'bg-white border-gray-200 text-gray-900'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10 dark:border-white/10 border-gray-200 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <BarChart2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold leading-tight">Səsvermə Yarat</h3>
                <p className="text-xs opacity-65">Qrup üçün interaktiv sorğu</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
            {/* Sual */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-500 dark:text-amber-400">
                Sualınız
              </label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Məs: Sabah görüş saat neçədə olsun?"
                className={`w-full p-3 rounded-2xl text-xs border focus:outline-none transition-all ${
                  isDark
                    ? 'bg-black/20 border-white/15 focus:border-amber-400 text-white'
                    : 'bg-gray-50 border-gray-300 focus:border-amber-500 text-gray-900'
                }`}
                autoFocus
              />
            </div>

            {/* Variantlar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-amber-500 dark:text-amber-400">
                  Variantlar ({options.length}/8)
                </label>
                {options.length < 8 && (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Variant əlavə et</span>
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-5 text-center text-xs font-bold opacity-50 shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`Variant ${idx + 1}`}
                      className={`flex-1 p-2.5 rounded-xl text-xs border focus:outline-none transition-all ${
                        isDark
                          ? 'bg-black/20 border-white/15 focus:border-amber-400 text-white'
                          : 'bg-gray-50 border-gray-300 focus:border-amber-500 text-gray-900'
                      }`}
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 cursor-pointer transition-colors shrink-0"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </form>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-white/10 dark:border-white/10 border-gray-200 shrink-0 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`py-2 px-4 rounded-xl text-xs font-semibold border cursor-pointer ${
                isDark
                  ? 'border-white/15 hover:bg-white/10 text-white/80'
                  : 'border-gray-300 hover:bg-gray-100 text-gray-700'
              }`}
            >
              Ləğv et
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isValid}
              className="py-2 px-5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-40 disabled:cursor-not-allowed text-white cursor-pointer shadow-md transition-all flex items-center gap-1.5"
            >
              <BarChart2 size={14} />
              <span>Göndər</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
