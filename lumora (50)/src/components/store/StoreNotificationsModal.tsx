import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Tag, Sparkles, Key, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export interface StoreNotification {
  id: string;
  title: string;
  message: string;
  type: 'discount' | 'new_product' | 'promo' | 'system';
  date: string;
  isRead?: boolean;
}

export const INITIAL_NOTIFICATIONS: StoreNotification[] = [
  {
    id: 'notif_1',
    title: '🔥 Xüsusi Endirim Kampaniyası Başladı!',
    message: 'Mobil tətbiqlər, sistem alətləri və ağıllı qadcetlərdə 40%-dək xüsusi endirimlər aktiv edildi.',
    type: 'discount',
    date: '10 dəqiqə əvvəl',
    isRead: false,
  },
  {
    id: 'notif_2',
    title: '🎁 Sizə Özəl Promo Kod: LUMORA20',
    message: 'Sifarişi rəsmiləşdirməzdən əvvəl LUMORA20 promo kodunu daxil edin və əlavə 20% endirim qazanın!',
    type: 'promo',
    date: '1 saat əvvəl',
    isRead: false,
  },
  {
    id: 'notif_3',
    title: '⚡ Yeni Rəqəmsal Lisenziyalar Əlavə Edildi',
    message: 'Desktop və mobil kateqoriyasına 2026-cı ilin ən son proqram təminatı və açarları əlavə olundu.',
    type: 'new_product',
    date: 'Dünən',
    isRead: true,
  },
  {
    id: 'notif_4',
    title: '🚀 Ani Rəqəmsal Yükləmə Aktivdir',
    message: 'Saytımızda fiziki çatdırılma yoxdur. Alış etdiyiniz anda proqramın yükləmə linki və rəsmi açarı dərhal sizə verilir.',
    type: 'system',
    date: '3 gün əvvəl',
    isRead: true,
  },
];

interface StoreNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: StoreNotification[];
  onMarkAllAsRead: () => void;
}

export const StoreNotificationsModal: React.FC<StoreNotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
}) => {
  const { isDark } = useTheme();

  if (!isOpen) return null;

  const renderIcon = (type: StoreNotification['type']) => {
    switch (type) {
      case 'discount':
        return <Tag size={16} className="text-rose-400" />;
      case 'promo':
        return <Sparkles size={16} className="text-amber-400" />;
      case 'new_product':
        return <Key size={16} className="text-cyan-400" />;
      default:
        return <CheckCircle2 size={16} className="text-emerald-400" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className={`relative w-full max-w-md max-h-[85vh] rounded-3xl border shadow-2xl overflow-hidden flex flex-col z-10 backdrop-blur-2xl ${
            isDark
              ? 'bg-[#12141c]/95 border-white/15 text-white'
              : 'bg-white/95 border-gray-200 text-gray-900'
          }`}
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-2xl bg-cyan-500/20 text-cyan-400">
                <Bell size={18} />
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold">
                  Mağaza Bildirişləri
                </h3>
                <p className="text-[11px] opacity-65">
                  Endirimlər, yeniliklər və rəqəmsal təkliflər
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* List */}
          <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-2.5">
            {notifications.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  item.isRead
                    ? isDark
                      ? 'bg-white/5 border-white/10 opacity-75'
                      : 'bg-gray-50 border-gray-200 opacity-80'
                    : isDark
                    ? 'bg-gradient-to-r from-cyan-950/40 to-slate-900/40 border-cyan-500/40'
                    : 'bg-cyan-50/70 border-cyan-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-xl border mt-0.5 shrink-0 ${
                      isDark
                        ? 'bg-black/30 border-white/10'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    {renderIcon(item.type)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold leading-tight">{item.title}</h4>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] opacity-80 leading-relaxed">
                      {item.message}
                    </p>
                    <span className="text-[9px] opacity-50 block pt-0.5">
                      {item.date}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-white/10 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={onMarkAllAsRead}
              className="text-cyan-400 hover:underline cursor-pointer"
            >
              Hamısını oxunmuş kimi qeyd et
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 font-bold cursor-pointer"
            >
              Bağla
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
