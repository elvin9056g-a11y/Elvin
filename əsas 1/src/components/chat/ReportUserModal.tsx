import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, X, Check, AlertTriangle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { Language } from '../../types';
import { submitReportToDb } from '../../lib/supabase';

export interface ReportOption {
  id: string;
  title: string;
  description: string;
}

const REPORT_REASONS_I18N: Record<Language, ReportOption[]> = {
  az: [
    {
      id: 'spam',
      title: 'Spam və ya arzuolunmaz reklam',
      description: 'Reklam xarakterli, kütləvi və ya bezdirici mesajlar',
    },
    {
      id: 'harassment',
      title: 'Təhqir, hədə-qorxu və ya təqib',
      description: 'Nalayiqlik, təhqiramiz ifadələr və ya aqressiv davranış',
    },
    {
      id: 'fake',
      title: 'Saxta profil və ya təqlid',
      description: 'Başqasının adından istifadə və ya saxta şəxsiyyət yaratma',
    },
    {
      id: 'inappropriate',
      title: 'Uyğunsuz və ya zərərli məzmun',
      description: 'Etik normalara zidd, narahatlıq doğuran və ya zərərli paylaşımlar',
    },
    {
      id: 'scam',
      title: 'Fırıldaqçılıq və ya aldatma',
      description: 'Maliyyə tələbi, şübhəli keçidlər və ya dələduzluq cəhdi',
    },
    {
      id: 'other',
      title: 'Digər səbəb',
      description: 'Yuxarıdakı kateqoriyalara aid olmayan başqa problem',
    },
  ],
  en: [
    {
      id: 'spam',
      title: 'Spam or unwanted advertising',
      description: 'Commercial, bulk, or harassing messages',
    },
    {
      id: 'harassment',
      title: 'Harassment or intimidation',
      description: 'Inappropriate language, offensive remarks, or aggression',
    },
    {
      id: 'fake',
      title: 'Fake profile or impersonation',
      description: 'Using someone else\'s name or pretending to be another person',
    },
    {
      id: 'inappropriate',
      title: 'Inappropriate or harmful content',
      description: 'Unethical, disturbing, or dangerous materials',
    },
    {
      id: 'scam',
      title: 'Scam or fraud attempt',
      description: 'Financial requests, phishing links, or suspicious fraud',
    },
    {
      id: 'other',
      title: 'Other reason',
      description: 'Any other issue not covered by the categories above',
    },
  ],
  ru: [
    {
      id: 'spam',
      title: 'Спам или реклама',
      description: 'Реклама, массовые или навязчивые сообщения',
    },
    {
      id: 'harassment',
      title: 'Оскорбления или преследование',
      description: 'Ненормативная лексика, угрозы или агрессия',
    },
    {
      id: 'fake',
      title: 'Фейковый профиль или выдача за другого',
      description: 'Использование чужого имени или данных',
    },
    {
      id: 'inappropriate',
      title: 'Неприемлемый или вредоносный контент',
      description: 'Нарушение этических норм или опасный контент',
    },
    {
      id: 'scam',
      title: 'Мошенничество или обман',
      description: 'Вымогательство, подозрительные ссылки или фишинг',
    },
    {
      id: 'other',
      title: 'Другая причина',
      description: 'Любая другая проблема, не указанная выше',
    },
  ],
  tr: [
    {
      id: 'spam',
      title: 'Spam veya istenmeyen reklam',
      description: 'Reklam amaçlı, toplu veya rahatsız edici mesajlar',
    },
    {
      id: 'harassment',
      title: 'Hakaret veya taciz',
      description: 'Küfürlü ifadeler, tehdit veya saldırgan tavır',
    },
    {
      id: 'fake',
      title: 'Sahte profil veya taklit',
      description: 'Başkası gibi davranma veya sahte hesap açma',
    },
    {
      id: 'inappropriate',
      title: 'Uygunsuz veya zararlı içerik',
      description: 'Ahlaka aykırı, rahatsız edici veya tehlikeli paylaşımlar',
    },
    {
      id: 'scam',
      title: 'Dolandırıcılık veya sahtekarlık',
      description: 'Para talebi, şüpheli linkler veya sahtekarlık girişimi',
    },
    {
      id: 'other',
      title: 'Diğer sebep',
      description: 'Yukarıdaki kategorilere uymayan başka bir sorun',
    },
  ],
};

const REPORT_LABELS = {
  az: {
    modalTitle: 'İstifadəçini şikayət et',
    reasonPrompt: 'Nə üçün şikayət edirsiniz?',
    notesLabel: 'Əlavə qeyd və ya izahat (istəyə bağlı):',
    notesPlaceholder: 'Baş verən hal barədə qısa məlumat yazın...',
    blockTitle: 'Bu istifadəçini blokla',
    blockDesc: 'Artıq sizə mesaj göndərə və zəng edə bilməyəcək',
    cancel: 'Ləğv et',
    submit: 'Şikayət et',
    submitting: 'Göndərilir...',
  },
  en: {
    modalTitle: 'Report User',
    reasonPrompt: 'Why are you reporting this user?',
    notesLabel: 'Additional notes or explanation (optional):',
    notesPlaceholder: 'Provide brief details about what happened...',
    blockTitle: 'Block this user',
    blockDesc: 'They will no longer be able to message or call you',
    cancel: 'Cancel',
    submit: 'Submit Report',
    submitting: 'Submitting...',
  },
  ru: {
    modalTitle: 'Пожаловаться на пользователя',
    reasonPrompt: 'По какой причине вы жалуетесь?',
    notesLabel: 'Дополнительное примечание (необязательно):',
    notesPlaceholder: 'Кратко опишите произошедшее...',
    blockTitle: 'Заблокировать пользователя',
    blockDesc: 'Он больше не сможет писать вам или звонить',
    cancel: 'Отмена',
    submit: 'Пожаловаться',
    submitting: 'Отправка...',
  },
  tr: {
    modalTitle: 'Kullanıcıyı Şikayet Et',
    reasonPrompt: 'Neden şikayet ediyorsunuz?',
    notesLabel: 'Ek açıklama (isteğe bağlı):',
    notesPlaceholder: 'Durum hakkında kısa bilgi yazın...',
    blockTitle: 'Bu kullanıcıyı engelle',
    blockDesc: 'Artık size mesaj gönderemez ve arayamaz',
    cancel: 'İptal',
    submit: 'Şikayet Et',
    submitting: 'Gönderiliyor...',
  },
};

interface ReportUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  reporterId?: string;
  reportedUserId?: string;
  onSubmitReport?: (reason: string, details: string, blockUser: boolean) => void;
  onReport?: (reason: string, details: string, blockUser: boolean) => void;
  isDark?: boolean;
  currentLanguage?: Language;
}

export const ReportUserModal: React.FC<ReportUserModalProps> = ({
  isOpen,
  onClose,
  userName,
  reporterId,
  reportedUserId,
  onSubmitReport,
  onReport,
  isDark: propIsDark,
  currentLanguage = 'az',
}) => {
  const { isDark: themeIsDark } = useTheme();
  const isDark = propIsDark !== undefined ? propIsDark : themeIsDark;
  const [selectedReason, setSelectedReason] = useState<string>('spam');
  const [details, setDetails] = useState<string>('');
  const [blockUser, setBlockUser] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loc = REPORT_LABELS[currentLanguage] || REPORT_LABELS.az;
  const reasons = REPORT_REASONS_I18N[currentLanguage] || REPORT_REASONS_I18N.az;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) return;

    setIsSubmitting(true);
    const reasonObj = reasons.find((r) => r.id === selectedReason);
    const finalReason = reasonObj ? reasonObj.title : selectedReason;

    if (reporterId && reportedUserId) {
      try {
        await submitReportToDb({
          reporter_id: reporterId,
          reported_user_id: reportedUserId,
          reason: finalReason,
          details: details.trim(),
        });
      } catch (err) {
        console.warn('submitReport error:', err);
      }
    }

    const callback = onReport || onSubmitReport;
    if (callback) {
      callback(finalReason, details, blockUser);
    }
    setIsSubmitting(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.2 }}
          className={`w-full max-w-md rounded-3xl p-5 shadow-2xl border flex flex-col max-h-[90vh] overflow-hidden ${
            isDark ? 'bg-[#182229] border-white/15 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10 dark:border-white/10 border-gray-200 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-500 flex items-center justify-center shrink-0">
                <ShieldAlert size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold leading-tight">{loc.modalTitle}</h3>
                <p className="text-xs opacity-60 truncate max-w-[240px]">
                  {userName}
                </p>
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

          {/* Body Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-red-400">
                {loc.reasonPrompt}
              </label>

              <div className="space-y-1.5">
                {reasons.map((reason) => {
                  const isSelected = selectedReason === reason.id;
                  return (
                    <div
                      key={reason.id}
                      onClick={() => setSelectedReason(reason.id)}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                        isSelected
                          ? isDark
                            ? 'bg-red-500/15 border-red-500/50 shadow-sm'
                            : 'bg-red-50 border-red-400 shadow-sm'
                          : isDark
                          ? 'bg-white/5 border-white/10 hover:bg-white/10'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'border-red-500 bg-red-500 text-white'
                            : 'border-gray-400 opacity-60'
                        }`}
                      >
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-bold leading-tight ${isSelected ? 'text-red-500 dark:text-red-400' : ''}`}>
                          {reason.title}
                        </div>
                        <div className="text-[11px] opacity-70 leading-normal mt-0.5">
                          {reason.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Optional Details */}
            <div>
              <label className="block text-xs font-semibold mb-1 opacity-80">
                {loc.notesLabel}
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={loc.notesPlaceholder}
                rows={3}
                className={`w-full p-3 rounded-2xl text-xs border focus:outline-none transition-all resize-none ${
                  isDark
                    ? 'bg-white/5 border-white/15 focus:border-red-500/50 placeholder-white/40'
                    : 'bg-gray-50 border-gray-300 focus:border-red-500 placeholder-gray-400'
                }`}
              />
            </div>

            {/* Block Checkbox */}
            <div
              onClick={() => setBlockUser(!blockUser)}
              className={`p-3 rounded-2xl border flex items-center gap-3 cursor-pointer select-none transition-colors ${
                blockUser
                  ? isDark
                    ? 'bg-red-500/10 border-red-500/30 text-red-300'
                    : 'bg-red-50 border-red-300 text-red-900'
                  : isDark
                  ? 'bg-white/5 border-white/10'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <input
                type="checkbox"
                checked={blockUser}
                onChange={(e) => setBlockUser(e.target.checked)}
                className="w-4 h-4 rounded text-red-600 focus:ring-red-500 cursor-pointer accent-red-600"
              />
              <div className="text-xs leading-tight">
                <span className="font-bold">{loc.blockTitle}</span>
                <span className="opacity-75 block text-[11px] mt-0.5">
                  {loc.blockDesc}
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold border cursor-pointer transition-colors ${
                  isDark
                    ? 'border-white/15 hover:bg-white/10 text-white/80'
                    : 'border-gray-300 hover:bg-gray-100 text-gray-700'
                }`}
              >
                {loc.cancel}
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 active:bg-red-800 text-white cursor-pointer shadow-md transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <AlertTriangle size={15} />
                <span>{isSubmitting ? loc.submitting : loc.submit}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
