/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Trash2, 
  Edit2, 
  UserPlus, 
  X,
  ChevronRight,
  Circle,
  Menu,
  Sun,
  Moon,
  Camera,
  Image as ImageIcon,
  MessageSquare,
  Phone,
  Link as LinkIcon,
  ExternalLink,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { io } from 'socket.io-client';

// Initialize socket
const socket = io();

// --- Types ---
interface Member {
  id: string;
  name: string;
  nickname?: string;
  avatarUrl?: string;
  phone?: string;
  skillLevel?: number; // 0-100
  role: 'Leader' | 'Admin' | 'Member' | 'Pro Player' | 'Beban';
  achievements: string[];
  addedAt: number;
}

interface CircleData {
  id: string;
  name: string;
  members: Member[];
  whatsappGroupLink?: string;
  announcement?: string;
  createdAt: number;
}

// --- Initial Data ---
const DEFAULT_CIRCLE: CircleData = {
  id: 'by-zyy',
  name: 'By Zyy',
  members: [
    { 
      id: '1', 
      name: 'Admin', 
      role: 'Leader', 
      skillLevel: 100, 
      achievements: ['FOUNDER', 'ELITE'], 
      addedAt: Date.now() 
    }
  ],
  announcement: 'Selamat datang di Circle By Zyy! Tetap solid dan hargai sesama member.',
  createdAt: 1715000000000
};

export default function App() {
  const [circles, setCircles] = useState<CircleData[]>(() => {
    const saved = localStorage.getItem('circles_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [DEFAULT_CIRCLE];
      }
    }
    return [DEFAULT_CIRCLE];
  });
  
  const [activeCircleId, setActiveCircleId] = useState<string>(circles[0]?.id || 'by-zyy');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberAvatar, setNewMemberAvatar] = useState<string | undefined>();
  const [newMemberSkill, setNewMemberSkill] = useState<number>(50);
  const [isEditingCircleName, setIsEditingCircleName] = useState(false);
  const [editingNameValue, setEditingNameValue] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<Member | null>(null);
  const [editMemberNameValue, setEditMemberNameValue] = useState('');
  const [editMemberAvatar, setEditMemberAvatar] = useState<string | undefined>();
  const [editMemberSkill, setEditMemberSkill] = useState<number>(50);
  const [editMemberRole, setEditMemberRole] = useState<Member['role']>('Member');
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [claimedMemberId, setClaimedMemberId] = useState<string | null>(() => localStorage.getItem(`claimed_id_${activeCircleId}`));
  const [isChoosingIdentity, setIsChoosingIdentity] = useState(false);
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<Member['role']>('Member');
  const [editMemberPhone, setEditMemberPhone] = useState('');
  const [isEditingWhatsApp, setIsEditingWhatsApp] = useState(false);
  const [isEditingAnnouncement, setIsEditingAnnouncement] = useState(false);
  const [announcementValue, setAnnouncementValue] = useState('');
  const [whatsappLinkValue, setWhatsappLinkValue] = useState('');
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme_preference');
    return saved ? saved === 'dark' : true; // Default to dark as requested earlier
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('circles_data', JSON.stringify(circles));
  }, [circles]);

  useEffect(() => {
    localStorage.setItem('theme_preference', isDark ? 'dark' : 'light');
  }, [isDark]);

  // Real-time Presence
  useEffect(() => {
    if (claimedMemberId) {
      socket.emit('join-circle', { circleId: activeCircleId, userId: claimedMemberId });
    }

    const handlePresence = (users: string[]) => {
      setOnlineUsers(users);
    };

    socket.on('presence-update', handlePresence);

    return () => {
      socket.off('presence-update', handlePresence);
    };
  }, [activeCircleId, claimedMemberId]);

  // Update claimed ID when circle changes
  useEffect(() => {
    const saved = localStorage.getItem(`claimed_id_${activeCircleId}`);
    setClaimedMemberId(saved);
  }, [activeCircleId]);

  const activeCircle = useMemo(() => 
    circles.find(c => c.id === activeCircleId) || circles[0], 
  [circles, activeCircleId]);

  const filteredMembers = useMemo(() => {
    let result = activeCircle.members.filter(m => 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (m.role && m.role.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    
    // Sort: Online first, then Role priority, then Skill
    return result.sort((a, b) => {
      const aOnline = onlineUsers.includes(a.id);
      const bOnline = onlineUsers.includes(b.id);
      if (aOnline !== bOnline) return aOnline ? -1 : 1;
      
      const roleOrder: Record<string, number> = { 'Leader': 0, 'Admin': 1, 'Pro Player': 2, 'Member': 3, 'Beban': 4 };
      if (roleOrder[a.role || 'Member'] !== roleOrder[b.role || 'Member']) 
        return (roleOrder[a.role || 'Member'] ?? 3) - (roleOrder[b.role || 'Member'] ?? 3);
      
      return (b.skillLevel || 0) - (a.skillLevel || 0);
    });
  }, [activeCircle.members, searchQuery, onlineUsers]);

  // --- Handlers ---
  const toggleTheme = () => setIsDark(!isDark);
  const addMember = () => {
    if (!newMemberName.trim()) return;
    const newMember: Member = {
      id: Math.random().toString(36).substr(2, 9),
      name: newMemberName.trim(),
      avatarUrl: newMemberAvatar,
      phone: newMemberPhone.trim(),
      skillLevel: newMemberSkill,
      role: newMemberRole,
      achievements: newMemberSkill > 80 ? ['ELITE'] : [],
      addedAt: Date.now()
    };

    setCircles(prev => prev.map(c => {
      if (c.id === activeCircleId) {
        return { ...c, members: [...c.members, newMember] };
      }
      return c;
    }));
    setNewMemberName('');
    setNewMemberAvatar(undefined);
    setNewMemberPhone('');
    setIsAddingMember(false);
  };

  const removeMember = (id: string) => {
    if (!confirm('Hapus teman ini?')) return;
    setCircles(prev => prev.map(c => {
      if (c.id === activeCircleId) {
        return { ...c, members: c.members.filter(m => m.id !== id) };
      }
      return c;
    }));
  };

  const updateCircleName = () => {
    if (!editingNameValue.trim()) {
      setIsEditingCircleName(false);
      return;
    }
    setCircles(prev => prev.map(c => {
      if (c.id === activeCircleId) {
        return { ...c, name: editingNameValue.trim() };
      }
      return c;
    }));
    setIsEditingCircleName(false);
  };

  const updateMember = () => {
    if (!memberToEdit || !editMemberNameValue.trim()) return;
    
    setCircles(prev => prev.map(c => {
      if (c.id === activeCircleId) {
        return {
          ...c,
          members: c.members.map(m => 
            m.id === memberToEdit.id ? { 
              ...m, 
              name: editMemberNameValue.trim(),
              avatarUrl: editMemberAvatar,
              phone: editMemberPhone.trim(),
              skillLevel: editMemberSkill,
              role: editMemberRole
            } : m
          )
        };
      }
      return c;
    }));
    setMemberToEdit(null);
    setEditMemberNameValue('');
    setEditMemberAvatar(undefined);
    setEditMemberPhone('');
  };

  const updateWhatsAppLink = () => {
    setCircles(prev => prev.map(c => {
      if (c.id === activeCircleId) {
        return { ...c, whatsappGroupLink: whatsappLinkValue.trim() };
      }
      return c;
    }));
    setIsEditingWhatsApp(false);
  };

  const updateAnnouncement = () => {
    setCircles(prev => prev.map(c => {
      if (c.id === activeCircleId) {
        return { ...c, announcement: announcementValue.trim() };
      }
      return c;
    }));
    setIsEditingAnnouncement(false);
  };

  const claimIdentity = (memberId: string) => {
    setClaimedMemberId(memberId);
    localStorage.setItem(`claimed_id_${activeCircleId}`, memberId);
    setIsChoosingIdentity(false);
  };

  const createNewCircle = () => {
    const name = prompt('Nama Circle Baru:');
    if (!name) return;
    const newCircle: CircleData = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      members: [],
      createdAt: Date.now()
    };
    setCircles(prev => [...prev, newCircle]);
    setActiveCircleId(newCircle.id);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File terlalu besar! Maksimal 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEdit) {
          setEditMemberAvatar(reader.result as string);
        } else {
          setNewMemberAvatar(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${isDark ? 'bg-zinc-950 text-zinc-50 selection:bg-red-900/30' : 'bg-slate-50 text-slate-900 selection:bg-red-100'}`}>
      {/* Mobile Top Header */}
      <div className={`md:hidden sticky top-0 z-40 backdrop-blur-lg border-b px-4 py-3 flex items-center justify-between transition-colors ${isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white/80 border-slate-200'}`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-red-600/20">
            <Users size={16} />
          </div>
          <span className={`font-bold tracking-tight ${isDark ? 'text-zinc-100' : 'text-slate-800'}`}>By Zyy</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-slate-400 hover:bg-slate-100'}`}
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-slate-400 hover:bg-slate-100'}`}
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Sidebar - Desktop */}
      <div className={`fixed left-0 top-0 h-full w-64 border-r p-6 hidden md:flex flex-col transition-colors ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-red-600/30">
              <Users size={20} />
            </div>
            <span className={`font-black text-xl tracking-tighter italic ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>By Zyy</span>
          </div>

          <nav className="space-y-1">
            <div className="flex items-center justify-between px-2 mb-4">
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Daftar Circle</span>
              <button 
                onClick={createNewCircle}
                className={`p-1.5 rounded-md transition-colors ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-400'} hover:text-red-500`}
                title="Tambah Circle"
                id="add-circle-sidebar"
              >
                <Plus size={16} />
              </button>
            </div>
            {circles.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveCircleId(c.id)}
                className={`w-full text-left px-3 py-3 rounded-xl flex items-center justify-between transition-all group ${
                  activeCircleId === c.id 
                  ? (isDark ? 'bg-red-600/10 text-red-500 border border-red-600/20' : 'bg-red-50 text-red-600 border border-red-100')
                  : (isDark ? 'text-zinc-400 hover:bg-zinc-800 active:scale-[0.98]' : 'text-slate-600 hover:bg-slate-50 active:scale-[0.98]')
                }`}
              >
                <div className="flex items-center gap-3">
                  <Circle size={14} className={activeCircleId === c.id ? 'fill-red-500' : (isDark ? 'text-zinc-700' : 'text-slate-300')} />
                  <span className={`font-bold truncate max-w-[140px] ${activeCircleId === c.id ? (isDark ? 'text-red-500' : 'text-red-600') : ''}`}>{c.name}</span>
                </div>
                <ChevronRight size={16} className={`transition-transform ${activeCircleId === c.id ? 'translate-x-0' : '-translate-x-2 opacity-0 group-hover:opacity-100'}`} />
              </button>
            ))}
          </nav>
        </div>

        {/* Theme Toggle Desktop */}
        <div className="pt-6 border-t border-zinc-800/10 mt-auto">
          <button 
            onClick={toggleTheme}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              isDark 
              ? 'bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            <span className="font-bold text-sm uppercase tracking-wider">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`absolute left-0 top-0 h-full w-4/5 border-r shadow-2xl p-6 transition-colors ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white">
                    <Users size={20} />
                  </div>
                  <span className={`font-bold text-xl tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Circle</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className={`p-2 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                  <X size={24} />
                </button>
              </div>

              <nav className="space-y-1">
                <div className="flex items-center justify-between px-2 mb-4">
                  <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Circles Anda</span>
                  <button onClick={createNewCircle} className={`p-1 rounded-md transition-colors ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-400'}`}>
                    <Plus size={16} />
                  </button>
                </div>
                {circles.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setActiveCircleId(c.id); setIsMobileMenuOpen(false); }}
                    className={`w-full text-left px-4 py-4 rounded-xl flex items-center gap-4 transition-all ${
                      activeCircleId === c.id 
                      ? (isDark ? 'bg-red-600/20 text-red-500 border border-red-600/30' : 'bg-red-50 text-red-600 border border-red-100') 
                      : (isDark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-slate-600 hover:bg-slate-50')
                    }`}
                  >
                    <Circle size={14} className={activeCircleId === c.id ? 'fill-red-500' : (isDark ? 'text-zinc-700' : 'text-slate-300')} />
                    <span className="font-bold">{c.name}</span>
                  </button>
                ))}
              </nav>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="md:ml-64 p-4 md:p-12 max-w-6xl mx-auto min-h-screen">
        {/* Header */}
        <header className="mb-12 space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="group">
              {isEditingCircleName ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={editingNameValue}
                    onChange={(e) => setEditingNameValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && updateCircleName()}
                    onBlur={() => updateCircleName()}
                    className={`text-4xl md:text-6xl font-black tracking-tighter bg-transparent border-b-8 border-red-600 outline-none focus:ring-0 px-0 py-2 italic uppercase ${isDark ? 'text-white' : 'text-slate-900'}`}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <h1 className={`text-4xl md:text-7xl font-black tracking-tighter leading-none uppercase italic ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {activeCircle.name}
                  </h1>
                  <button 
                    onClick={() => { setIsEditingCircleName(true); setEditingNameValue(activeCircle.name); }}
                    className={`p-2 transition-colors md:opacity-0 md:group-hover:opacity-100 ${isDark ? 'text-zinc-700 hover:text-red-500' : 'text-slate-300 hover:text-red-600'}`}
                    id="edit-btn-header"
                  >
                    <Edit2 size={24} />
                  </button>
                </div>
              )}

              {/* WhatsApp Connection */}
              <div className="mt-4 flex flex-wrap gap-4">
                {activeCircle.whatsappGroupLink ? (
                  <div className="flex items-center gap-2">
                    <a 
                      href={activeCircle.whatsappGroupLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-3 px-5 py-2.5 rounded-full border shadow-lg text-sm font-black transition-all hover:-translate-y-1 ${isDark ? 'bg-green-600/10 border-green-600/30 text-green-500 hover:shadow-green-600/10' : 'bg-green-50 border-green-100 text-green-600 hover:shadow-green-100'}`}
                    >
                      <MessageCircle size={18} />
                      WhatsApp Group Terhubung
                      <ExternalLink size={14} />
                    </a>
                    <button 
                      onClick={() => { setIsEditingWhatsApp(true); setWhatsappLinkValue(activeCircle.whatsappGroupLink || ''); }}
                      className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-zinc-900 border-zinc-800' : 'hover:bg-white border-slate-200'} border`}
                    >
                      <Edit2 size={14} className={isDark ? 'text-zinc-600' : 'text-slate-400'} />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => { setIsEditingWhatsApp(true); setWhatsappLinkValue(''); }}
                    className={`flex items-center gap-3 px-5 py-2.5 rounded-full border border-dashed text-sm font-black transition-all hover:bg-green-600 hover:text-white hover:border-transparent ${isDark ? 'border-zinc-800 text-zinc-600' : 'border-slate-200 text-slate-300'}`}
                  >
                    <LinkIcon size={18} />
                    Hubungkan Ke WhatsApp Group
                  </button>
                )}

                <button 
                  onClick={() => setIsChoosingIdentity(true)}
                  className={`flex items-center gap-3 px-5 py-2.5 rounded-full border shadow-lg text-sm font-black transition-all hover:-translate-y-1 ${claimedMemberId ? (isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-white border-slate-200 text-slate-600') : (isDark ? 'bg-red-600/10 border-red-600/30 text-red-500' : 'bg-red-50 border-red-100 text-red-600')}`}
                >
                  <Circle size={14} className={claimedMemberId ? 'text-zinc-500' : 'fill-red-500 animate-pulse'} />
                  {claimedMemberId ? `Login Sebagai: ${activeCircle.members.find(m => m.id === claimedMemberId)?.name || 'Guest'}` : 'Pilih Identitas Anda'}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-6">
                <p className={`font-black flex items-center gap-3 px-5 py-2.5 rounded-full border shadow-xl text-sm uppercase tracking-widest ${isDark ? 'text-zinc-200 bg-zinc-900 border-zinc-800' : 'text-slate-700 bg-white border-slate-100'}`}>
                  <Users size={16} className="text-red-500" />
                  {activeCircle.members.length} Peserta
                </p>
                {onlineUsers.length > 0 && (
                  <div className={`flex items-center gap-3 px-5 py-2.5 rounded-full border shadow-xl text-sm font-black uppercase tracking-widest animate-pulse ${isDark ? 'bg-green-600/10 border-green-600/30 text-green-500' : 'bg-green-50 border-green-100 text-green-600'}`}>
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                    {onlineUsers.length} ONLINE DI GROUP
                  </div>
                )}
                <p className={`text-xs font-mono uppercase px-4 py-2 rounded-full border ${isDark ? 'text-zinc-500 bg-zinc-900/50 border-zinc-800/50' : 'text-slate-400 bg-slate-100 border-slate-200'}`}>
                  EST. {new Date(activeCircle.createdAt).getFullYear()}
                </p>
                {!activeCircle.announcement && (
                  <button 
                    onClick={() => { setAnnouncementValue(''); setIsEditingAnnouncement(true); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border border-dashed text-xs font-black uppercase transition-all hover:bg-zinc-800 ${isDark ? 'border-zinc-800 text-zinc-600' : 'border-slate-200 text-slate-300'}`}
                  >
                    <Plus size={14} />
                    Buat Pengumuman
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Announcement Section */}
        {activeCircle.announcement && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-12 p-8 rounded-[2.5rem] border relative overflow-hidden group/ann ${isDark ? 'bg-red-600/10 border-red-600/20 text-white' : 'bg-red-50 border-red-100 text-red-900'}`}
          >
            <div className="flex flex-col md:flex-row md:items-center gap-6 relative z-10">
              <div className="bg-red-600 p-4 rounded-3xl text-white shadow-xl flex-shrink-0 w-14 h-14 flex items-center justify-center">
                <MessageCircle size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.4em] opacity-60 mb-2">Papan Pengumuman Circle</p>
                <p className="font-bold italic uppercase tracking-tighter leading-tight text-xl md:text-2xl">{activeCircle.announcement}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setAnnouncementValue(activeCircle.announcement || ''); setIsEditingAnnouncement(true); }}
                  className={`p-4 rounded-2xl transition-all md:opacity-0 group-hover/ann:opacity-100 ${isDark ? 'bg-zinc-950/50 hover:bg-red-600/20' : 'bg-white/50 hover:bg-red-100'}`}
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => { setCircles(prev => prev.map(c => c.id === activeCircleId ? { ...c, announcement: undefined } : c)) }}
                  className={`p-4 rounded-2xl transition-all md:opacity-0 group-hover/ann:opacity-100 ${isDark ? 'bg-zinc-950/50 hover:bg-red-600/20' : 'bg-white/50 hover:bg-red-100'}`}
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
              <MessageCircle size={150} className="rotate-12 translate-x-12 -translate-y-12" />
            </div>
          </motion.div>
        )}

        <div className="flex flex-col gap-8 mb-12">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <h2 className={`text-[10px] font-black uppercase tracking-[0.5em] ${isDark ? 'text-zinc-700' : 'text-slate-300'}`}>Circle Members</h2>
              <div className="flex items-center gap-4">
                <div className={`h-1 w-12 rounded-full ${isDark ? 'bg-red-900/30' : 'bg-red-100'}`} />
                <p className={`text-3xl font-black italic uppercase tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>Leaderboard</p>
              </div>
            </div>

            <button 
              onClick={() => setIsAddingMember(true)}
              className="inline-flex items-center justify-center gap-4 bg-red-600 hover:bg-red-700 text-white px-10 py-6 rounded-2xl font-black shadow-2xl shadow-red-600/20 transition-all active:scale-95 text-xl relative overflow-hidden group/btn uppercase tracking-tighter italic"
              id="add-member-top"
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover/btn:opacity-10 transition-opacity" />
              <UserPlus size={28} />
              Tambah Teman
            </button>
          </div>

          <div className="relative group">
            <div className={`absolute inset-y-0 left-0 pl-8 flex items-center pointer-events-none transition-colors ${isDark ? 'text-zinc-600 group-focus-within:text-red-500' : 'text-slate-300 group-focus-within:text-red-500'}`}>
              <Search size={28} />
            </div>
            <input
              type="text"
              placeholder={`CARI NAMA ATAU ROLE...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full border-2 rounded-3xl py-7 pl-20 pr-10 shadow-2xl outline-none transition-all text-2xl font-black italic uppercase tracking-tighter ${isDark ? 'bg-zinc-900/50 border-zinc-800/50 focus:ring-8 focus:ring-red-600/5 focus:border-red-600/40 text-white placeholder:text-zinc-800' : 'bg-white border-slate-100 focus:ring-8 focus:ring-red-100 focus:border-red-200 text-slate-900 placeholder:text-slate-200'}`}
            />
          </div>
        </div>

        {/* Member Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredMembers.map((member) => (
              <motion.div
                layout
                key={member.id}
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -30 }}
                transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                className={`p-8 rounded-[2rem] border shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden backdrop-blur-sm ${isDark ? 'bg-zinc-900/40 border-zinc-800/50 hover:shadow-red-600/10 hover:-translate-y-2 hover:border-red-600/30' : 'bg-white border-slate-100 hover:shadow-slate-200 hover:-translate-y-2 hover:border-slate-200'}`}
              >
                <div className="flex items-center gap-6 relative z-10">
                  <div className={`w-20 h-20 flex-shrink-0 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-2xl group-hover:rotate-12 transition-transform overflow-hidden ${isDark ? 'bg-gradient-to-br from-red-600 to-red-800 shadow-red-950' : 'bg-red-600 shadow-red-100'}`}>
                    {member.avatarUrl ? (
                      <img 
                        src={member.avatarUrl} 
                        alt={member.name} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      member.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-black text-2xl truncate transition-colors leading-tight italic uppercase ${isDark ? 'text-zinc-100 group-hover:text-red-500' : 'text-slate-800 group-hover:text-red-600'}`}>{member.name}</h3>
                    <div className="flex items-center gap-3 mt-1 underline-offset-4 decoration-2">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                        member.role === 'Leader' ? 'bg-red-600 text-white' :
                        member.role === 'Admin' ? 'bg-orange-600 text-white' :
                        member.role === 'Pro Player' ? 'bg-indigo-600 text-white' :
                        isDark ? 'bg-zinc-800 text-zinc-500' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {member.role || 'Member'}
                      </span>
                      {member.skillLevel === 100 && (
                        <span className="bg-yellow-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded-sm animate-bounce">TOP TIER</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <div className={`w-2 h-2 rounded-full ${onlineUsers.includes(member.id) ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : (isDark ? 'bg-zinc-800' : 'bg-slate-200')} ${claimedMemberId === member.id ? 'ring-2 ring-offset-2 ring-red-500 ring-offset-zinc-900' : ''}`} />
                      <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${onlineUsers.includes(member.id) ? 'text-green-500' : (isDark ? 'text-zinc-500' : 'text-slate-400')}`}>
                        {onlineUsers.includes(member.id) ? (claimedMemberId === member.id ? 'ANDA ONLINE' : 'WA ONLINE') : 'WA OFFLINE'}
                      </p>
                    </div>
                    {/* Skill Progress */}
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between items-end">
                        <p className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-700' : 'text-slate-300'}`}>Skill Progress</p>
                        <p className={`text-[10px] font-black italic ${member.skillLevel && member.skillLevel > 80 ? 'text-red-500' : (isDark ? 'text-zinc-500' : 'text-slate-400')}`}>
                          {member.skillLevel || 0}% {member.skillLevel && member.skillLevel > 80 ? 'JAGO' : member.skillLevel && member.skillLevel < 30 ? 'PULA' : 'PROGRES'}
                        </p>
                      </div>
                      <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-slate-100'}`}>
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${member.skillLevel || 0}%` }}
                          className={`h-full bg-gradient-to-r ${member.skillLevel && member.skillLevel > 80 ? 'from-red-600 to-red-400 shadow-[0_0_10px_rgba(220,38,38,0.4)]' : 'from-zinc-600 to-zinc-400'}`}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {member.phone && (
                      <a 
                        href={`https://wa.me/${member.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-3 rounded-xl transition-all ${isDark ? 'text-zinc-600 hover:text-green-500 hover:bg-green-600/10' : 'text-slate-400 hover:text-green-600 hover:bg-green-50'}`}
                        title="Chat di WhatsApp"
                      >
                        <MessageSquare size={20} />
                      </a>
                    )}
                    <button 
                      onClick={() => {
                        setMemberToEdit(member);
                        setEditMemberNameValue(member.name);
                        setEditMemberAvatar(member.avatarUrl);
                        setEditMemberPhone(member.phone || '');
                        setEditMemberSkill(member.skillLevel || 50);
                      }}
                      className={`p-3 rounded-xl transition-all md:opacity-0 md:group-hover:opacity-100 ${isDark ? 'text-zinc-600 hover:text-red-500 hover:bg-red-600/10' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`}
                      title="Edit"
                    >
                      <Edit2 size={20} />
                    </button>
                    <button 
                      onClick={() => removeMember(member.id)}
                      className={`p-3 rounded-xl transition-all md:opacity-0 md:group-hover:opacity-100 ${isDark ? 'text-zinc-600 hover:text-red-600 hover:bg-red-600/10' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`}
                      title="Hapus"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
                
                {/* Visual Flair */}
                <div className={`absolute -bottom-12 -right-12 w-40 h-40 rounded-full blur-3xl transition-colors duration-700 ${isDark ? 'bg-red-600/2 group-hover:bg-red-600/5' : 'bg-slate-50 group-hover:bg-red-50'}`} />
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredMembers.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className={`col-span-full flex flex-col items-center justify-center py-40 text-center rounded-[3rem] border-4 border-dashed transition-colors ${isDark ? 'border-zinc-800 bg-zinc-900/20' : 'border-slate-100 bg-slate-50/50'}`}
            >
              <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-10 group relative transition-colors ${isDark ? 'bg-zinc-800/50 text-zinc-700' : 'bg-slate-100 text-slate-200'}`}>
                <Users size={64} className="group-hover:text-red-600 transition-colors" />
                <div className={`absolute inset-0 rounded-full blur-2xl animate-pulse ${isDark ? 'bg-red-600/5' : 'bg-red-500/5'}`} />
              </div>
              <h3 className={`text-3xl font-black tracking-tighter uppercase italic ${isDark ? 'text-zinc-300' : 'text-slate-800'}`}>Tidak Menemukan Nama</h3>
              <p className={`max-w-sm mx-auto mt-4 text-xl font-medium leading-relaxed ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                Waduh, nggak ada yang namanya "{searchQuery}" di sini.
              </p>
              <button 
                onClick={() => setSearchQuery('')}
                className={`mt-10 font-black text-lg px-8 py-3 rounded-full transition-all active:scale-95 uppercase tracking-widest ${isDark ? 'bg-zinc-800 hover:bg-red-600 text-zinc-100' : 'bg-white hover:bg-red-600 hover:text-white text-slate-400 shadow-sm border border-slate-100'}`}
                id="reset-search"
              >
                Reset Cari
              </button>
            </motion.div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className={`md:ml-64 p-16 text-center border-t transition-colors ${isDark ? 'border-zinc-900 bg-black/20' : 'border-slate-100 bg-white'}`}>
        <div className="max-w-md mx-auto space-y-6">
          <div className="flex justify-center gap-3">
            {[1, 2, 3].map(i => <div key={i} className={`w-12 h-1 rounded-full group-hover:bg-red-600 transition-colors ${isDark ? 'bg-zinc-800' : 'bg-slate-100'}`} />)}
          </div>
          <p className={`font-black text-base tracking-[0.5em] uppercase italic ${isDark ? 'text-zinc-500' : 'text-slate-300'}`}>
            BY <span className="text-red-600">ZYY</span>
          </p>
          <div className="pt-4 space-y-2">
            <p className={`text-[10px] font-mono uppercase tracking-widest ${isDark ? 'text-zinc-700' : 'text-slate-300'}`}>
              Secured & local persistence active
            </p>
            <p className={`text-[9px] uppercase tracking-widest ${isDark ? 'text-zinc-800' : 'text-slate-200'}`}>
              v1.5.0-alpha elite
            </p>
          </div>
        </div>
      </footer>

      {/* Add Member Modal */}
      <AnimatePresence>
        {isAddingMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingMember(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 100 }}
              transition={{ type: 'spring', damping: 25 }}
              className={`relative w-full max-w-lg rounded-[3rem] p-12 overflow-hidden border transition-colors ${isDark ? 'bg-zinc-900 border-zinc-800 shadow-[0_0_100px_rgba(220,38,38,0.1)]' : 'bg-white border-slate-100 shadow-2xl'}`}
            >
              <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-red-600 via-red-500 to-red-800" />
              
              <div className="flex justify-between items-start mb-14">
                <div className={isDark ? 'text-white' : 'text-slate-900'}>
                  <h2 className="text-5xl font-black leading-none italic uppercase tracking-tighter">Tambah</h2>
                  <h2 className="text-5xl font-black text-red-600 mt-2 leading-none italic uppercase tracking-tighter">Peserta</h2>
                  <div className={`h-2 w-20 mt-6 rounded-full ${isDark ? 'bg-red-600/30' : 'bg-red-100'}`} />
                </div>
                <button 
                  onClick={() => setIsAddingMember(false)} 
                  className={`p-4 rounded-3xl transition-colors ${isDark ? 'hover:bg-zinc-800 text-zinc-600 hover:text-red-500' : 'hover:bg-slate-50 text-slate-300 hover:text-red-600'}`}
                >
                  <X size={36} />
                </button>
              </div>
              
              <div className="space-y-10">
                <div className="flex flex-col items-center gap-6">
                  <div className={`relative w-32 h-32 rounded-[2rem] border-4 border-dashed flex items-center justify-center overflow-hidden transition-all group/avatar ${isDark ? 'border-zinc-800 bg-zinc-950 hover:border-red-600/30' : 'border-slate-100 bg-slate-50 hover:border-red-200'}`}>
                    {newMemberAvatar ? (
                      <>
                        <img src={newMemberAvatar} className="w-full h-full object-cover" alt="Preview" />
                        <button 
                          onClick={() => setNewMemberAvatar(undefined)}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-white"
                        >
                          <X size={24} />
                        </button>
                      </>
                    ) : (
                      <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center gap-2 group/label">
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*" 
                          onChange={(e) => handleImageUpload(e, false)} 
                        />
                        <Camera size={32} className={`transition-colors ${isDark ? 'text-zinc-700 group-hover/label:text-red-500' : 'text-slate-200 group-hover/label:text-red-500'}`} />
                        <span className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-800' : 'text-slate-300'}`}>Upload Foto</span>
                      </label>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className={`block text-[11px] font-black uppercase tracking-[0.4em] ml-4 ${isDark ? 'text-zinc-400' : 'text-slate-400'}`}>Informasi Nama Teman</label>
                  <input
                    autoFocus
                    type="text"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addMember()}
                    placeholder="E.G. ANDREAS BLACK"
                    className={`w-full border-4 rounded-[1.5rem] py-7 px-8 outline-none transition-all text-2xl font-black italic uppercase ${isDark ? 'bg-zinc-950 border-zinc-950 focus:bg-black focus:border-red-600/30 text-white placeholder:text-zinc-800' : 'bg-slate-50 border-slate-50 focus:bg-white focus:border-red-100 text-slate-900 placeholder:text-slate-200'}`}
                  />
                </div>

                <div className="space-y-4">
                  <label className={`block text-[11px] font-black uppercase tracking-[0.4em] ml-4 ${isDark ? 'text-zinc-400' : 'text-slate-400'}`}>Nomor WhatsApp</label>
                  <input
                    type="tel"
                    value={newMemberPhone}
                    onChange={(e) => setNewMemberPhone(e.target.value)}
                    placeholder="E.G. 628123456789"
                    className={`w-full border-4 rounded-[1.5rem] py-7 px-8 outline-none transition-all text-2xl font-black italic uppercase ${isDark ? 'bg-zinc-950 border-zinc-950 focus:bg-black focus:border-red-600/30 text-white placeholder:text-zinc-800' : 'bg-slate-50 border-slate-50 focus:bg-white focus:border-red-100 text-slate-900 placeholder:text-slate-200'}`}
                  />
                </div>

                <div className="space-y-4">
                  <label className={`block text-[11px] font-black uppercase tracking-[0.4em] ml-4 ${isDark ? 'text-zinc-400' : 'text-slate-400'}`}>Jabatan / Role</label>
                  <div className="flex flex-wrap gap-2">
                    {(['Leader', 'Admin', 'Pro Player', 'Member', 'Beban'] as Member['role'][]).map(role => (
                      <button
                        key={role}
                        onClick={() => setNewMemberRole(role)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${newMemberRole === role ? 'bg-red-600 border-red-600 text-white' : (isDark ? 'bg-zinc-950 border-zinc-900 text-zinc-600 hover:border-red-600/30' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-red-100')}`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center ml-4">
                    <label className={`text-[11px] font-black uppercase tracking-[0.4em] ${isDark ? 'text-zinc-400' : 'text-slate-400'}`}>Progres Skill: {newMemberSkill}%</label>
                    <span className={`text-[10px] font-bold italic uppercase ${newMemberSkill > 80 ? 'text-red-500' : (isDark ? 'text-zinc-600' : 'text-slate-300')}`}>
                      {newMemberSkill > 80 ? 'Jago Banget' : newMemberSkill < 30 ? 'Beban Circle' : 'Standar'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={newMemberSkill}
                    onChange={(e) => setNewMemberSkill(parseInt(e.target.value))}
                    className="w-full h-8 accent-red-600 cursor-pointer"
                  />
                </div>
                
                <button 
                  onClick={addMember}
                  disabled={!newMemberName.trim()}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-8 rounded-[1.5rem] font-black shadow-2xl disabled:opacity-20 transition-all active:scale-95 text-2xl tracking-tighter italic uppercase shadow-red-950"
                >
                  Simpan Peserta Baru
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Member Modal */}
      <AnimatePresence>
        {memberToEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setMemberToEdit(null); setEditMemberNameValue(''); }}
              className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 100 }}
              transition={{ type: 'spring', damping: 25 }}
              className={`relative w-full max-w-lg rounded-[3rem] p-12 overflow-hidden border transition-colors ${isDark ? 'bg-zinc-900 border-zinc-800 shadow-[0_0_100px_rgba(220,38,38,0.1)]' : 'bg-white border-slate-100 shadow-2xl'}`}
            >
              <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-red-600 to-zinc-900" />
              
              <div className="flex justify-between items-start mb-14">
                <div className={isDark ? 'text-white' : 'text-slate-900'}>
                  <h2 className="text-5xl font-black leading-none italic uppercase tracking-tighter">Edit</h2>
                  <h2 className="text-5xl font-black text-red-600 mt-2 leading-none italic uppercase tracking-tighter">Identitas</h2>
                  <div className={`h-2 w-20 mt-6 rounded-full ${isDark ? 'bg-red-600/30' : 'bg-red-100'}`} />
                </div>
                <button 
                  onClick={() => { setMemberToEdit(null); setEditMemberNameValue(''); }} 
                  className={`p-4 rounded-3xl transition-colors ${isDark ? 'hover:bg-zinc-800 text-zinc-600 hover:text-red-500' : 'hover:bg-slate-50 text-slate-300 hover:text-red-600'}`}
                >
                  <X size={36} />
                </button>
              </div>
              
              <div className="space-y-10">
                <div className="flex flex-col items-center gap-6">
                  <div className={`relative w-32 h-32 rounded-[2rem] border-4 border-dashed flex items-center justify-center overflow-hidden transition-all group/avatar ${isDark ? 'border-zinc-800 bg-zinc-950 hover:border-red-600/30' : 'border-slate-100 bg-slate-50 hover:border-red-200'}`}>
                    {editMemberAvatar || memberToEdit.avatarUrl ? (
                      <>
                        <img src={editMemberAvatar || memberToEdit.avatarUrl} className="w-full h-full object-cover" alt="Preview" />
                        <button 
                          onClick={() => setEditMemberAvatar('')}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-white"
                        >
                          <X size={24} />
                        </button>
                      </>
                    ) : (
                      <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center gap-2 group/label">
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*" 
                          onChange={(e) => handleImageUpload(e, true)} 
                        />
                        <Camera size={32} className={`transition-colors ${isDark ? 'text-zinc-700 group-hover/label:text-red-500' : 'text-slate-200 group-hover/label:text-red-500'}`} />
                        <span className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-800' : 'text-slate-300'}`}>Ubah Foto</span>
                      </label>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className={`block text-[11px] font-black uppercase tracking-[0.4em] ml-4 ${isDark ? 'text-zinc-400' : 'text-slate-400'}`}>Jabatan / Role</label>
                  <div className="flex flex-wrap gap-2">
                    {(['Leader', 'Admin', 'Pro Player', 'Member', 'Beban'] as Member['role'][]).map(role => (
                      <button
                        key={role}
                        onClick={() => setEditMemberRole(role)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${editMemberRole === role ? 'bg-red-600 border-red-600 text-white' : (isDark ? 'bg-zinc-950 border-zinc-900 text-zinc-600 hover:border-red-600/30' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-red-100')}`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className={`block text-[11px] font-black uppercase tracking-[0.4em] ml-4 ${isDark ? 'text-zinc-400' : 'text-slate-400'}`}>Ubah Nama Terdaftar</label>
                  <input
                    autoFocus
                    type="text"
                    value={editMemberNameValue}
                    onChange={(e) => setEditMemberNameValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && updateMember()}
                    placeholder="E.G. ANDREAS BLACK"
                    className={`w-full border-4 rounded-[2rem] py-7 px-8 outline-none transition-all text-2xl font-black italic uppercase ${isDark ? 'bg-zinc-950 border-zinc-950 focus:bg-black focus:border-red-600/30 text-white placeholder:text-zinc-800' : 'bg-slate-50 border-slate-50 focus:bg-white focus:border-red-100 text-slate-900 placeholder:text-slate-200'}`}
                  />
                </div>

                <div className="space-y-4">
                  <label className={`block text-[11px] font-black uppercase tracking-[0.4em] ml-4 ${isDark ? 'text-zinc-400' : 'text-slate-400'}`}>Nomor WhatsApp</label>
                  <input
                    type="tel"
                    value={editMemberPhone}
                    onChange={(e) => setEditMemberPhone(e.target.value)}
                    placeholder="E.G. 628123456789"
                    className={`w-full border-4 rounded-[1.5rem] py-7 px-8 outline-none transition-all text-2xl font-black italic uppercase ${isDark ? 'bg-zinc-950 border-zinc-950 focus:bg-black focus:border-red-600/30 text-white placeholder:text-zinc-800' : 'bg-slate-50 border-slate-50 focus:bg-white focus:border-red-100 text-slate-900 placeholder:text-slate-200'}`}
                  />
                </div>

                <div className="space-y-4">
                  <label className={`block text-[11px] font-black uppercase tracking-[0.4em] ml-4 ${isDark ? 'text-zinc-400' : 'text-slate-400'}`}>Jabatan / Role</label>
                  <div className="flex flex-wrap gap-2">
                    {(['Leader', 'Admin', 'Pro Player', 'Member', 'Beban'] as Member['role'][]).map(role => (
                      <button
                        key={role}
                        onClick={() => setEditMemberRole(role)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${editMemberRole === role ? 'bg-red-600 border-red-600 text-white' : (isDark ? 'bg-zinc-950 border-zinc-900 text-zinc-600 hover:border-red-600/30' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-red-100')}`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center ml-4">
                    <label className={`text-[11px] font-black uppercase tracking-[0.4em] ${isDark ? 'text-zinc-400' : 'text-slate-400'}`}>Progres Skill: {editMemberSkill}%</label>
                    <span className={`text-[10px] font-bold italic uppercase ${editMemberSkill > 80 ? 'text-red-500' : (isDark ? 'text-zinc-600' : 'text-slate-300')}`}>
                      {editMemberSkill > 80 ? 'Jago Banget' : editMemberSkill < 30 ? 'Beban Circle' : 'Standar'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={editMemberSkill}
                    onChange={(e) => setEditMemberSkill(parseInt(e.target.value))}
                    className="w-full h-8 accent-red-600 cursor-pointer"
                  />
                </div>
                
                <button 
                  onClick={updateMember}
                  disabled={!editMemberNameValue.trim() || editMemberNameValue === memberToEdit.name}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-8 rounded-[2rem] font-black shadow-2xl disabled:opacity-20 transition-all active:scale-95 text-2xl tracking-tighter uppercase italic shadow-red-950"
                >
                  Perbarui Identitas
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WhatsApp Link Modal */}
      {/* Announcement Editor Modal */}
      <AnimatePresence>
        {isEditingAnnouncement && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditingAnnouncement(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 100 }}
              className={`relative w-full max-w-lg rounded-[3rem] p-12 overflow-hidden border transition-colors ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-100 shadow-2xl'}`}
            >
              <div className="absolute top-0 left-0 w-full h-4 bg-red-600" />
              
              <div className="flex justify-between items-start mb-14">
                <div className={isDark ? 'text-white' : 'text-slate-900'}>
                  <h2 className="text-5xl font-black leading-none italic uppercase tracking-tighter">Papan</h2>
                  <h2 className="text-5xl font-black text-red-600 mt-2 leading-none italic uppercase tracking-tighter">Info</h2>
                  <div className={`h-2 w-20 mt-6 rounded-full ${isDark ? 'bg-red-600/30' : 'bg-red-100'}`} />
                </div>
                <button 
                  onClick={() => setIsEditingAnnouncement(false)} 
                  className={`p-4 rounded-3xl transition-colors ${isDark ? 'hover:bg-zinc-800 text-zinc-600 hover:text-red-500' : 'hover:bg-slate-50 text-slate-300 hover:text-red-600'}`}
                >
                  <X size={36} />
                </button>
              </div>
              
              <div className="space-y-10">
                <div className="space-y-4">
                  <label className={`block text-[11px] font-black uppercase tracking-[0.4em] ml-4 ${isDark ? 'text-zinc-400' : 'text-slate-400'}`}>Teks Pengumuman</label>
                  <textarea
                    autoFocus
                    rows={4}
                    value={announcementValue}
                    onChange={(e) => setAnnouncementValue(e.target.value)}
                    placeholder="Contoh: Malam ini kita mabar jam 20:00! Stay tuned."
                    className={`w-full border-4 rounded-[1.5rem] py-7 px-8 outline-none transition-all text-xl font-black italic ${isDark ? 'bg-zinc-950 border-zinc-950 focus:bg-black focus:border-red-600/30 text-white placeholder:text-zinc-800' : 'bg-slate-50 border-slate-50 focus:bg-white focus:border-red-100 text-slate-900 placeholder:text-slate-100'}`}
                  />
                </div>
                
                <button 
                  onClick={updateAnnouncement}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-8 rounded-[1.5rem] font-black shadow-2xl transition-all active:scale-95 text-2xl tracking-tighter italic uppercase"
                >
                  Publikasi Pengumuman
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WhatsApp Link Modal */}
      <AnimatePresence>
        {isEditingWhatsApp && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditingWhatsApp(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 100 }}
              transition={{ type: 'spring', damping: 25 }}
              className={`relative w-full max-w-lg rounded-[3rem] p-12 overflow-hidden border transition-colors ${isDark ? 'bg-zinc-900 border-zinc-800 shadow-[0_0_100px_rgba(22,163,74,0.1)]' : 'bg-white border-slate-100 shadow-2xl'}`}
            >
              <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-green-600 via-green-500 to-green-800" />
              
              <div className="flex justify-between items-start mb-14">
                <div className={isDark ? 'text-white' : 'text-slate-900'}>
                  <h2 className="text-5xl font-black leading-none italic uppercase tracking-tighter">Group</h2>
                  <h2 className="text-5xl font-black text-green-600 mt-2 leading-none italic uppercase tracking-tighter">WhatsApp</h2>
                  <div className={`h-2 w-20 mt-6 rounded-full ${isDark ? 'bg-green-600/30' : 'bg-green-100'}`} />
                </div>
                <button 
                  onClick={() => setIsEditingWhatsApp(false)} 
                  className={`p-4 rounded-3xl transition-colors ${isDark ? 'hover:bg-zinc-800 text-zinc-600 hover:text-green-500' : 'hover:bg-slate-50 text-slate-300 hover:text-green-600'}`}
                >
                  <X size={36} />
                </button>
              </div>
              
              <div className="space-y-10">
                <div className="space-y-4">
                  <label className={`block text-[11px] font-black uppercase tracking-[0.4em] ml-4 ${isDark ? 'text-zinc-400' : 'text-slate-400'}`}>Link Invitasi Group</label>
                  <input
                    autoFocus
                    type="url"
                    value={whatsappLinkValue}
                    onChange={(e) => setWhatsappLinkValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && updateWhatsAppLink()}
                    placeholder="https://chat.whatsapp.com/..."
                    className={`w-full border-4 rounded-[1.5rem] py-7 px-8 outline-none transition-all text-xl font-black italic ${isDark ? 'bg-zinc-950 border-zinc-950 focus:bg-black focus:border-green-600/30 text-white placeholder:text-zinc-800' : 'bg-slate-50 border-slate-50 focus:bg-white focus:border-green-100 text-slate-900 placeholder:text-slate-100'}`}
                  />
                </div>
                
                <button 
                  onClick={updateWhatsAppLink}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-8 rounded-[1.5rem] font-black shadow-2xl transition-all active:scale-95 text-2xl tracking-tighter italic uppercase shadow-green-950"
                >
                  Simpan Link Group
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Identity Selection Modal */}
      <AnimatePresence>
        {isChoosingIdentity && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChoosingIdentity(false)}
              className="absolute inset-0 bg-black/95 backdrop-blur-3xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              className={`relative w-full max-w-2xl rounded-[3rem] p-12 overflow-hidden border ${isDark ? 'bg-zinc-900 border-zinc-800 shadow-2xl shadow-red-600/10' : 'bg-white border-slate-100 shadow-2xl'}`}
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-red-600" />
              
              <div className="flex justify-between items-start mb-10">
                <div className={isDark ? 'text-white' : 'text-slate-900'}>
                  <h2 className="text-4xl font-black leading-none italic uppercase tracking-tighter">Siapa</h2>
                  <h2 className="text-4xl font-black text-red-600 mt-1 leading-none italic uppercase tracking-tighter">Anda?</h2>
                  <p className={`text-xs mt-4 font-bold uppercase tracking-widest ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>Pilih nama Anda untuk mengaktifkan status online</p>
                </div>
                <button onClick={() => setIsChoosingIdentity(false)} className={`p-4 rounded-3xl ${isDark ? 'text-zinc-600 hover:text-red-500' : 'text-slate-300 hover:text-red-600'}`}>
                  <X size={32} />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                {activeCircle.members.map(member => (
                  <button
                    key={member.id}
                    onClick={() => claimIdentity(member.id)}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 group/id ${claimedMemberId === member.id ? 'border-red-600 bg-red-600/10' : (isDark ? 'border-zinc-800 hover:border-red-600/30 bg-zinc-950' : 'border-slate-50 hover:border-red-100 bg-slate-50')}`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-lg overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-slate-200'}`}>
                      {member.avatarUrl ? <img src={member.avatarUrl} className="w-full h-full object-cover" alt="" /> : member.name.charAt(0).toUpperCase()}
                    </div>
                    <span className={`font-black text-[10px] uppercase tracking-widest truncate w-full text-center ${claimedMemberId === member.id ? 'text-red-500' : (isDark ? 'text-zinc-400 group-hover/id:text-zinc-200' : 'text-slate-600 group-hover/id:text-red-600')}`}>
                      {member.name}
                    </span>
                  </button>
                ))}
              </div>
              
              <div className="mt-10 flex gap-4">
                <button 
                  onClick={() => claimIdentity('')}
                  className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isDark ? 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                >
                  Masuk sebagai Guest
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
