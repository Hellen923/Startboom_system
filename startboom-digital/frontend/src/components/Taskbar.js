import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Calendar,
  Plus,
  Menu,
  User,
  Download,
  ChevronDown,
  FileText,
  FileSpreadsheet,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getSearchConfig } from '../utils/roleConfig';
import { exportCurrentPage } from '../utils/pageExport';

const WhatsAppIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const formatMonthRange = (date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const monthName = date.toLocaleString('en-US', { month: 'short' });
  const pad = (n) => String(n).padStart(2, '0');
  return `${monthName} ${pad(1)} – ${monthName} ${pad(lastDay)}, ${year}`;
};

const IconButton = ({ icon: Icon, badge, onClick, title, isDark, active, children }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition ${
      active
        ? 'ring-2 ring-[var(--primary-color)] text-[var(--primary-color)]'
        : ''
    } ${
      isDark
        ? 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
    }`}
  >
    {children || (Icon && <Icon className="h-[18px] w-[18px]" />)}
    {badge > 0 && (
      <span
        className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
        style={{ backgroundColor: 'var(--primary-color)' }}
      >
        {badge > 99 ? '99+' : badge}
      </span>
    )}
  </button>
);

const Taskbar = ({
  onOpenNotifications,
  onOpenQuickActions,
  onOpenProfile,
  onMenuClick,
  unreadNotifications = 0,
  whatsappCount = 0,
}) => {
  const { user } = useAuth();
  const { theme, updateTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);
  const exportRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateLabel] = useState(() => formatMonthRange());
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const role = user?.role || 'agent';
  const searchConfig = getSearchConfig(role);
  const firstName = user?.name?.split(' ')[0] || 'there';
  const isDark = theme.mode === 'dark';

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const closeExport = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setExportOpen(false);
      }
    };
    document.addEventListener('mousedown', closeExport);
    return () => document.removeEventListener('mousedown', closeExport);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    navigate(searchConfig.path, { state: { search: query } });
    setSearchQuery('');
  };

  const handleExport = async (format) => {
    setExportOpen(false);
    try {
      setExporting(true);
      const count = await exportCurrentPage(format, { pathname: location.pathname, role });
      toast.success(`Exported ${count} record${count === 1 ? '' : 's'} as ${format.toUpperCase()}`);
    } catch (err) {
      console.error(err);
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const calendarPath = role === 'agent' ? '/agent/schedules' : role === 'superadmin' ? '/superadmin' : '/admin/reports';
  const whatsappPath = role === 'agent' ? '/agent/clients' : '/admin/users';

  return (
    <div className={`sticky top-0 z-30 -mx-3 sm:-mx-4 md:-mx-6 lg:-mx-8 px-3 sm:px-4 md:px-6 lg:px-8 pt-3 sm:pt-4 pb-3 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div
        className={`rounded-2xl shadow-sm px-3 sm:px-4 py-3 ${
          isDark ? 'bg-[#0f172a] border border-slate-700/50 shadow-lg' : 'bg-white border border-gray-200'
        }`}
      >
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-4">
          <div className="flex items-center gap-3 min-w-0 shrink-0">
            <button
              type="button"
              onClick={onMenuClick}
              className={`lg:hidden flex h-10 w-10 items-center justify-center rounded-xl transition ${
                isDark
                  ? 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <p className={`text-sm sm:text-base font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Welcome back, {firstName}
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex-1 min-w-0">
            <div className="relative flex items-center">
              <Search className={`absolute left-3.5 h-4 w-4 pointer-events-none ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchConfig.placeholder}
                className={`w-full rounded-xl py-2.5 pl-10 pr-20 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-ring)] ${
                  isDark
                    ? 'bg-slate-800/80 border border-slate-700/60 text-gray-200 placeholder-gray-500'
                    : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400'
                }`}
              />
              <kbd
                className={`hidden sm:inline-flex absolute right-3 items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                  isDark ? 'border border-slate-600 bg-slate-900/60 text-gray-500' : 'border border-gray-200 bg-white text-gray-400'
                }`}
              >
                Ctrl+K
              </kbd>
            </div>
          </form>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap xl:flex-nowrap shrink-0">
            <IconButton icon={Bell} badge={unreadNotifications} onClick={onOpenNotifications} title="Notifications" isDark={isDark} />

            <IconButton
              onClick={() => navigate(whatsappPath, { state: { channel: 'whatsapp' } })}
              title="WhatsApp follow-ups"
              isDark={isDark}
              badge={whatsappCount}
            >
              <WhatsAppIcon className="h-[18px] w-[18px] text-green-500" />
            </IconButton>

            <IconButton
              icon={Sun}
              onClick={() => updateTheme({ mode: 'light' })}
              title="Light mode"
              isDark={isDark}
              active={!isDark}
            />
            <IconButton
              icon={Moon}
              onClick={() => updateTheme({ mode: 'dark' })}
              title="Dark mode"
              isDark={isDark}
              active={isDark}
            />

            <div className="relative" ref={exportRef}>
              <button
                type="button"
                onClick={() => setExportOpen((v) => !v)}
                disabled={exporting}
                title="Export"
                className={`flex h-10 items-center gap-1 rounded-xl px-2.5 transition ${
                  isDark
                    ? 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                <Download className="h-[18px] w-[18px]" />
                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              </button>
              {exportOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-xl border border-gray-200 bg-white shadow-lg py-1 z-50">
                  <button
                    type="button"
                    onClick={() => handleExport('csv')}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                    Export as CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport('pdf')}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <FileText className="h-4 w-4 text-red-600" />
                    Export as PDF
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => navigate(calendarPath)}
              title="Calendar"
              className={`hidden md:inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs sm:text-sm transition whitespace-nowrap ${
                isDark
                  ? 'bg-slate-800/80 border border-slate-700/60 text-gray-300 hover:bg-slate-700/60'
                  : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Calendar className="h-4 w-4 shrink-0 opacity-70" />
              <span>{dateLabel}</span>
            </button>

            <button
              type="button"
              onClick={onOpenQuickActions}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition whitespace-nowrap hover:opacity-90"
              style={{ backgroundColor: 'var(--primary-color)' }}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add New</span>
            </button>

            <IconButton icon={User} onClick={onOpenProfile} title="View profile" isDark={isDark} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Taskbar;
