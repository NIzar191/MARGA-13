/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
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
  Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface Member {
  id: string;
  name: string;
  nickname?: string;
  addedAt: number;
}

interface CircleData {
  id: string;
  name: string;
  members: Member[];
  createdAt: number;
}

// --- Initial Data ---
const DEFAULT_CIRCLE: CircleData = {
  id: 'marga-13',
  name: 'MARGA 13',
  members: [
    { id: '1', name: 'Admin', addedAt: Date.now() }
  ],
  createdAt: Date.now()
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
  
  const [activeCircleId, setActiveCircleId] = useState<string>(circles[0]?.id || 'marga-13');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [isEditingCircleName, setIsEditingCircleName] = useState(false);
  const [editingNameValue, setEditingNameValue] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<Member | null>(null);
  const [editMemberNameValue, setEditMemberNameValue] = useState('');

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('circles_data', JSON.stringify(circles));
  }, [circles]);

  const activeCircle = useMemo(() => 
    circles.find(c => c.id === activeCircleId) || circles[0], 
  [circles, activeCircleId]);

  const filteredMembers = useMemo(() => {
    if (!activeCircle) return [];
    return activeCircle.members.filter(m => 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (m.nickname && m.nickname.toLowerCase().includes(searchQuery.toLowerCase()))
    ).sort((a, b) => b.addedAt - a.addedAt);
  }, [activeCircle, searchQuery]);

  // --- Handlers ---
  const addMember = () => {
    if (!newMemberName.trim()) return;
    const newMember: Member = {
      id: Math.random().toString(36).substr(2, 9),
      name: newMemberName.trim(),
      addedAt: Date.now()
    };

    setCircles(prev => prev.map(c => {
      if (c.id === activeCircleId) {
        return { ...c, members: [...c.members, newMember] };
      }
      return c;
    }));
    setNewMemberName('');
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
            m.id === memberToEdit.id ? { ...m, name: editMemberNameValue.trim() } : m
          )
        };
      }
      return c;
    }));
    setMemberToEdit(null);
    setEditMemberNameValue('');
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

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-red-900/30">
      {/* Mobile Top Header */}
      <div className="md:hidden sticky top-0 z-40 bg-zinc-900/80 backdrop-blur-lg border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-red-600/20">
            <Users size={16} />
          </div>
          <span className="font-bold text-zinc-100 tracking-tight">MARGA 13</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 text-zinc-400 hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar - Desktop */}
      <div className="fixed left-0 top-0 h-full w-64 bg-zinc-900 border-r border-zinc-800 p-6 hidden md:block">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-red-600/30">
            <Users size={20} />
          </div>
          <span className="font-black text-xl tracking-tighter text-zinc-100 italic">MARGA 13</span>
        </div>

        <nav className="space-y-1">
          <div className="flex items-center justify-between px-2 mb-4">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Daftar Circle</span>
            <button 
              onClick={createNewCircle}
              className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-red-500 transition-colors"
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
                ? 'bg-red-600/10 text-red-500 shadow-sm border border-red-600/20' 
                : 'text-zinc-400 hover:bg-zinc-800 active:scale-[0.98]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Circle size={14} className={activeCircleId === c.id ? 'fill-red-500' : 'text-zinc-700'} />
                <span className={`font-bold truncate max-w-[140px] ${activeCircleId === c.id ? 'text-red-500' : ''}`}>{c.name}</span>
              </div>
              <ChevronRight size={16} className={`transition-transform ${activeCircleId === c.id ? 'translate-x-0' : '-translate-x-2 opacity-0 group-hover:opacity-100'}`} />
            </button>
          ))}
        </nav>
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
              className="absolute left-0 top-0 h-full w-4/5 bg-zinc-900 border-r border-zinc-800 shadow-2xl p-6"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white">
                    <Users size={20} />
                  </div>
                  <span className="font-bold text-xl tracking-tight text-white">Circle</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-zinc-500">
                  <X size={24} />
                </button>
              </div>

              <nav className="space-y-1">
                <div className="flex items-center justify-between px-2 mb-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Circles Anda</span>
                  <button onClick={createNewCircle} className="p-1 bg-zinc-800 rounded-md text-zinc-400">
                    <Plus size={16} />
                  </button>
                </div>
                {circles.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setActiveCircleId(c.id); setIsMobileMenuOpen(false); }}
                    className={`w-full text-left px-4 py-4 rounded-xl flex items-center gap-4 ${
                      activeCircleId === c.id ? 'bg-red-600/20 text-red-500 border border-red-600/30' : 'text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    <Circle size={14} className={activeCircleId === c.id ? 'fill-red-500' : 'text-zinc-700'} />
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
                    className="text-4xl md:text-6xl font-black tracking-tighter text-white bg-transparent border-b-8 border-red-600 outline-none focus:ring-0 px-0 py-2 italic uppercase"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <h1 className="text-4xl md:text-7xl font-black tracking-tighter text-white leading-none uppercase italic">
                    {activeCircle.name}
                  </h1>
                  <button 
                    onClick={() => { setIsEditingCircleName(true); setEditingNameValue(activeCircle.name); }}
                    className="p-2 text-zinc-700 hover:text-red-500 transition-colors md:opacity-0 md:group-hover:opacity-100"
                    id="edit-btn-header"
                  >
                    <Edit2 size={24} />
                  </button>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-4 mt-6">
                <p className="text-zinc-200 font-black flex items-center gap-3 bg-zinc-900 px-5 py-2.5 rounded-full border border-zinc-800 shadow-xl text-sm uppercase tracking-widest">
                  <Users size={16} className="text-red-500" />
                  {activeCircle.members.length} Peserta
                </p>
                <p className="text-zinc-500 text-xs font-mono uppercase bg-zinc-900/50 px-4 py-2 rounded-full border border-zinc-800/50">
                  EST. {new Date(activeCircle.createdAt).getFullYear()}
                </p>
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

          {/* Search Bar */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-8 flex items-center pointer-events-none text-zinc-600 group-focus-within:text-red-500 transition-colors">
              <Search size={28} />
            </div>
            <input
              type="text"
              placeholder={`CARI NAMA DI ${activeCircle.name}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/50 border-2 border-zinc-800/50 rounded-3xl py-7 pl-20 pr-10 shadow-2xl focus:ring-8 focus:ring-red-600/5 focus:border-red-600/40 outline-none transition-all placeholder:text-zinc-800 text-2xl font-black text-white italic uppercase tracking-tighter"
            />
          </div>
        </header>

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
                className="bg-zinc-900/40 p-8 rounded-[2rem] border border-zinc-800/50 shadow-sm hover:shadow-2xl hover:shadow-red-600/10 hover:-translate-y-2 hover:border-red-600/30 transition-all group relative overflow-hidden backdrop-blur-sm"
              >
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-black text-3xl shadow-2xl shadow-red-950 group-hover:rotate-12 transition-transform">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-zinc-100 text-2xl truncate group-hover:text-red-500 transition-colors leading-tight italic uppercase">{member.name}</h3>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
                      <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em]">
                        Verified Member
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => {
                        setMemberToEdit(member);
                        setEditMemberNameValue(member.name);
                      }}
                      className="p-3 text-zinc-600 hover:text-red-500 hover:bg-red-600/10 rounded-xl transition-all md:opacity-0 md:group-hover:opacity-100"
                      title="Edit"
                    >
                      <Edit2 size={20} />
                    </button>
                    <button 
                      onClick={() => removeMember(member.id)}
                      className="p-3 text-zinc-600 hover:text-red-600 hover:bg-red-600/10 rounded-xl transition-all md:opacity-0 md:group-hover:opacity-100"
                      title="Hapus"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
                
                {/* Visual Flair */}
                <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-red-600/2 rounded-full blur-3xl group-hover:bg-red-600/5 transition-colors duration-700" />
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredMembers.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="col-span-full flex flex-col items-center justify-center py-40 text-center rounded-[3rem] border-4 border-dashed border-zinc-800 bg-zinc-900/20"
            >
              <div className="w-32 h-32 bg-zinc-800/50 rounded-full flex items-center justify-center text-zinc-700 mb-10 group relative">
                <Users size={64} className="group-hover:text-red-600 transition-colors" />
                <div className="absolute inset-0 bg-red-600/5 rounded-full blur-2xl animate-pulse" />
              </div>
              <h3 className="text-3xl font-black text-zinc-300 tracking-tighter uppercase italic">Tidak Menemukan Nama</h3>
              <p className="text-zinc-500 max-w-sm mx-auto mt-4 text-xl font-medium leading-relaxed">
                Waduh, nggak ada yang namanya "{searchQuery}" di sini.
              </p>
              <button 
                onClick={() => setSearchQuery('')}
                className="mt-10 bg-zinc-800 hover:bg-red-600 text-zinc-100 font-black text-lg px-8 py-3 rounded-full transition-all active:scale-95 uppercase tracking-widest"
                id="reset-search"
              >
                Reset Cari
              </button>
            </motion.div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="md:ml-64 p-16 text-center border-t border-zinc-900 bg-black/20">
        <div className="max-w-md mx-auto space-y-6">
          <div className="flex justify-center gap-3">
            {[1, 2, 3].map(i => <div key={i} className="w-12 h-1 bg-zinc-800 rounded-full group-hover:bg-red-600 transition-colors" />)}
          </div>
          <p className="text-zinc-500 font-black text-base tracking-[0.5em] uppercase italic">
            MARGA <span className="text-red-600">13</span>
          </p>
          <div className="pt-4 space-y-2">
            <p className="text-[10px] text-zinc-700 font-mono uppercase tracking-widest">
              Secured & local persistence active
            </p>
            <p className="text-[9px] text-zinc-800 uppercase tracking-widest">
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
              className="relative w-full max-w-lg bg-zinc-900 rounded-[3rem] shadow-[0_0_100px_rgba(220,38,38,0.1)] p-12 overflow-hidden border border-zinc-800"
            >
              <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-red-600 via-red-500 to-red-800" />
              
              <div className="flex justify-between items-start mb-14 text-white">
                <div>
                  <h2 className="text-5xl font-black leading-none italic uppercase tracking-tighter">Tambah</h2>
                  <h2 className="text-5xl font-black text-red-600 mt-2 leading-none italic uppercase tracking-tighter">Peserta</h2>
                  <div className="h-2 w-20 bg-red-600/30 mt-6 rounded-full" />
                </div>
                <button 
                  onClick={() => setIsAddingMember(false)} 
                  className="p-4 hover:bg-zinc-800 rounded-3xl transition-colors text-zinc-600 hover:text-red-500"
                >
                  <X size={36} />
                </button>
              </div>
              
              <div className="space-y-10">
                <div className="space-y-4">
                  <label className="block text-[11px] font-black text-zinc-400 uppercase tracking-[0.4em] ml-4">Informasi Nama Teman</label>
                  <input
                    autoFocus
                    type="text"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addMember()}
                    placeholder="E.G. ANDREAS BLACK"
                    className="w-full bg-zinc-950 border-4 border-zinc-950 rounded-[1.5rem] py-7 px-8 focus:bg-black focus:border-red-600/30 outline-none transition-all text-2xl font-black text-white italic uppercase placeholder:text-zinc-800"
                  />
                </div>
                
                <button 
                  onClick={addMember}
                  disabled={!newMemberName.trim()}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-8 rounded-[1.5rem] font-black shadow-2xl shadow-red-950 disabled:opacity-20 disabled:shadow-none transition-all active:scale-95 text-2xl tracking-tighter italic uppercase"
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
              className="relative w-full max-w-lg bg-zinc-900 rounded-[3rem] shadow-[0_0_100px_rgba(220,38,38,0.1)] p-12 overflow-hidden border border-zinc-800"
            >
              <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-red-600 to-zinc-900" />
              
              <div className="flex justify-between items-start mb-14 text-white">
                <div>
                  <h2 className="text-5xl font-black leading-none italic uppercase tracking-tighter">Edit</h2>
                  <h2 className="text-5xl font-black text-red-600 mt-2 leading-none italic uppercase tracking-tighter">Identitas</h2>
                  <div className="h-2 w-20 bg-red-600/30 mt-6 rounded-full" />
                </div>
                <button 
                  onClick={() => { setMemberToEdit(null); setEditMemberNameValue(''); }} 
                  className="p-4 hover:bg-zinc-800 rounded-3xl transition-colors text-zinc-600 hover:text-red-500"
                >
                  <X size={36} />
                </button>
              </div>
              
              <div className="space-y-10">
                <div className="space-y-4">
                  <label className="block text-[11px] font-black text-zinc-400 uppercase tracking-[0.4em] ml-4">Ubah Nama Terdaftar</label>
                  <input
                    autoFocus
                    type="text"
                    value={editMemberNameValue}
                    onChange={(e) => setEditMemberNameValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && updateMember()}
                    placeholder="E.G. ANDREAS BLACK"
                    className="w-full bg-zinc-950 border-4 border-zinc-950 rounded-[2rem] py-7 px-8 focus:bg-black focus:border-red-600/30 outline-none transition-all text-2xl font-black text-white italic uppercase"
                  />
                </div>
                
                <button 
                  onClick={updateMember}
                  disabled={!editMemberNameValue.trim() || editMemberNameValue === memberToEdit.name}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-8 rounded-[2rem] font-black shadow-2xl shadow-red-950 disabled:opacity-20 disabled:shadow-none transition-all active:scale-95 text-2xl tracking-tighter uppercase italic"
                >
                  Perbarui Identitas
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
