import React, { useState } from 'react';
import { Check, CheckCheck, Info, X } from 'lucide-react';
import { Language } from '../../types';

export type MessageStatus = 'sent' | 'delivered' | 'read';

interface MessageStatusIndicatorProps {
  status?: MessageStatus;
  size?: number;
  className?: string;
  showTooltip?: boolean;
  onOpenStatusInfo?: () => void;
  currentLanguage?: Language;
}

export const STATUS_DESCRIPTIONS_I18N: Record<
  Language,
  Record<MessageStatus, { label: string; description: string; color: string }>
> = {
  az: {
    sent: {
      label: 'Göndərildi (Oflayn)',
      description: 'Qarşı tərəfə mesaj göndərildi ama qarşı tərəf saytda deyil yəni online deyil',
      color: 'text-gray-400 dark:text-gray-400',
    },
    delivered: {
      label: 'Çatdırıldı (Onlayn)',
      description: 'Qarşı tərəf artıq sayta daxil olub',
      color: 'text-gray-500 dark:text-gray-300',
    },
    read: {
      label: 'Oxundu',
      description: 'Qarşı tərəf artıq mesaja baxdı',
      color: 'text-[#2196f3] dark:text-[#38bdf8]',
    },
  },
  en: {
    sent: {
      label: 'Sent (Offline)',
      description: 'Message was sent, but the recipient is currently offline',
      color: 'text-gray-400 dark:text-gray-400',
    },
    delivered: {
      label: 'Delivered (Online)',
      description: 'The recipient is now online and received the message',
      color: 'text-gray-500 dark:text-gray-300',
    },
    read: {
      label: 'Read',
      description: 'The recipient has opened and read the message',
      color: 'text-[#2196f3] dark:text-[#38bdf8]',
    },
  },
  ru: {
    sent: {
      label: 'Отправлено (Офлайн)',
      description: 'Сообщение отправлено, но собеседник не в сети',
      color: 'text-gray-400 dark:text-gray-400',
    },
    delivered: {
      label: 'Доставлено (Онлайн)',
      description: 'Собеседник вошел на сайт и получил сообщение',
      color: 'text-gray-500 dark:text-gray-300',
    },
    read: {
      label: 'Прочитано',
      description: 'Собеседник прочитал ваше сообщение',
      color: 'text-[#2196f3] dark:text-[#38bdf8]',
    },
  },
  tr: {
    sent: {
      label: 'Gönderildi (Çevrimdışı)',
      description: 'Mesaj iletildi ancak alıcı henüz çevrimdışı',
      color: 'text-gray-400 dark:text-gray-400',
    },
    delivered: {
      label: 'Teslim Edildi (Çevrimiçi)',
      description: 'Alıcı siteye giriş yaptı ve mesaj teslim edildi',
      color: 'text-gray-500 dark:text-gray-300',
    },
    read: {
      label: 'Okundu',
      description: 'Alıcı mesajı görüntüledi ve okudu',
      color: 'text-[#2196f3] dark:text-[#38bdf8]',
    },
  },
};

export const STATUS_DESCRIPTIONS = STATUS_DESCRIPTIONS_I18N.az;

export const MessageStatusIndicator: React.FC<MessageStatusIndicatorProps> = ({
  status = 'sent',
  size = 14,
  className = '',
  showTooltip = true,
  onOpenStatusInfo,
  currentLanguage = 'az',
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const langDict = STATUS_DESCRIPTIONS_I18N[currentLanguage] || STATUS_DESCRIPTIONS_I18N.az;
  const statusInfo = langDict[status];

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenStatusInfo) {
      onOpenStatusInfo();
    } else {
      setIsPopoverOpen((prev) => !prev);
    }
  };

  const renderIcon = () => {
    switch (status) {
      case 'read':
        return (
          <CheckCheck
            size={size}
            className={`text-[#2196f3] dark:text-[#38bdf8] stroke-[2.6] ${className}`}
          />
        );
      case 'delivered':
        return (
          <CheckCheck
            size={size}
            className={`text-gray-400 dark:text-gray-300 stroke-[2.2] ${className}`}
          />
        );
      case 'sent':
      default:
        return (
          <Check
            size={size}
            className={`text-gray-400 dark:text-gray-300 stroke-[2.2] ${className}`}
          />
        );
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleClick}
        title={statusInfo.description}
        className="inline-flex items-center cursor-pointer transition-transform hover:scale-110 focus:outline-none"
        aria-label={statusInfo.description}
      >
        {renderIcon()}
      </button>

      {/* Popover explaining the exact status if toggled */}
      {isPopoverOpen && showTooltip && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-6 right-0 z-50 w-64 p-3 rounded-2xl shadow-xl border text-left text-xs backdrop-blur-md transition-all bg-white/95 dark:bg-[#1f2c34]/95 border-gray-200 dark:border-white/15 text-gray-900 dark:text-white"
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-black/5 dark:border-white/10 mb-1.5">
            <span className="font-bold text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Info size={12} /> Mesaj Statusu
            </span>
            <button
              type="button"
              onClick={() => setIsPopoverOpen(false)}
              className="opacity-60 hover:opacity-100 p-0.5 rounded"
            >
              <X size={12} />
            </button>
          </div>

          <div className="flex items-start gap-2 pt-0.5">
            <div className="shrink-0 mt-0.5">{renderIcon()}</div>
            <p className="text-[12px] leading-snug font-medium text-gray-800 dark:text-gray-100">
              {statusInfo.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Full Status Legend Modal/Dialog component for chat header or info button
export const MessageStatusLegendModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
  currentLanguage?: Language;
}> = ({ isOpen, onClose, isDark, currentLanguage = 'az' }) => {
  if (!isOpen) return null;

  const langDict = STATUS_DESCRIPTIONS_I18N[currentLanguage] || STATUS_DESCRIPTIONS_I18N.az;
  const modalLabels = {
    az: {
      title: 'Mesaj Statusları və Reaksiyalar',
      subtitle: 'Qarşı tərəfin reaksiya və aktivlik göstəriciləri',
      close: 'Bağla',
    },
    en: {
      title: 'Message Statuses & Indicators',
      subtitle: 'Recipient delivery and reading indicators',
      close: 'Close',
    },
    ru: {
      title: 'Статусы сообщений',
      subtitle: 'Индикаторы доставки и прочтения собеседником',
      close: 'Закрыть',
    },
    tr: {
      title: 'Mesaj Durumları ve Göstergeleri',
      subtitle: 'Alıcının teslimat ve okuma göstergeleri',
      close: 'Kapat',
    },
  }[currentLanguage] || {
    title: 'Mesaj Statusları və Reaksiyalar',
    subtitle: 'Qarşı tərəfin reaksiya və aktivlik göstəriciləri',
    close: 'Bağla',
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-sm rounded-3xl p-5 shadow-2xl border transition-all ${
          isDark
            ? 'bg-[#1e242d] border-white/15 text-white'
            : 'bg-white border-gray-200 text-gray-900'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
          <div>
            <h3 className="font-bold text-base">{modalLabels.title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {modalLabels.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-500"
          >
            <X size={18} />
          </button>
        </div>

        <div className="py-4 space-y-4">
          {/* Row 1: Sent (Offline) */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-black/5 dark:bg-white/5">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700/60 flex items-center justify-center shrink-0">
              <Check size={18} className="text-gray-500 dark:text-gray-300 stroke-[2.2]" />
            </div>
            <div className="flex-1">
              <p className="text-xs leading-relaxed font-medium">
                {langDict.sent.description}
              </p>
            </div>
          </div>

          {/* Row 2: Delivered (Online) */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-black/5 dark:bg-white/5">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700/60 flex items-center justify-center shrink-0">
              <CheckCheck
                size={18}
                className="text-gray-500 dark:text-gray-300 stroke-[2.2]"
              />
            </div>
            <div className="flex-1">
              <p className="text-xs leading-relaxed font-medium">
                {langDict.delivered.description}
              </p>
            </div>
          </div>

          {/* Row 3: Read (Seen) */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/40">
            <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/60 flex items-center justify-center shrink-0">
              <CheckCheck
                size={18}
                className="text-[#2196f3] dark:text-[#38bdf8] stroke-[2.6]"
              />
            </div>
            <div className="flex-1">
              <p className="text-xs leading-relaxed font-semibold text-sky-950 dark:text-sky-200">
                {langDict.read.description}
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-semibold text-white text-xs transition-colors shadow-sm cursor-pointer"
          >
            {modalLabels.close}
          </button>
        </div>
      </div>
    </div>
  );
};
