import React, { useState, useMemo } from 'react';
import { Search, Delete, Smile, Heart, Flame, Sparkles, Coffee, Plane, Trophy, Lightbulb, Hash, Flag } from 'lucide-react';

interface WhatsAppEmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onBackspace?: () => void;
  isDark: boolean;
}

interface EmojiCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  emojis: string[];
}

export const WhatsAppEmojiPicker: React.FC<WhatsAppEmojiPickerProps> = ({
  onSelectEmoji,
  onBackspace,
  isDark,
}) => {
  const [activeTab, setActiveTab] = useState('smileys');
  const [search, setSearch] = useState('');

  const categories: EmojiCategory[] = useMemo(
    () => [
      {
        id: 'smileys',
        name: 'Təbəssümlər və İnsanlar',
        icon: <Smile size={18} />,
        emojis: [
          '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🥹', '😊',
          '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙',
          '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎',
          '🥸', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁',
          '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😮‍💨', '😤',
          '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰',
          '😥', '😓', '🤗', '🤔', '🫣', '🤭', '🫢', '🫡', '🤫', '🫠',
          '🤥', '😶', '😐', '😑', '😬', '🫨', '😯', '😦', '😧', '😮',
          '😲', '🥱', '😴', '🤤', '😪', '😵', '😵‍💫', '🤐', '🥴', '🤢',
          '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹',
          '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃',
          '👋', '🤚', '🖐️', '✋', '🖖', '🫱', '🫲', '🫸', '🫷', '👌',
          '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉',
          '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜',
          '👏', '🙌', '🫶', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳',
          '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀',
          '🫁', '👀', '👁️', '👅', '👄', '🫦', '💋', '👶', '🧒', '👦',
          '👧', '🧑', '👱', '👨', '🧔', '👩', '🧓', '👴', '👵', '🙍',
          '🙎', '🙅', '🙆', '💁', '🙋', '🧏', '🙇', '🤦', '🤷', '👮',
          '🕵️', '💂', '🥷', '👷', '🤴', '👸', '👳', '👲', '🧕', '🤵',
          '👰', '🤰', '🤱', '👼', '🎅', '🤶', '🦸', '🦹', '🧙', '🧚',
          '🧛', '🧜', '🧝', '🧞', '🧟', '💆', '💇', '🚶', '🧍', '🧎',
          '🏃', '💃', '🕺', '🕴️', '👯', '🧖', '🧗',
        ],
      },
      {
        id: 'animals',
        name: 'Heyvanlar və Təbiət',
        icon: <Sparkles size={18} />,
        emojis: [
          '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨',
          '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊',
          '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉',
          '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌',
          '🐞', '🐜', '🪰', '🪲', '🪳', '🦟', '🦗', '🕷️', '🕸️', '🦂',
          '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀',
          '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🦭', '🐊', '🐅',
          '🐆', '🦓', '🦍', '🦧', '🦣', '🐘', '🦛', '🦏', '🐪', '🐫',
          '🦒', '🦘', '🦬', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑',
          '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🐓',
          '🌲', '🌳', '🌴', '🪵', '🌱', '🌿', '☘️', '🍀', '🎍', '🪴',
          '🍃', '🍂', '🍁', '🍄', '🐚', '🪨', '🌾', '💐', '🌷', '🌹',
          '🥀', '🌺', '🌸', '🌼', '🌻', '🌞', '🌝', '🌛', '🌜', '🌚',
          '🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '🌓', '🌔', '🌙', '🌎',
          '🌍', '🌏', '🪐', '💫', '⭐', '🌟', '✨', '⚡', '☄️', '💥',
          '🔥', '🌪️', '🌈', '☀️', '🌤️', '⛅', '🌥️', '☁️', '🌦️', '🌧️',
        ],
      },
      {
        id: 'food',
        name: 'Yemək və İçki',
        icon: <Coffee size={18} />,
        emojis: [
          '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐',
          '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑',
          '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅',
          '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳',
          '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔',
          '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗',
          '🥘', '🫕', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟',
          '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🍢', '🍡', '🍧',
          '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫',
          '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '🫖', '☕',
          '🍵', '🧃', '🥤', '🧋', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃',
          '🍸', '🍹', '🧉', '🍾', '🧊', '🥄', '🍴', '🍽️', '🥢', '🧂',
        ],
      },
      {
        id: 'activities',
        name: 'Fəaliyyət və İdman',
        icon: <Trophy size={18} />,
        emojis: [
          '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
          '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳',
          '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷',
          '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '🤺',
          '🧗', '🏌️', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗‍♂️', '🚴',
          '🚵', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '🎫',
          '🎟️', '🎪', '🤹', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹',
          '🥁', '🪘', '🎷', '🎺', '🪗', '🎸', '🪕', '🎻', '🎲', '♟️',
          '🎯', '🎳', '🎮', '🎰', '🧩', '🪅', '🪄', '🔮', '🧸', '🪆',
        ],
      },
      {
        id: 'travel',
        name: 'Səyahət və Nəqliyyat',
        icon: <Plane size={18} />,
        emojis: [
          '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐',
          '🛻', '🚚', '🚛', '🚜', '🛵', '🏍️', '🛺', '🚲', '🛴', '🚏',
          '🛣️', '🛤️', '🛢️', '⛽', '🚨', '🚥', '🚦', '🛑', '🚧', '⚓',
          '⛵', '🛶', '🚤', '🛳️', '⛴️', '🛥️', '🚢', '✈️', '🛩️', '🛫',
          '🛬', '🪂', '💺', '🚁', '🚟', '🚠', '🚡', '🛰️', '🚀', '🛸',
          '🪐', '🌠', '🌌', '⛱️', '🎆', '🎇', '🎑', '🗾', '🗿', '🗽',
          '🗼', '🏰', '🏯', '🏟️', '🎡', '🎢', '🎠', '⛲', '🏖️', '🏝️',
        ],
      },
      {
        id: 'objects',
        name: 'Əşyalar və Texnologiya',
        icon: <Lightbulb size={18} />,
        emojis: [
          '⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️',
          '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥',
          '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️',
          '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋',
          '🪫', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵',
          '💴', '💶', '💷', '🪙', '💰', '💳', '💎', '⚖️', '🪜', '🧰',
          '🪛', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🪓', '🔩', '⚙️', '🧱',
          '⛓️', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡️', '⚔️', '🛡️',
          '🚬', '⚰️', '🪦', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '🧲',
          '🧪', '🧫', '🧬', '🔬', '🔭', '📡', '💉', '🩸', '💊', '🩹',
          '🩺', '🚪', '🛗', '🪞', '🪟', '🛏️', '🛋️', '🪑', '🚽', '🪠',
          '🚿', '🛁', '🪤', '🪒', '🧴', '🧷', '🧹', '🧺', '🧻', '🪣',
          '🧼', '🫧', '🪥', '🧽', '🧯', '🛒', '🔑', '🗝️', '🔐', '🔏',
          '🔒', '🔓', '📦', '📫', '📬', '📭', '📮', '🏷️', '✉️', '📧',
          '📩', '📨', '📤', '📥', '📃', '📄', '📑', '🧾', '📊', '📈',
          '📉', '🗒️', '🗓️', '📆', '📅', '🗑️', '🪪', '📇', '📁', '📂',
          '🗂️', '🗞️', '📰', '📓', '📕', '📗', '📘', '📙', '📚', '📖',
          '🔖', '🧷', '🔗', '📎', '🖇️', '📐', '📏', '🧮', '📌', '📍',
          '✂️', '🖊️', '🖋️', '✒️', '🖌️', '🖍️', '📝', '✏️', '🔍', '🔎',
        ],
      },
      {
        id: 'symbols',
        name: 'Simvollar və Ürəklər',
        icon: <Heart size={18} />,
        emojis: [
          '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '🩶',
          '🩷', '🩵', '💔', '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓', '💗',
          '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️',
          '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋',
          '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️',
          '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️',
          '✴️', '🐕', '📶', '🈹', '🈲', '🔞', '📵', '🚫', '🚳', '🚭',
          '🚯', '🚱', '🚷', '🫸', '🫷', '🚳', '⛔', '📛', '🚫', '❌',
          '⭕', '🛑', '⛔', '📛', '♨️', '💯', '💢', '♨️', '🚷', '🚯',
          '🚳', '🚱', '🔞', '📵', '🚭', '❗️', '❕', '❓', '❔', '‼️',
          '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️',
          '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀',
          '💤', '🏧', '🚾', '♿', '🅿️', '🈳', '🈂️', '🛂', '🛃', '🛄',
          '🛅', '🚹', '🚺', '🚼', '⚧️', '🚻', '🚮', '🎦', '📶', '🈹',
          '🈲', '🈳', '🈴', '🈵', '🈶', '🈚', '🈸', '🈺', '🈷️', '▶️',
          '⏸️', '⏹️', '⏺️', '⏭️', '⏮️', '⏩', '⏪', '🔀', '🔁', '🔂',
          '🔄', '🔃', '🎵', '🎶', '➕', '➖', '➗', '✖️', '♾️', '💲',
        ],
      },
      {
        id: 'flags',
        name: 'Bayraqlar',
        icon: <Flag size={18} />,
        emojis: [
          '🇦🇿', '🇹🇷', '🇺🇸', '🇬🇧', '🇩🇪', '🇫🇷', '🇮🇹', '🇪🇸', '🇷🇺', '🇺🇦',
          '🇬🇪', '🇮🇷', '🇰🇿', '🇺🇿', '🇹🇲', '🇰🇬', '🇵🇰', '🇸🇦', '🇦🇪', '🇶🇦',
          '🇯🇵', '🇰🇷', '🇨🇳', '🇮🇳', '🇧🇷', '🇦🇷', '🇨🇦', '🇦🇺', '🇪🇺', '🇺🇳',
          '🏳️', '🏴', '🏁', '🚩', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️',
        ],
      },
    ],
    []
  );

  // Filter emojis if searching
  const displayedEmojis = useMemo(() => {
    if (!search.trim()) {
      const active = categories.find((c) => c.id === activeTab);
      return active ? active.emojis : categories[0].emojis;
    }
    const query = search.trim().toLowerCase();
    const all = categories.flatMap((c) => c.emojis);
    return all.filter((em) => em.includes(query));
  }, [search, activeTab, categories]);

  return (
    <div
      className={`w-full flex flex-col border-t select-none transition-colors h-[280px] z-30 ${
        isDark ? 'bg-[#1f2c34] border-white/10 text-white' : 'bg-[#f0f2f5] border-gray-300 text-gray-900'
      }`}
    >
      {/* Search Input */}
      <div className="px-3 pt-2 pb-1.5 flex items-center gap-2">
        <div
          className={`flex-1 flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs ${
            isDark ? 'bg-white/5 border-white/15' : 'bg-white border-gray-300'
          }`}
        >
          <Search size={14} className="opacity-50 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Smaylik axtar..."
            className="w-full bg-transparent focus:outline-none text-xs placeholder-gray-400"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="text-xs opacity-60 hover:opacity-100"
            >
              ✕
            </button>
          )}
        </div>

        {onBackspace && (
          <button
            type="button"
            onClick={onBackspace}
            className={`p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer transition-colors ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}
            title="Sil"
          >
            <Delete size={17} />
          </button>
        )}
      </div>

      {/* Emoji Grid Container */}
      <div
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif',
        }}
        className="flex-1 overflow-y-auto px-3 py-1 no-scrollbar"
      >
        {!search && (
          <div className="text-[11px] font-semibold opacity-60 mb-1.5">
            {categories.find((c) => c.id === activeTab)?.name}
          </div>
        )}
        <div className="grid grid-cols-8 sm:grid-cols-10 gap-1 text-center">
          {displayedEmojis.map((emoji, idx) => (
            <button
              key={`${emoji}-${idx}`}
              type="button"
              onClick={() => onSelectEmoji(emoji)}
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif',
              }}
              className="h-10 w-10 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 rounded-xl transition-all hover:scale-110 active:scale-95 cursor-pointer text-[26px] leading-none select-none border-none outline-none shadow-none"
            >
              {emoji}
            </button>
          ))}
        </div>
        {displayedEmojis.length === 0 && (
          <div className="py-8 text-center text-xs opacity-50">
            Smaylik tapılmadı
          </div>
        )}
      </div>

      {/* WhatsApp Bottom Category Bar */}
      <div
        className={`px-2 py-1.5 flex items-center justify-around border-t ${
          isDark ? 'border-white/10 bg-[#121b22]' : 'border-gray-300 bg-[#e9edef]'
        }`}
      >
        {categories.map((cat) => {
          const isActive = activeTab === cat.id && !search;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setSearch('');
                setActiveTab(cat.id);
              }}
              className={`p-2 rounded-full cursor-pointer transition-all ${
                isActive
                  ? 'text-emerald-500 bg-emerald-500/15'
                  : 'opacity-50 hover:opacity-100 text-gray-500 dark:text-gray-400'
              }`}
              title={cat.name}
            >
              {cat.icon}
            </button>
          );
        })}
      </div>
    </div>
  );
};
