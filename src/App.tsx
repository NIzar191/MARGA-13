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
    <div className="min-h-screen bg-[#F9F9FB] text-slate-900 font-sans selection:bg-indigo-100">
      {/* Mobile Top Header */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <Users size={16} />
          </div>
          <span className="font-bold text-slate-800 tracking-tight">MARGA 13</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar - Desktop */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 p-6 hidden md:block">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
            <Users size={20} />
          </div>
          <span className="font-bold text-xl tracking-tight text-indigo-900">Marga Manager</span>
        </div>

        <nav className="space-y-1">
          <div className="flex items-center justify-between px-2 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Circles Anda</span>
            <button 
              onClick={createNewCircle}
              className="p-1 hover:bg-slate-100 rounded-md text-slate-500 transition-colors"
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
              className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-all group ${
                activeCircleId === c.id 
                ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50 active:scale-[0.98]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Circle size={14} className={activeCircleId === c.id ? 'fill-indigo-600' : 'text-slate-300'} />
                <span className="font-medium truncate max-w-[140px]">{c.name}</span>
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
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute left-0 top-0 h-full w-4/5 bg-white shadow-2xl p-6"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                    <Users size={20} />
                  </div>
                  <span className="font-bold text-xl tracking-tight text-indigo-900">Marga</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400">
                  <X size={24} />
                </button>
              </div>

              <nav className="space-y-1">
                <div className="flex items-center justify-between px-2 mb-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Circles Anda</span>
                  <button onClick={createNewCircle} className="p-1 bg-slate-100 rounded-md">
                    <Plus size={16} />
                  </button>
                </div>
                {circles.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setActiveCircleId(c.id); setIsMobileMenuOpen(false); }}
                    className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-4 ${
                      activeCircleId === c.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600'
                    }`}
                  >
                    <Circle size={14} className={activeCircleId === c.id ? 'fill-indigo-600' : 'text-slate-300'} />
                    <span className="font-bold">{c.name}</span>
                  </button>
                ))}
              </nav>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="md:ml-64 p-4 md:p-10 max-w-5xl mx-auto min-h-screen">
        {/* Header */}
        <header className="mb-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="group">
              {isEditingCircleName ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={editingNameValue}
                    onChange={(e) => setEditingNameValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && updateCircleName()}
                    onBlur={() => updateCircleName()}
                    className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 bg-transparent border-b-4 border-indigo-600 outline-none focus:ring-0 px-0 py-1"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                    {activeCircle.name}
                  </h1>
                  <button 
                    onClick={() => { setIsEditingCircleName(true); setEditingNameValue(activeCircle.name); }}
                    className="p-2 text-slate-300 hover:text-indigo-600 transition-colors md:opacity-0 md:group-hover:opacity-100"
                    id="edit-btn-header"
                  >
                    <Edit2 size={24} />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-4 mt-2">
                <p className="text-slate-500 font-medium flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm text-sm">
                  <Users size={14} className="text-indigo-500" />
                  {activeCircle.members.length} Peserta
                </p>
                <div className="h-4 w-px bg-slate-200 hidden sm:block" />
                <p className="text-slate-400 text-xs hidden sm:block font-mono">
                  Dibuat {new Date(activeCircle.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <button 
              onClick={() => setIsAddingMember(true)}
              className="inline-flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-5 rounded-3xl font-black shadow-2xl shadow-indigo-200 transition-all active:scale-95 text-xl relative overflow-hidden group/btn"
              id="add-member-top"
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover/btn:opacity-10 transition-opacity" />
              <UserPlus size={26} />
              Tambah Teman
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-300 group-focus-within:text-indigo-600 transition-colors">
              <Search size={24} />
            </div>
            <input
              type="text"
              placeholder={`Cari peserta di ${activeCircle.name}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border-2 border-slate-100 rounded-[2rem] py-6 pl-16 pr-8 shadow-sm focus:ring-8 focus:ring-indigo-50 focus:border-indigo-400 outline-none transition-all placeholder:text-slate-200 text-xl font-medium"
            />
          </div>
        </header>

        {/* Member Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredMembers.map((member) => (
              <motion.div
                layout
                key={member.id}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-600/5 hover:-translate-y-1 hover:border-indigo-100 transition-all group relative overflow-hidden"
              >
                <div className="flex items-center gap-5 relative z-10">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-indigo-200 group-hover:rotate-6 transition-transform">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-slate-800 text-xl truncate group-hover:text-indigo-600 transition-colors">{member.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
                        Active Member
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button 
                      onClick={() => {
                        setMemberToEdit(member);
                        setEditMemberNameValue(member.name);
                      }}
                      className="p-2 text-slate-100 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all md:opacity-0 md:group-hover:opacity-100"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => removeMember(member.id)}
                      className="p-2 text-slate-100 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all md:opacity-0 md:group-hover:opacity-100"
                      title="Hapus"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                {/* Visual Flair */}
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-slate-50 rounded-full blur-3xl group-hover:bg-indigo-50 transition-colors duration-500" />
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredMembers.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="col-span-full flex flex-col items-center justify-center py-32 text-center rounded-[3rem] border-4 border-dashed border-slate-100 bg-white/50"
            >
              <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-200 mb-8 animate-bounce">
                <Users size={48} />
              </div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Tidak Ada Hasil</h3>
              <p className="text-slate-500 max-w-xs mx-auto mt-3 text-lg leading-relaxed">
                Waduh! Nama yang kamu cari nggak ada di <b>{activeCircle.name}</b> nih.
              </p>
              <button 
                onClick={() => setSearchQuery('')}
                className="mt-8 text-indigo-600 font-black text-lg hover:bg-indigo-50 px-6 py-2 rounded-full transition-colors"
                id="reset-search"
              >
                Reset Pencarian
              </button>
            </motion.div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="md:ml-64 p-10 text-center">
        <div className="max-w-xs mx-auto space-y-4">
          <div className="flex justify-center gap-1">
            {[1, 2, 3].map(i => <div key={i} className="w-8 h-1 bg-slate-100 rounded-full" />)}
          </div>
          <p className="text-slate-400 font-bold text-sm tracking-widest uppercase">
            &copy; {new Date().getFullYear()} MARGA 13
          </p>
          <p className="text-[10px] text-slate-300 font-mono">
            Data persists in your local storage
          </p>
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
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 100 }}
              transition={{ type: 'spring', damping: 20 }}
              className="relative w-full max-w-md bg-white rounded-[3rem] shadow-2xl p-10 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-indigo-600 to-violet-600" />
              
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 leading-none">Tambah</h2>
                  <h2 className="text-3xl font-black text-indigo-600 mt-1 leading-none">Peserta</h2>
                  <div className="h-1 w-12 bg-slate-100 mt-4 rounded-full" />
                </div>
                <button 
                  onClick={() => setIsAddingMember(false)} 
                  className="p-3 hover:bg-slate-50 rounded-2xl transition-colors text-slate-300 hover:text-slate-600"
                >
                  <X size={32} />
                </button>
              </div>
              
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Nama Lengkap Teman</label>
                  <input
                    autoFocus
                    type="text"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addMember()}
                    placeholder="Contoh: Andi Wijaya"
                    className="w-full bg-slate-50 border-4 border-slate-50 rounded-[1.5rem] py-5 px-6 focus:bg-white focus:border-indigo-100 outline-none transition-all text-xl font-bold text-slate-800 placeholder:text-slate-200"
                  />
                </div>
                
                <button 
                  onClick={addMember}
                  disabled={!newMemberName.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6 rounded-[1.5rem] font-black shadow-2xl shadow-indigo-200 disabled:opacity-20 disabled:shadow-none transition-all active:scale-95 text-xl tracking-tight"
                >
                  Simpan Sekarang
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
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 100 }}
              transition={{ type: 'spring', damping: 20 }}
              className="relative w-full max-w-md bg-white rounded-[3rem] shadow-2xl p-10 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-teal-500 to-indigo-600" />
              
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 leading-none">Edit</h2>
                  <h2 className="text-3xl font-black text-teal-600 mt-1 leading-none">Peserta</h2>
                  <div className="h-1 w-12 bg-slate-100 mt-4 rounded-full" />
                </div>
                <button 
                  onClick={() => { setMemberToEdit(null); setEditMemberNameValue(''); }} 
                  className="p-3 hover:bg-slate-50 rounded-2xl transition-colors text-slate-300 hover:text-slate-600"
                >
                  <X size={32} />
                </button>
              </div>
              
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Ubah Nama Teman</label>
                  <input
                    autoFocus
                    type="text"
                    value={editMemberNameValue}
                    onChange={(e) => setEditMemberNameValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && updateMember()}
                    placeholder="Contoh: Andi Wijaya"
                    className="w-full bg-slate-50 border-4 border-slate-50 rounded-[1.5rem] py-5 px-6 focus:bg-white focus:border-indigo-100 outline-none transition-all text-xl font-bold text-slate-800"
                  />
                </div>
                
                <button 
                  onClick={updateMember}
                  disabled={!editMemberNameValue.trim() || editMemberNameValue === memberToEdit.name}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white py-6 rounded-[1.5rem] font-black shadow-2xl shadow-teal-200 disabled:opacity-20 disabled:shadow-none transition-all active:scale-95 text-xl tracking-tight"
                >
                  Perbarui Nama
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
