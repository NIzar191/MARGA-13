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
  MessageCircle,
  Trophy,
  Crosshair,
  Swords,
  PieChart,
  History,
  ShieldCheck,
  TrendingUp,
  Volume2,
  VolumeX,
  Clock,
  Zap,
  Activity,
  Settings2,
  CheckCircle2,
  BarChart3,
  Flame,
  Award,
  Bell,
  Calendar,
  Sparkles,
  Palette,
  Timer,
  Dices,
  Music,
  Play,
  Pause,
  Volume1
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip,
  BarChart,
  Bar,
  Cell
} from 'recharts';
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

interface ScheduleItem {
  id: string;
  title: string;
  date: number;
  location: string;
  type: 'Tournament' | 'Mabar' | 'Sparing';
}

interface PollOption {
  id: string;
  text: string;
  votes: string[]; // member IDs
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  allowMultiple: boolean;
  createdAt: number;
  expiresAt?: number;
}

interface CircleData {
  id: string;
  name: string;
  members: Member[];
  whatsappGroupLink?: string;
  announcement?: string;
  nextMabar?: number;
  mabarLocation?: string;
  activities?: { id: string; text: string; time: number }[];
  moments?: { id: string; url: string; caption?: string; time: number }[];
  matches?: { id: string; opponent: string; score: string; result: 'WIN' | 'LOSE'; date: number }[];
  polls?: Poll[];
  schedule?: ScheduleItem[];
  socialLinks?: { type: string; url: string }[];
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
      achievements: ['FOUNDER', 'ELITE', 'MVP'], 
      addedAt: Date.now() 
    }
  ],
  announcement: 'Selamat datang di Circle By Zyy! Tetap solid dan hargai sesama member.',
  nextMabar: Date.now() + 86400000, // Besok
  mabarLocation: 'Custom Room / Ranked',
  activities: [
    { id: '1', text: 'Circle By Zyy resmi dibuat!', time: Date.now() - 86400000 }
  ],
  moments: [],
  createdAt: 1715000000000
};

export default function App() {
  const [circles, setCircles] = useState<CircleData[]>(() => {
    const saved = localStorage.getItem('circles_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed) || parsed.length === 0) return [DEFAULT_CIRCLE];

        // Migration: Ensure all members have the new required fields
        return parsed.map((circle: any) => ({
          ...circle,
          members: (circle.members || []).map((m: any) => ({
            ...m,
            role: m.role || 'Member',
            achievements: m.achievements || [],
            skillLevel: m.skillLevel ?? 50
          })),
          activities: circle.activities || [],
          moments: circle.moments || [],
          matches: circle.matches || [],
          polls: circle.polls || [],
          schedule: circle.schedule || [],
          socialLinks: circle.socialLinks || []
        }));
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
  const [isAddingMoment, setIsAddingMoment] = useState(false);
  const [momentCaption, setMomentCaption] = useState('');
  const [momentImage, setMomentImage] = useState<string | undefined>();
  const [announcementValue, setAnnouncementValue] = useState('');
  const [whatsappLinkValue, setWhatsappLinkValue] = useState('');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isAddingMatch, setIsAddingMatch] = useState(false);
  const [matchOpponent, setMatchOpponent] = useState('');
  const [matchScore, setMatchScore] = useState('');
  const [matchResult, setMatchResult] = useState<'WIN' | 'LOSE'>('WIN');
  const [isAddingPoll, setIsAddingPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [notifications, setNotifications] = useState<{ id: string; text: string; type: 'success' | 'error' | 'info' }[]>([]);
  const [theme, setTheme] = useState<'classic' | 'neon' | 'minimal'>(() => (localStorage.getItem('theme_accent') as any) || 'classic');
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [isShowingSplitter, setIsShowingSplitter] = useState(false);
  const [splitterMembers, setSplitterMembers] = useState<string[]>([]);
  const [splitTeams, setSplitTeams] = useState<{ teamA: Member[], teamB: Member[] } | null>(null);
  const [isPlayingBGM, setIsPlayingBGM] = useState(false);
  const [bgmVolume, setBgmVolume] = useState(0.3);
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleType, setScheduleType] = useState<ScheduleItem['type']>('Mabar');
  const [scheduleLocation, setScheduleLocation] = useState('');

  const addNotification = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme_preference');
    return saved ? saved === 'dark' : true; // Default to dark as requested earlier
  });

  const playSound = (freq: number = 880, type: OscillatorType = 'sine', duration: number = 0.1) => {
    if (!isAudioEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn('Audio feedback failed');
    }
  };

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    playSound(440);
  };

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('circles_data', JSON.stringify(circles));
  }, [circles]);

  useEffect(() => {
    localStorage.setItem('theme_preference', isDark ? 'dark' : 'light');
    localStorage.setItem('theme_accent', theme);
  }, [isDark, theme]);

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

  const getBadgeIcon = (achievement: string) => {
    const ach = achievement.toUpperCase();
    if (ach === 'FOUNDER' || ach === 'OWNER') return <ShieldCheck size={10} className="text-red-500" />;
    if (ach === 'MVP' || ach === 'ELITE') return <Trophy size={10} className="text-yellow-500" />;
    if (ach === 'MVP WIN' || ach === 'KILLER') return <Crosshair size={10} className="text-orange-500" />;
    if (ach === 'ACTIVE' || ach === 'SOLID') return <Activity size={10} className="text-green-500" />;
    if (ach === 'VETERAN') return <History size={10} className="text-blue-500" />;
    return <Zap size={10} className="text-zinc-500" />;
  };

  const activeCircle = useMemo(() => 
    circles.find(c => c.id === activeCircleId) || circles[0], 
  [circles, activeCircleId]);

  const stats = useMemo(() => {
    const members = activeCircle.members;
    if (members.length === 0) return { avgSkill: 0, powerLevel: 0, eliteCount: 0, level: 1, exp: 0, nextExp: 1000 };
    
    const totalSkill = members.reduce((acc, m) => acc + (m.skillLevel || 0), 0);
    const avgSkill = Math.round(totalSkill / members.length);
    const powerLevel = totalSkill;
    const eliteCount = members.filter(m => (m.skillLevel || 0) > 80).length;
    
    // Level calculation: Every 500 power level is 1 level
    const level = Math.floor(powerLevel / 500) + 1;
    const exp = powerLevel % 500;
    const nextExp = 500;
    
    // Distribution for chart
    const roleDistribution = members.reduce((acc: any[], m) => {
      const existing = acc.find(x => x.name === m.role);
      if (existing) existing.value++;
      else acc.push({ name: m.role || 'Member', value: 1 });
      return acc;
    }, []);

    const skillHistory = [
      { name: 'Jan', power: Math.floor(powerLevel * 0.7) },
      { name: 'Feb', power: Math.floor(powerLevel * 0.8) },
      { name: 'Mar', power: Math.floor(powerLevel * 0.85) },
      { name: 'Apr', power: Math.floor(powerLevel * 0.95) },
      { name: 'May', power: powerLevel },
    ];
    
    return { avgSkill, powerLevel, eliteCount, level, exp, nextExp, roleDistribution, skillHistory };
  }, [activeCircle.members]);

  const addActivity = (text: string) => {
    setCircles(prev => prev.map(c => {
      if (c.id === activeCircleId) {
        const newActivity = { id: Math.random().toString(36).substr(2, 9), text, time: Date.now() };
        return { 
          ...c, 
          activities: [newActivity, ...(c.activities || [])].slice(0, 20) 
        };
      }
      return c;
    }));
  };

  const addMoment = () => {
    if (!momentImage) return;
    const newMoment = {
      id: Math.random().toString(36).substr(2, 9),
      url: momentImage,
      caption: momentCaption.trim(),
      time: Date.now()
    };
    setCircles(prev => prev.map(c => {
      if (c.id === activeCircleId) {
        addActivity('Momen baru ditambahkan ke galeri!');
        return { ...c, moments: [newMoment, ...(c.moments || [])] };
      }
      return c;
    }));
    setMomentImage(undefined);
    setMomentCaption('');
    setIsAddingMoment(false);
  };

  const removeMoment = (id: string) => {
    if (!confirm('Hapus momen ini?')) return;
    setCircles(prev => prev.map(c => {
      if (c.id === activeCircleId) {
        return { ...c, moments: (c.moments || []).filter(m => m.id !== id) };
      }
      return c;
    }));
    playSound(440, 'square');
  };

  const addMatch = () => {
    if (!matchOpponent || !matchScore) return;
    const newMatch = {
      id: Math.random().toString(36).substr(2, 9),
      opponent: matchOpponent.toUpperCase(),
      score: matchScore,
      result: matchResult,
      date: Date.now()
    };
    setCircles(prev => prev.map(c => {
      if (c.id === activeCircleId) {
        addActivity(`Match Baru: ${newMatch.result} vs ${newMatch.opponent}`);
        return { ...c, matches: [newMatch, ...(c.matches || [])] };
      }
      return c;
    }));
    playSound(880, 'sine', 0.2);
    setMatchOpponent('');
    setMatchScore('');
    setIsAddingMatch(false);
  };
  
  const addPoll = () => {
    if (!pollQuestion.trim() || pollOptions.some(o => !o.trim())) return;
    
    const newPoll: Poll = {
      id: Math.random().toString(36).substr(2, 9),
      question: pollQuestion.trim(),
      options: pollOptions.map(o => ({
        id: Math.random().toString(36).substr(2, 9),
        text: o.trim(),
        votes: []
      })),
      allowMultiple: false,
      createdAt: Date.now()
    };
    
    setCircles(prev => prev.map(c => {
      if (c.id === activeCircleId) {
        addActivity(`VOTING BARU: ${newPoll.question}`);
        return { ...c, polls: [newPoll, ...(c.polls || [])] };
      }
      return c;
    }));
    
    playSound(770, 'sine', 0.2);
    setPollQuestion('');
    setPollOptions(['', '']);
    setIsAddingPoll(false);
  };
  
  const votePoll = (pollId: string, optionId: string) => {
    if (!claimedMemberId) {
      alert('Pilih identitas Anda terlebih dahulu untuk voting!');
      setIsChoosingIdentity(true);
      return;
    }
    
    setCircles(prev => prev.map(c => {
      if (c.id === activeCircleId) {
        const polls = (c.polls || []).map(p => {
          if (p.id === pollId) {
            return {
              ...p,
              options: p.options.map(o => {
                const hasVoted = o.votes.includes(claimedMemberId);
                if (o.id === optionId) {
                  return {
                    ...o,
                    votes: hasVoted 
                      ? o.votes.filter(id => id !== claimedMemberId) 
                      : [...o.votes, claimedMemberId]
                  };
                }
                // If single choice, remove from other options
                if (!p.allowMultiple && !hasVoted) {
                   return { ...o, votes: o.votes.filter(id => id !== claimedMemberId) };
                }
                return o;
              })
            };
          }
          return p;
        });
        return { ...c, polls };
      }
      return c;
    }));
    playSound(660, 'sine', 0.05);
  };

  const removePoll = (id: string) => {
    if (!confirm('Hapus voting ini?')) return;
    setCircles(prev => prev.map(c => {
      if (c.id === activeCircleId) {
        return { ...c, polls: (c.polls || []).filter(p => p.id !== id) };
      }
      return c;
    }));
    playSound(330);
    addNotification('Voting dihapus', 'info');
  };

  const addSchedule = () => {
    if (!scheduleTitle || !scheduleDate) return;
    const newItem: ScheduleItem = {
      id: Math.random().toString(36).substr(2, 9),
      title: scheduleTitle.toUpperCase(),
      date: new Date(scheduleDate).getTime(),
      type: scheduleType,
      location: scheduleLocation || 'Custom Room'
    };
    setCircles(prev => prev.map(c => {
      if (c.id === activeCircleId) {
        addActivity(`AGENDA BARU: ${newItem.title}`);
        return { ...c, schedule: [newItem, ...(c.schedule || [])].sort((a,b) => a.date - b.date) };
      }
      return c;
    }));
    playSound(880);
    addNotification('Agenda berhasil ditambah!');
    setIsAddingSchedule(false);
    setScheduleTitle('');
    setScheduleDate('');
  };

  const removeSchedule = (id: string) => {
    setCircles(prev => prev.map(c => {
      if (c.id === activeCircleId) {
        return { ...c, schedule: (c.schedule || []).filter(s => s.id !== id) };
      }
      return c;
    }));
    addNotification('Agenda dihapus', 'info');
  };

  const toggleAchievement = (memberId: string, ach: string) => {
    const isLeader = activeCircle.members.find(m => m.id === claimedMemberId)?.role === 'Leader';
    if (!isLeader && claimedMemberId !== activeCircle.members.find(m => m.role === 'Leader')?.id) {
       addNotification('Hanya Leader yang bisa kelola medali!', 'error');
       return;
    }

    setCircles(prev => prev.map(c => {
      if (c.id === activeCircleId) {
        return {
          ...c,
          members: c.members.map(m => {
            if (m.id === memberId) {
              const has = m.achievements.includes(ach);
              const newAchs = has ? m.achievements.filter(a => a !== ach) : [...m.achievements, ach];
              if (selectedMember && selectedMember.id === memberId) {
                setSelectedMember({ ...m, achievements: newAchs });
              }
              return { ...m, achievements: newAchs };
            }
            return m;
          })
        };
      }
      return c;
    }));
    playSound(hasAchievement(memberId, ach) ? 440 : 880);
  };

  const hasAchievement = (memberId: string, ach: string) => {
    const member = activeCircle.members.find(m => m.id === memberId);
    return member?.achievements.includes(ach) || false;
  };

  const getTimeRemaining = (targetDate: number) => {
    const diff = targetDate - Date.now();
    if (diff <= 0) return "SEDANG BERLANGSUNG";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}J ${mins}M LAGI`;
  };

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
  const toggleTheme = toggleDarkMode;
  const addMember = () => {
    if (!newMemberName.trim()) return;
    const newMember: Member = {
      id: Math.random().toString(36).substr(2, 9),
      name: newMemberName.trim().toUpperCase(),
      avatarUrl: newMemberAvatar,
      phone: newMemberPhone.trim(),
      skillLevel: newMemberSkill,
      role: newMemberRole,
      achievements: newMemberSkill > 80 ? ['ELITE'] : [],
      addedAt: Date.now()
    };

    setCircles(prev => prev.map(c => {
      if (c.id === activeCircleId) {
        addActivity(`${newMember.name} bergabung ke Circle!`);
        return { ...c, members: [newMember, ...c.members] };
      }
      return c;
    }));
    playSound(880, 'sine', 0.2);
    addNotification(`${newMember.name} join Circle!`, 'success');
    setNewMemberName('');
    setNewMemberAvatar(undefined);
    setNewMemberPhone('');
    setIsAddingMember(false);
  };

  const removeMember = (id: string) => {
    const member = activeCircle.members.find(m => m.id === id);
    if (!confirm('Keluarkan member ini dari circle?')) return;
    setCircles(prev => prev.map(c => {
      if (c.id === activeCircleId) {
        if (member) addActivity(`${member.name} telah dikeluarkan.`);
        return { ...c, members: c.members.filter(m => m.id !== id) };
      }
      return c;
    }));
    playSound(330, 'sawtooth', 0.1);
  };
  
  const generateTeams = () => {
    if (splitterMembers.length < 2) {
      addNotification('Pilih minimal 2 orang untuk bagi tim!', 'error');
      return;
    }
    
    // Get member objects
    const selected = activeCircle.members.filter(m => splitterMembers.includes(m.id));
    
    // Sort by skill to balance
    const sorted = [...selected].sort((a, b) => (b.skillLevel || 0) - (a.skillLevel || 0));
    const teamA: Member[] = [];
    const teamB: Member[] = [];
    
    // Snake draft to balance skill
    sorted.forEach((m, idx) => {
      if (idx % 2 === 0) teamA.push(m);
      else teamB.push(m);
    });
    
    // Shuffle slightly if same skill levels
    setSplitTeams({ teamA, teamB });
    playSound(880, 'square', 0.15);
    addNotification('Tim Berhasil Dibagi!', 'success');
  };

  const playTaunt = (freq: number) => {
    playSound(freq, 'sawtooth', 0.3);
    addNotification('Taunt dikirim!', 'info');
  };

  const updateCircleName = () => {
    if (!editingNameValue.trim()) {
      setIsEditingCircleName(false);
      return;
    }
    setCircles(prev => prev.map(c => {
      if (c.id === activeCircleId) {
        addActivity(`Nama Circle diganti: ${editingNameValue}`);
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
        addActivity(`Update profil: ${editMemberNameValue}`);
        return {
          ...c,
          members: c.members.map(m => 
            m.id === memberToEdit.id ? { 
              ...m, 
              name: editMemberNameValue.trim().toUpperCase(),
              avatarUrl: editMemberAvatar,
              phone: editMemberPhone.trim(),
              skillLevel: editMemberSkill,
              role: editMemberRole,
              achievements: memberToEdit.achievements
            } : m
          )
        };
      }
      return c;
    }));
    playSound(660, 'sine', 0.15);
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

  const handleMomentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File terlalu besar! Maksimal 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setMomentImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${isDark ? 'bg-zinc-950 text-zinc-50 selection:bg-red-900/30' : 'bg-slate-50 text-slate-900 selection:bg-red-100'}`}>
      {/* Toast Notifications */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              className={`px-6 py-4 rounded-2xl flex items-center gap-4 shadow-2xl backdrop-blur-xl border pointer-events-auto ${
                n.type === 'success' ? 'bg-green-600/10 border-green-600/30 text-green-500' :
                n.type === 'error' ? 'bg-red-600/10 border-red-600/30 text-red-500' :
                'bg-blue-600/10 border-blue-600/30 text-blue-500'
              }`}
            >
              {n.type === 'success' ? <CheckCircle2 size={18} /> : n.type === 'error' ? <X size={18} /> : <Bell size={18} />}
              <span className="text-[11px] font-black uppercase tracking-widest">{n.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

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

          <div className="mt-10 px-2 space-y-2">
            <button 
              onClick={() => { setIsShowingSplitter(true); playSound(660); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isShowingSplitter 
                ? (isDark ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-indigo-50 text-indigo-600') 
                : (isDark ? 'text-zinc-500 hover:bg-zinc-900' : 'text-slate-400 hover:bg-slate-50')
              }`}
            >
              <Dices size={18} />
              <span className="font-bold text-sm uppercase tracking-wider">Team Splitter</span>
            </button>
            
            <div className="pt-6">
              <span className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>Music Player</span>
              <div className={`mt-3 p-3 rounded-2xl border flex items-center justify-between ${isDark ? 'bg-zinc-950 border-zinc-900' : 'bg-slate-50 border-slate-100'}`}>
                 <button 
                  onClick={() => { setIsPlayingBGM(!isPlayingBGM); playSound(550); }}
                  className={`p-2 rounded-lg transition-all ${isPlayingBGM ? 'text-red-500' : 'text-zinc-600'}`}
                 >
                   {isPlayingBGM ? <Pause size={16} /> : <Play size={16} />}
                 </button>
                 <div className="flex-1 px-3">
                   <div className={`h-1 rounded-full w-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-slate-200'}`}>
                      <motion.div 
                        animate={{ x: isPlayingBGM ? [0, 50, 0] : 0 }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="h-full w-20 bg-red-600" 
                      />
                   </div>
                 </div>
                 <Music size={14} className={isPlayingBGM ? 'animate-bounce text-red-500' : 'text-zinc-600'} />
              </div>
            </div>
          </div>
        </div>

        {/* Theme Toggle Desktop */}
        <div className="pt-6 border-t border-zinc-800/10 mt-auto space-y-4">
          <div className="px-2">
            <span className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>Tampilan & Tema</span>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {(['classic', 'neon', 'minimal'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => { setTheme(t); playSound(770); }}
                  className={`w-full aspect-square rounded-xl border flex items-center justify-center transition-all ${
                    theme === t 
                    ? (isDark ? 'bg-red-600/20 border-red-600' : 'bg-red-50 border-red-600') 
                    : (isDark ? 'bg-zinc-800 border-zinc-950 text-zinc-600' : 'bg-slate-50 border-slate-100 text-slate-300')
                  }`}
                >
                  <Palette size={16} />
                </button>
              ))}
            </div>
          </div>
          <button 
            onClick={toggleTheme}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              isDark 
              ? 'bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            <span className="font-bold text-sm uppercase tracking-wider">{isDark ? 'Light' : 'Dark'}</span>
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
                
                {/* Visual Settings */}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => { setIsAudioEnabled(!isAudioEnabled); playSound(660); }}
                    className={`p-2.5 rounded-xl border transition-all ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-100 shadow-sm'}`}
                    title="Toggle Audio"
                  >
                    {isAudioEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                  </button>
                  <button 
                    onClick={() => { toggleDarkMode(); playSound(550); }}
                    className={`p-2.5 rounded-xl border transition-all ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-100 shadow-sm'}`}
                  >
                   {isDark ? <Sun size={14} /> : <Moon size={14} />}
                  </button>
                </div>

                {/* Social Shortcuts */}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      const type = prompt('Tipe Social (TikTok/Discord/YouTube):') as any;
                      const url = prompt('URL Link:');
                      if (type && url) {
                        setCircles(prev => prev.map(c => c.id === activeCircleId ? { ...c, socialLinks: [...(c.socialLinks || []), { type, url }] } : c));
                        addActivity(`Link ${type} ditambahkan!`);
                      }
                    }}
                    className={`p-2 rounded-lg border border-dashed text-xs ${isDark ? 'border-zinc-800 text-zinc-600' : 'border-slate-200 text-slate-300'}`}
                  >
                    <Plus size={14} />
                  </button>
                  {activeCircle.socialLinks?.map((link, idx) => (
                    <a 
                      key={idx} 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border transition-all hover:-translate-y-1 ${
                        link.type === 'TikTok' ? 'bg-black text-white' :
                        link.type === 'Discord' ? 'bg-indigo-600 text-white' :
                        (isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-100 text-slate-600')
                      }`}
                    >
                      {link.type}
                    </a>
                  ))}
                </div>

                {!activeCircle.announcement && (
                  <>
                    <button 
                      onClick={() => {
                        const newLocation = prompt('Lokasi / Room Mabar:', activeCircle.mabarLocation || 'Custom Room');
                        if (newLocation !== null) {
                          setCircles(prev => prev.map(c => c.id === activeCircleId ? { ...c, mabarLocation: newLocation, nextMabar: Date.now() + 3600000 } : c));
                        }
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full border border-dashed text-xs font-black uppercase transition-all hover:bg-zinc-800 ${isDark ? 'border-zinc-800 text-zinc-600' : 'border-slate-200 text-slate-300'}`}
                    >
                      <Clock size={14} />
                      Reset Jadwal
                    </button>
                    <button 
                      onClick={() => { setAnnouncementValue(''); setIsEditingAnnouncement(true); }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full border border-dashed text-xs font-black uppercase transition-all hover:bg-zinc-800 ${isDark ? 'border-zinc-800 text-zinc-600' : 'border-slate-200 text-slate-300'}`}
                    >
                      <Plus size={14} />
                      Buat Pengumuman
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Announcement & Schedule Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {activeCircle.announcement && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-8 rounded-[2.5rem] border relative overflow-hidden group/ann ${isDark ? 'bg-red-600/10 border-red-600/20 text-white' : 'bg-red-50 border-red-100 text-red-900'}`}
            >
              <div className="flex items-center gap-6 relative z-10">
                <div className="bg-red-600 p-4 rounded-3xl text-white shadow-xl flex-shrink-0 w-14 h-14 flex items-center justify-center">
                  <MessageCircle size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-[0.4em] opacity-60 mb-2">Papan Pengumuman</p>
                  <p className="font-bold italic uppercase tracking-tighter leading-tight text-xl md:text-2xl">{activeCircle.announcement}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setAnnouncementValue(activeCircle.announcement || ''); setIsEditingAnnouncement(true); }}
                    className={`p-4 rounded-2xl transition-all md:opacity-0 group-hover/ann:opacity-100 ${isDark ? 'bg-zinc-950/50 hover:bg-red-600/20' : 'bg-white/50 hover:bg-red-100'}`}
                  >
                    <Edit2 size={18} />
                  </button>
                </div>
              </div>
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                <MessageCircle size={150} className="rotate-12 translate-x-12 -translate-y-12" />
              </div>
            </motion.div>
          )}
        </div>

        {/* Schedule Section */}
        <div className="grid grid-cols-1 gap-8 mb-12">
          {activeCircle.nextMabar && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-8 rounded-[2.5rem] border relative overflow-hidden group/mabar ${isDark ? 'bg-indigo-600/10 border-indigo-600/20 text-white' : 'bg-indigo-50 border-indigo-100 text-indigo-900'}`}
            >
              <div className="flex items-center gap-6 relative z-10">
                <div className="bg-indigo-600 p-4 rounded-3xl text-white shadow-xl flex-shrink-0 w-14 h-14 flex items-center justify-center">
                  <Clock size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-[0.4em] opacity-60 mb-2">Jadwal Mabar Terdekat</p>
                  <div className="flex items-center gap-4">
                    <p className="font-black italic uppercase tracking-tighter text-2xl md:text-3xl text-indigo-500">{getTimeRemaining(activeCircle.nextMabar)}</p>
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter ${isDark ? 'bg-indigo-600/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>{activeCircle.mabarLocation}</span>
                  </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                <Zap size={150} className="rotate-12 translate-x-12 -translate-y-12" />
              </div>
            </motion.div>
          )}
        </div>

        {/* Circle Power Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-slate-100 shadow-sm'}`}>
            <p className={`text-[9px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>Avg Skill</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black italic tracking-tighter">{stats.avgSkill}%</span>
              <Activity size={14} className="text-red-500" />
            </div>
          </div>
          <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-slate-100 shadow-sm'}`}>
            <p className={`text-[9px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>Power Level</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black italic tracking-tighter">{stats.powerLevel}</span>
              <Zap size={14} className="text-orange-500" />
            </div>
          </div>
          <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-slate-100 shadow-sm'}`}>
            <p className={`text-[9px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>Elite Players</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black italic tracking-tighter">{stats.eliteCount}</span>
              <Trophy size={14} className="text-yellow-500" />
            </div>
          </div>
          <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-slate-100 shadow-sm'}`}>
            <p className={`text-[9px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>Circle Level</p>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-baseline">
                <span className="text-3xl font-black italic tracking-tighter">LV. {stats.level}</span>
                <span className="text-[10px] font-bold text-zinc-500 uppercase">{stats.exp}/{stats.nextExp} XP</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(stats.exp / stats.nextExp) * 100}%` }}
                  className="h-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="mb-20 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className={`p-8 rounded-[3rem] border relative overflow-hidden ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-100 shadow-sm'}`}
          >
            <div className="flex items-center gap-4 mb-8">
              <TrendingUp size={20} className="text-red-500" />
              <h3 className="font-black italic uppercase tracking-tighter text-xl">Power Tier Distribution</h3>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.roleDistribution}>
                   <Tooltip 
                    cursor={{fill: isDark ? '#27272a' : '#f8fafc'}}
                    contentStyle={{ 
                      backgroundColor: isDark ? '#18181b' : '#ffffff',
                      border: 'none',
                      borderRadius: '1.5rem',
                      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Bar dataKey="value" radius={[12, 12, 12, 12]}>
                    {stats.roleDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#ef4444' : (isDark ? '#3f3f46' : '#e2e8f0')} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <BarChart3 size={120} />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className={`p-8 rounded-[3rem] border relative overflow-hidden ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-100 shadow-sm'}`}
          >
            <div className="flex items-center gap-4 mb-8">
              <Flame size={20} className="text-red-500" />
              <h3 className="font-black italic uppercase tracking-tighter text-xl">Circle Progress</h3>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.skillHistory}>
                  <defs>
                    <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? '#18181b' : '#ffffff',
                      border: 'none',
                      borderRadius: '1.5rem',
                      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Area animationBegin={300} type="monotone" dataKey="power" stroke="#ef4444" strokeWidth={6} fillOpacity={1} fill="url(#colorPower)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Moment Gallery Section */}
        <div className="mb-20">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <ImageIcon size={20} className="text-red-600" />
              <h2 className={`text-xl font-black italic uppercase tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>Momen Seru (Gallery)</h2>
            </div>
            <button 
              onClick={() => setIsAddingMoment(true)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${isDark ? 'bg-red-600/10 text-red-500 border border-red-600/20 hover:bg-red-600/20' : 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100'}`}
            >
              <Camera size={14} />
              Tambah Momen
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {activeCircle.moments?.length ? (
                activeCircle.moments.map((moment) => (
                  <motion.div
                    layout
                    key={moment.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="group relative aspect-[4/5] rounded-[2rem] overflow-hidden border border-white/5 bg-zinc-900"
                  >
                    <img src={moment.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                      <p className="text-white text-[10px] font-bold italic tracking-tighter uppercase mb-3">{moment.caption || 'Tanpa Caption'}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500 text-[8px] font-mono">{new Date(moment.time).toLocaleDateString()}</span>
                        <button 
                          onClick={() => removeMoment(moment.id)}
                          className="p-2 bg-red-600/20 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className={`col-span-full py-16 text-center rounded-[2rem] border-2 border-dashed ${isDark ? 'border-zinc-800 bg-zinc-900/20 text-zinc-600' : 'border-slate-100 bg-slate-50 text-slate-300'}`}>
                  <ImageIcon size={32} className="mx-auto mb-4 opacity-20" />
                  <p className="text-xs font-black uppercase tracking-widest italic">Belum ada foto kemenangan.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Circle Polls Section */}
        <div className="mb-20">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <BarChart3 size={20} className="text-red-600" />
              <h2 className={`text-xl font-black italic uppercase tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>Voting Circle (Polls)</h2>
            </div>
            <button 
              onClick={() => { setIsAddingPoll(true); playSound(990); }}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${isDark ? 'bg-indigo-600/10 text-indigo-500 border border-indigo-600/20 hover:bg-indigo-600/20' : 'bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100'}`}
            >
              <Plus size={14} />
              Mulai Voting Baru
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {activeCircle.polls?.length ? (
              activeCircle.polls.map((poll) => {
                const totalVotes = poll.options.reduce((acc, o) => acc + o.votes.length, 0);
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    key={poll.id}
                    className={`p-10 rounded-[3rem] border relative overflow-hidden group ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-100 shadow-sm'}`}
                  >
                    <div className="flex justify-between items-start mb-8">
                      <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-tight max-w-[80%]">{poll.question}</h3>
                      <button 
                        onClick={() => removePoll(poll.id)}
                        className={`p-3 rounded-xl transition-all opacity-0 group-hover:opacity-100 ${isDark ? 'text-zinc-700 hover:text-red-500 hover:bg-red-500/10' : 'text-slate-300 hover:text-red-600 hover:bg-red-50'}`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      {poll.options.map((option) => {
                        const percentage = totalVotes > 0 ? Math.round((option.votes.length / totalVotes) * 100) : 0;
                        const hasVoted = claimedMemberId && option.votes.includes(claimedMemberId);
                        
                        return (
                          <button
                            key={option.id}
                            onClick={() => votePoll(poll.id, option.id)}
                            className="w-full text-left relative group/opt overflow-hidden rounded-[1.5rem]"
                          >
                            <div className={`absolute inset-0 transition-all duration-1000 ${hasVoted ? 'bg-red-600/20' : (isDark ? 'bg-zinc-950' : 'bg-slate-50')}`} style={{ width: `${percentage}%` }} />
                            <div className={`relative z-10 px-6 py-4 border-2 flex justify-between items-center transition-all ${
                              hasVoted 
                              ? 'border-red-600/50' 
                              : (isDark ? 'border-zinc-800 group-hover/opt:border-zinc-700' : 'border-slate-50 hover:border-slate-200')
                            }`}>
                              <div className="flex items-center gap-3">
                                {hasVoted && <CheckCircle2 size={16} className="text-red-600" />}
                                <span className={`text-sm font-black uppercase tracking-tight ${hasVoted ? 'text-red-500' : (isDark ? 'text-zinc-100' : 'text-slate-900')}`}>{option.text}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-zinc-500">{option.votes.length} VOTE</span>
                                <span className={`text-sm font-black italic ${hasVoted ? 'text-red-500' : ''}`}>{percentage}%</span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-8 flex justify-between items-center">
                      <p className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>
                        Total: {totalVotes} Suara • {new Date(poll.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className={`col-span-full py-16 text-center rounded-[3rem] border-2 border-dashed ${isDark ? 'border-zinc-800 bg-zinc-900/20 text-zinc-600' : 'border-slate-100 bg-slate-50 text-slate-300'}`}>
                <BarChart3 size={32} className="mx-auto mb-4 opacity-20" />
                <p className="text-xs font-black uppercase tracking-widest italic">Belum ada pemungutan suara aktif.</p>
              </div>
            )}
          </div>
        </div>

        {/* Agenda Section */}
        <div className="mb-20">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <Calendar size={20} className="text-orange-600" />
              <h2 className={`text-xl font-black italic uppercase tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>Agenda Mabar / Turnamen</h2>
            </div>
            <button 
              onClick={() => { setIsAddingSchedule(true); playSound(990); }}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${isDark ? 'bg-orange-600/10 text-orange-500 border border-orange-600/20 hover:bg-orange-600/20' : 'bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-100'}`}
            >
              <Plus size={14} />
              Tambah Agenda
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(activeCircle.schedule || []).length > 0 ? (activeCircle.schedule || []).map(item => (
              <motion.div
                key={item.id}
                layout
                className={`p-10 rounded-[3rem] border relative overflow-hidden group transition-all ${
                  item.date < Date.now() 
                  ? (isDark ? 'bg-zinc-900/50 border-zinc-800 opacity-60' : 'bg-slate-50 border-slate-100 opacity-60')
                  : (isDark ? 'bg-zinc-900 border-zinc-800 hover:border-orange-500/30' : 'bg-white border-slate-100 shadow-sm hover:shadow-orange-100')
                }`}
              >
                <div className="flex justify-between items-start mb-8">
                   <div className={`p-4 rounded-3xl ${
                      item.type === 'Tournament' ? 'bg-yellow-500 shadow-lg shadow-yellow-500/20' : 
                      item.type === 'Sparing' ? 'bg-indigo-600 shadow-lg shadow-indigo-600/20' : 'bg-orange-600 shadow-lg shadow-orange-600/20'
                   } text-white`}>
                      {item.type === 'Tournament' ? <Trophy size={18} /> : item.type === 'Sparing' ? <Swords size={18} /> : <Zap size={18} />}
                   </div>
                   <button 
                    onClick={() => removeSchedule(item.id)}
                    className="p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity bg-red-600/10 text-red-500"
                   >
                     <Trash2 size={16} />
                   </button>
                </div>
                
                <div className="space-y-1">
                   <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>{item.type}</p>
                   <h4 className="text-2xl font-black uppercase tracking-tighter italic leading-none truncate">{item.title}</h4>
                </div>

                <div className="mt-8 space-y-3">
                   <div className="flex items-center gap-3 text-xs font-black text-zinc-500 uppercase">
                      <div className="p-2 bg-zinc-950 rounded-lg">
                        <Calendar size={12} className="text-orange-500" />
                      </div>
                      {new Date(item.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                   </div>
                   <div className="flex items-center gap-3 text-xs font-black text-zinc-500 uppercase">
                      <div className="p-2 bg-zinc-950 rounded-lg">
                        <ExternalLink size={12} className="text-orange-500" />
                      </div>
                      {item.location}
                   </div>
                </div>

                {item.date >= Date.now() && (
                  <div className={`mt-10 pt-6 border-t ${isDark ? 'border-white/5' : 'border-slate-50'} flex items-center justify-between`}>
                     <div className="flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">Live Track</span>
                     </div>
                     <span className="text-xs font-mono text-zinc-500">{getTimeRemaining(item.date)}</span>
                  </div>
                )}
              </motion.div>
            )) : (
              <div className={`col-span-full py-16 text-center rounded-[3rem] border-2 border-dashed ${isDark ? 'border-zinc-800 bg-zinc-900/20 text-zinc-600' : 'border-slate-100 bg-slate-50 text-slate-300'}`}>
                <Calendar size={32} className="mx-auto mb-4 opacity-20" />
                <p className="text-xs font-black uppercase tracking-widest italic">Belum ada agenda mabar yang direncanakan.</p>
              </div>
            )}
          </div>
        </div>

        {/* Soundboard Section */}
        <div className="mb-20">
          <div className="flex items-center gap-4 mb-8">
            <Volume2 size={20} className="text-red-600" />
            <h2 className={`text-xl font-black italic uppercase tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>Elite Interaction (Soundboard)</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { label: 'GGWP', freq: 880, color: 'bg-green-600' },
              { label: 'ATTACK', freq: 220, color: 'bg-red-600' },
              { label: 'RETREAT', freq: 440, color: 'bg-blue-600' },
              { label: 'ULTI', freq: 110, color: 'bg-purple-600' },
              { label: 'EZ', freq: 1760, color: 'bg-yellow-600' },
              { label: 'CHAMP', freq: 660, color: 'bg-indigo-600' }
            ].map((s, idx) => (
              <button
                key={idx}
                onClick={() => playTaunt(s.freq)}
                className={`flex flex-col items-center justify-center p-6 rounded-[2rem] border transition-all active:scale-90 group ${isDark ? 'bg-zinc-900 border-zinc-800 hover:border-red-500/50' : 'bg-white border-slate-100 hover:border-red-200'}`}
              >
                <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform ${s.color}`}>
                  <Volume1 size={18} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Top 3 Leaderboard Highlight */}
        {activeCircle.members.length >= 3 && (
          <div className="mb-12">
            <h2 className={`text-[10px] font-black uppercase tracking-[0.5em] mb-6 ${isDark ? 'text-zinc-700' : 'text-slate-300'}`}>Leaderboard All-Time</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...activeCircle.members].sort((a,b) => (b.skillLevel || 0) - (a.skillLevel || 0)).slice(0, 3).map((m, idx) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  key={`top-${m.id}`}
                  className={`p-6 rounded-[2.5rem] border relative overflow-hidden flex flex-col items-center justify-center text-center ${
                    idx === 0 ? 'bg-gradient-to-br from-yellow-500/20 to-transparent border-yellow-500/30' :
                    idx === 1 ? 'bg-gradient-to-br from-zinc-400/10 to-transparent border-zinc-400/30' :
                    'bg-gradient-to-br from-orange-600/10 to-transparent border-orange-600/30'
                  }`}
                >
                  <div className="relative mb-4">
                    {idx === 0 && <Trophy size={40} className="absolute -top-6 -right-6 text-yellow-500 rotate-12 drop-shadow-lg" />}
                    {idx === 1 && <Trophy size={32} className="absolute -top-4 -right-4 text-zinc-400 rotate-12 opacity-50" />}
                    {idx === 2 && <Trophy size={24} className="absolute -top-3 -right-3 text-orange-600 rotate-12 opacity-50" />}
                    
                    <div className={`w-24 h-24 rounded-3xl flex items-center justify-center text-3xl font-black italic shadow-2xl relative overflow-hidden bg-zinc-900 border-4 ${
                      idx === 0 ? 'border-yellow-500 shadow-yellow-500/20' :
                      idx === 1 ? 'border-zinc-400 shadow-zinc-400/10' :
                      'border-orange-600 shadow-orange-600/10'
                    }`}>
                      {m.avatarUrl ? (
                         <img src={m.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : m.name.charAt(0)}
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-zinc-900 px-4 py-1 rounded-full border border-white/10 text-[10px] font-black italic">
                      RANK {idx + 1}
                    </div>
                  </div>
                  <h3 className="font-black text-xl italic uppercase tracking-tighter truncate w-full">{m.name}</h3>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">{m.skillLevel}% SKILL POWER</p>
                </motion.div>
              ))}
            </div>
          </div>
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
                  <div className={`w-20 h-20 flex-shrink-0 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-2xl group-hover:rotate-12 transition-transform overflow-hidden relative ${isDark ? 'bg-gradient-to-br from-red-600 to-red-800 shadow-red-950' : 'bg-red-600 shadow-red-100'}`}>
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
                    {member.achievements.length > 0 && (
                      <div className="absolute bottom-1 right-1 bg-yellow-500 rounded-full p-1 border-2 border-red-600 shadow-lg">
                        <Trophy size={10} className="text-black" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-black text-2xl truncate transition-colors leading-tight italic uppercase ${isDark ? 'text-zinc-100 group-hover:text-red-500' : 'text-slate-800 group-hover:text-red-600'}`}>{member.name}</h3>
                    
                    {/* Achievements Badges */}
                    {member.achievements.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1 mb-2">
                        {member.achievements.map((ach, idx) => (
                          <span key={idx} className={`text-[7px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded shadow-sm border ${isDark ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' : 'bg-yellow-50 border-yellow-200 text-yellow-600'}`}>
                            {ach}
                          </span>
                        ))}
                      </div>
                    )}

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
                    {/* Achievements Badges */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {member.achievements.map((ach, idx) => (
                        <div key={idx} className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-100'}`} title={ach}>
                          {getBadgeIcon(ach)}
                          <span className={`text-[7px] font-black uppercase tracking-tighter ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>{ach}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 mt-4">
                      <div className={`w-2 h-2 rounded-full ${onlineUsers.includes(member.id) ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : (isDark ? 'bg-zinc-800' : 'bg-slate-200')} ${claimedMemberId === member.id ? 'ring-2 ring-offset-2 ring-red-500 ring-offset-zinc-900' : ''}`} />
                      <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${onlineUsers.includes(member.id) ? 'text-green-500' : (isDark ? 'text-zinc-500' : 'text-slate-400')}`}>
                        {onlineUsers.includes(member.id) ? (claimedMemberId === member.id ? 'ANDA AKTIF' : 'AKTIF DI WEB') : 'OFF DI WEB'}
                      </p>
                    </div>

                    {/* Skill Progress */}
                    <div className="mt-5">
                      <div className="flex justify-between items-end mb-1.5">
                        <span className={`text-[8px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>Combat Power</span>
                        <span className={`text-[10px] font-bold ${isDark ? 'text-zinc-400' : 'text-slate-900'}`}>{member.skillLevel}%</span>
                      </div>
                      <div className={`w-full h-1 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-slate-100'}`}>
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${member.skillLevel || 0}%` }}
                          className={`h-full ${member.skillLevel && member.skillLevel > 80 ? 'bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.3)]' : 'bg-zinc-500'}`}
                        />
                      </div>
                    </div>
                    
                    <div className="mt-6 flex gap-2">
                       <button 
                        onClick={() => { setSelectedMember(member); playSound(770); }}
                        className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 border ${isDark ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600 shadow-sm'}`}
                      >
                        Detail Profile
                      </button>
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
                        playSound(660);
                      }}
                      className={`p-3 rounded-xl transition-all md:opacity-0 md:group-hover:opacity-100 ${isDark ? 'text-zinc-600 hover:text-red-500 hover:bg-red-600/10' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`}
                      title="Edit"
                    >
                      <Settings2 size={20} />
                    </button>
                    <button 
                      onClick={() => { removeMember(member.id); playSound(330); }}
                      className={`p-3 rounded-xl transition-all md:opacity-0 md:group-hover:opacity-100 ${isDark ? 'text-zinc-600 hover:text-red-500 hover:bg-red-600/10' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`}
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

        {/* Match History Tracker */}
        <div className="mb-20">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <History size={20} className="text-red-600" />
              <h2 className={`text-xl font-black italic uppercase tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>Rekap Pertandingan</h2>
            </div>
            <button 
              onClick={() => { setIsAddingMatch(true); playSound(990); }}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${isDark ? 'bg-red-600/10 text-red-500 border border-red-600/20 hover:bg-red-600/20' : 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100'}`}
            >
              <Swords size={14} />
              Input Hasil Match
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeCircle.matches?.length ? (
              activeCircle.matches.map((match) => (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={match.id}
                  className={`p-6 rounded-[2rem] border relative overflow-hidden group ${
                    match.result === 'WIN' 
                    ? (isDark ? 'bg-green-600/5 border-green-600/20' : 'bg-green-50 border-green-100')
                    : (isDark ? 'bg-red-600/5 border-red-600/20' : 'bg-red-50 border-red-100')
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                     <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${
                       match.result === 'WIN' ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' : 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                     }`}>
                       {match.result}
                     </span>
                     <span className="text-[10px] font-mono text-zinc-500 uppercase">{new Date(match.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-[9px] font-black uppercase tracking-[0.3em] ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>Lawan</p>
                      <h4 className="text-2xl font-black italic uppercase tracking-tighter truncate max-w-[150px]">{match.opponent}</h4>
                    </div>
                    <div className="text-right">
                      <p className={`text-[9px] font-black uppercase tracking-[0.3em] ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>Skor</p>
                      <h4 className="text-3xl font-black italic uppercase tracking-tighter">{match.score}</h4>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className={`col-span-full py-16 text-center rounded-[2rem] border-2 border-dashed ${isDark ? 'border-zinc-800 bg-zinc-900/20 text-zinc-600' : 'border-slate-100 bg-slate-50 text-slate-300'}`}>
                <Swords size={32} className="mx-auto mb-4 opacity-20" />
                <p className="text-xs font-black uppercase tracking-widest italic">Deretan musuh yang tumbang belum dicatat.</p>
              </div>
            )}
          </div>
        </div>

        {/* Activity Log */}
        <div className="mb-20">
          <div className="flex items-center gap-4 mb-8">
            <Activity size={20} className="text-red-600" />
            <h2 className={`text-xl font-black italic uppercase tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>Aktivitas Circle</h2>
          </div>
          <div className={`space-y-4 p-8 rounded-[2.5rem] border ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-slate-50 border-slate-100'}`}>
            {activeCircle.activities?.length ? (
              activeCircle.activities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between gap-4 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-red-600/40' : 'bg-red-200'}`} />
                    <p className={`text-sm font-bold uppercase italic tracking-tight ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>{activity.text}</p>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-600">{new Date(activity.time).toLocaleTimeString()}</span>
                </div>
              ))
            ) : (
              <p className="text-center text-xs font-mono text-zinc-600 italic">Belum ada aktivitas tercatat.</p>
            )}
          </div>
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

      {/* Member Detail Spotlight Modal */}
      <AnimatePresence>
        {selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMember(null)}
              className="absolute inset-0 bg-black/95 backdrop-blur-3xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 100 }}
              className={`relative w-full max-w-2xl rounded-[3.5rem] overflow-hidden border transition-all ${isDark ? 'bg-zinc-900 border-zinc-800 shadow-[0_0_100px_rgba(220,38,38,0.1)]' : 'bg-white border-slate-100 shadow-2xl shadow-slate-200'}`}
            >
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-red-600/20 to-transparent" />
              
              <button 
                onClick={() => { setSelectedMember(null); playSound(440); }}
                className="absolute top-8 right-8 z-20 p-4 rounded-3xl bg-black/50 text-white hover:bg-red-600 transition-colors backdrop-blur-md"
              >
                <X size={24} />
              </button>

              <div className="p-10 pt-16 relative z-10">
                <div className="flex flex-col md:flex-row items-center gap-12 mb-12">
                   <div className={`w-48 h-48 rounded-[3rem] overflow-hidden border-8 relative group ${isDark ? 'border-zinc-800' : 'border-slate-50'}`}>
                      <div className="absolute inset-0 bg-red-600 flex items-center justify-center text-6xl font-black text-white italic">
                         {selectedMember.avatarUrl ? (
                           <img src={selectedMember.avatarUrl} className="w-full h-full object-cover" />
                         ) : selectedMember.name.charAt(0)}
                      </div>
                      {selectedMember.role === 'Leader' && (
                        <div className="absolute top-2 right-2 bg-yellow-500 p-2 rounded-xl shadow-xl">
                          <ShieldCheck size={20} className="text-black" />
                        </div>
                      )}
                   </div>
                   
                   <div className="text-center md:text-left flex-1">
                      <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                           selectedMember.role === 'Leader' ? 'bg-red-600 text-white' :
                           selectedMember.role === 'Admin' ? 'bg-orange-600 text-white' :
                           selectedMember.role === 'Pro Player' ? 'bg-indigo-600 text-white' :
                           (isDark ? 'bg-zinc-800 text-zinc-500' : 'bg-slate-100 text-slate-400')
                        }`}>
                          {selectedMember.role}
                        </span>
                        {onlineUsers.includes(selectedMember.id) && (
                          <div className="flex items-center gap-2 bg-green-600/20 text-green-500 px-3 py-1 rounded-full text-[9px] font-black uppercase">
                            <Activity size={10} /> Online Now
                          </div>
                        )}
                      </div>
                      <h2 className={`text-6xl font-black italic uppercase tracking-tighter leading-none mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedMember.name}</h2>
                      <p className={`text-sm font-bold uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>ID: MEMBER-{selectedMember.id.substr(0, 8)}</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex items-center gap-3 mb-6">
                       <Crosshair size={18} className="text-red-500" />
                       <h3 className="font-black italic uppercase tracking-tighter text-xl">Combat Stats</h3>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-[10px] font-black text-zinc-500 uppercase">Skill Power</span>
                          <span className="text-sm font-black italic">{selectedMember.skillLevel}%</span>
                        </div>
                        <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${selectedMember.skillLevel}%` }} className="h-full bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)]" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                        <div className="text-center">
                          <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">XP Contrib</p>
                          <p className="text-3xl font-black italic">{Math.floor((selectedMember.skillLevel || 0) * 0.5)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">Rank Info</p>
                          <p className="text-2xl font-black italic text-red-500">#{activeCircle.members.sort((a,b) => (b.skillLevel || 0) - (a.skillLevel || 0)).findIndex(m => m.id === selectedMember.id) + 1}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex items-center gap-3 mb-6">
                       <Trophy size={18} className="text-yellow-500" />
                       <h3 className="font-black italic uppercase tracking-tighter text-xl">Achievements</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['FOUNDER', 'OWNER', 'ELITE', 'MVP', 'MVP WIN', 'KILLER', 'ACTIVE', 'SOLID', 'VETERAN', 'PRO PLAYER'].map((ach) => (
                        <button 
                          key={ach}
                          onClick={() => toggleAchievement(selectedMember.id, ach)}
                          className={`px-4 py-2 rounded-xl border flex items-center gap-2 group/ach transition-all active:scale-95 ${
                            selectedMember.achievements.includes(ach)
                            ? (isDark ? 'bg-red-600/10 border-red-600 text-red-500' : 'bg-red-50 border-red-600 text-red-600')
                            : (isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-500 opacity-50' : 'bg-white border-slate-200 text-slate-300 opacity-50')
                          }`}
                        >
                           {getBadgeIcon(ach)}
                           <span className="text-[10px] font-bold uppercase tracking-tight">{ach}</span>
                        </button>
                      ))}
                    </div>
                    {selectedMember.phone && (
                       <div className="mt-8 pt-6 border-t border-white/5">
                          <a 
                            href={`https://wa.me/${selectedMember.phone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white rounded-2xl py-4 font-black italic uppercase text-[10px] tracking-widest shadow-xl transition-all active:scale-95 shadow-green-950"
                          >
                            <MessageCircle size={14} /> Hubungi WhatsApp
                          </a>
                       </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Team Splitter Modal */}
      <AnimatePresence>
        {isShowingSplitter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsShowingSplitter(false)}
              className="absolute inset-0 bg-black/95 backdrop-blur-3xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 100 }}
              className={`relative w-full max-w-5xl rounded-[4rem] p-16 overflow-hidden border transition-colors ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-100 shadow-2xl'}`}
            >
              <div className="flex justify-between items-start mb-16 px-4">
                <div>
                  <h2 className="text-7xl font-black leading-none italic uppercase tracking-tighter">Team</h2>
                  <h2 className="text-7xl font-black text-red-600 mt-2 leading-none italic uppercase tracking-tighter">Splitter</h2>
                </div>
                <button 
                  onClick={() => setIsShowingSplitter(false)} 
                  className={`p-6 rounded-[2rem] transition-colors ${isDark ? 'bg-zinc-950 hover:bg-zinc-800 text-zinc-600 hover:text-red-500' : 'bg-slate-50 hover:bg-slate-100 text-slate-300 hover:text-red-600'}`}
                >
                  <X size={36} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                <div className="space-y-10">
                  <div>
                    <h3 className={`text-[11px] font-black uppercase tracking-[0.4em] mb-6 ml-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Pilih Member Mabar</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[350px] overflow-y-auto pr-4 custom-scrollbar p-2">
                      {activeCircle.members.map(m => (
                        <button
                          key={m.id}
                          onClick={() => {
                            const has = splitterMembers.includes(m.id);
                            setSplitterMembers(has ? splitterMembers.filter(id => id !== m.id) : [...splitterMembers, m.id]);
                            playSound(has ? 440 : 880);
                          }}
                          className={`p-4 rounded-[1.5rem] border text-left transition-all relative overflow-hidden group ${
                            splitterMembers.includes(m.id)
                            ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-900/30'
                            : (isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200 shadow-sm')
                          }`}
                        >
                          <p className="text-[11px] font-black uppercase truncate leading-tight mb-1">{m.name}</p>
                          <div className="flex items-center justify-between opacity-50">
                            <p className="text-[8px] font-mono uppercase tracking-tighter">LVL {m.skillLevel}</p>
                            {splitterMembers.includes(m.id) && <CheckCircle2 size={10} />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-3xl bg-black/5 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center text-white text-xl font-black italic">{splitterMembers.length}</div>
                       <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Member Terpilih</span>
                     </div>
                     <button 
                        onClick={generateTeams}
                        disabled={splitterMembers.length < 2}
                        className="bg-red-600 hover:bg-black text-white px-8 py-5 rounded-2xl font-black italic uppercase transition-all disabled:opacity-20 disabled:grayscale disabled:pointer-events-none shadow-xl shadow-red-900/40 text-sm tracking-tighter"
                      >
                        Bagi Tim Seimbang
                      </button>
                  </div>
                </div>

                <div className="relative">
                  {splitTeams ? (
                    <div className="space-y-12">
                      <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className={`p-10 rounded-[3.5rem] border-2 relative overflow-hidden ${isDark ? 'bg-zinc-950 border-blue-900/30 shadow-[0_0_50px_rgba(59,130,246,0.05)]' : 'bg-blue-50/50 border-blue-100'}`}>
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                          <Trophy size={80} className="text-blue-500" />
                        </div>
                        <h4 className="text-blue-500 font-black italic uppercase text-[11px] tracking-[0.5em] mb-8">BLUE WING</h4>
                        <div className="grid grid-cols-2 gap-3">
                           {splitTeams.teamA.map(m => (
                             <div key={m.id} className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase border transition-all hover:scale-105 ${isDark ? 'bg-blue-600/10 border-blue-600/30 text-blue-400' : 'bg-white border-blue-100 text-blue-600 shadow-sm'}`}>{m.name}</div>
                           ))}
                        </div>
                      </motion.div>

                      <div className="flex items-center justify-center -my-6 relative z-10">
                         <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
                         <div className="w-12 h-12 rounded-full bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center font-black italic tracking-tighter text-red-600 shadow-2xl">VS</div>
                         <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
                      </div>

                      <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }} className={`p-10 rounded-[3.5rem] border-2 relative overflow-hidden ${isDark ? 'bg-zinc-950 border-red-900/30 shadow-[0_0_50px_rgba(239,68,68,0.05)]' : 'bg-red-50/50 border-red-100'}`}>
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                          <Swords size={80} className="text-red-500" />
                        </div>
                        <h4 className="text-red-500 font-black italic uppercase text-[11px] tracking-[0.5em] mb-8">RED FLAME</h4>
                        <div className="grid grid-cols-2 gap-3">
                           {splitTeams.teamB.map(m => (
                             <div key={m.id} className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase border transition-all hover:scale-105 ${isDark ? 'bg-red-600/10 border-red-600/30 text-red-400' : 'bg-white border-red-100 text-red-600 shadow-sm'}`}>{m.name}</div>
                           ))}
                        </div>
                      </motion.div>
                    </div>
                  ) : (
                    <motion.div 
                      key="empty-splitter"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`h-full min-h-[500px] flex flex-col items-center justify-center p-16 text-center rounded-[4rem] border-4 border-dashed relative overflow-hidden ${isDark ? 'border-zinc-800 text-zinc-700 bg-black/20' : 'border-slate-50 text-slate-300 bg-slate-50/50'}`}
                    >
                      <Dices size={80} className="mb-8 opacity-10 animate-pulse" />
                      <h4 className="font-black uppercase tracking-[0.3em] text-sm mb-4">Awaiting Selection</h4>
                      <p className="font-bold text-[10px] uppercase opacity-50 max-w-[200px] leading-relaxed">Pilih angota Circle-mu di panel kiri untuk mulai membagi tim secara otomatis.</p>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Match Modal */}
      <AnimatePresence>
        {isAddingMatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingMatch(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-3xl"
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
                  <h2 className="text-5xl font-black leading-none italic uppercase tracking-tighter">Match</h2>
                  <h2 className="text-5xl font-black text-red-600 mt-2 leading-none italic uppercase tracking-tighter">Result</h2>
                </div>
                <button 
                  onClick={() => setIsAddingMatch(false)} 
                  className={`p-4 rounded-3xl transition-colors ${isDark ? 'hover:bg-zinc-800 text-zinc-600 hover:text-red-500' : 'hover:bg-slate-50 text-slate-300 hover:text-red-600'}`}
                >
                  <X size={36} />
                </button>
              </div>
              
              <div className="space-y-8">
                <div className="flex gap-4 p-2 bg-zinc-950 rounded-[1.5rem] border border-white/5">
                  <button 
                    onClick={() => { setMatchResult('WIN'); playSound(880); }}
                    className={`flex-1 py-4 rounded-xl font-black italic uppercase transition-all ${matchResult === 'WIN' ? 'bg-green-600 text-white shadow-xl shadow-green-600/20' : 'text-zinc-600'}`}
                  >
                    Victory
                  </button>
                  <button 
                    onClick={() => { setMatchResult('LOSE'); playSound(440); }}
                    className={`flex-1 py-4 rounded-xl font-black italic uppercase transition-all ${matchResult === 'LOSE' ? 'bg-red-600 text-white shadow-xl shadow-red-600/20' : 'text-zinc-600'}`}
                  >
                    Defeat
                  </button>
                </div>

                <div className="space-y-4">
                  <label className={`block text-[11px] font-black uppercase tracking-[0.4em] ml-4 ${isDark ? 'text-zinc-400' : 'text-slate-400'}`}>Nama Clan Lawan</label>
                  <input
                    type="text"
                    value={matchOpponent}
                    onChange={(e) => setMatchOpponent(e.target.value)}
                    placeholder="E.G. GENGSTER 99"
                    className={`w-full border-4 rounded-[1.5rem] py-5 px-6 outline-none transition-all text-xl font-black italic uppercase ${isDark ? 'bg-zinc-950 border-zinc-950 focus:bg-black focus:border-red-600/30 text-white' : 'bg-slate-50 border-slate-50 focus:bg-white text-slate-900'}`}
                  />
                </div>

                <div className="space-y-4">
                  <label className={`block text-[11px] font-black uppercase tracking-[0.4em] ml-4 ${isDark ? 'text-zinc-400' : 'text-slate-400'}`}>Skor Akhir</label>
                  <input
                    type="text"
                    value={matchScore}
                    onChange={(e) => setMatchScore(e.target.value)}
                    placeholder="E.G. 2 - 0"
                    className={`w-full border-4 rounded-[1.5rem] py-5 px-6 outline-none transition-all text-xl font-black italic uppercase ${isDark ? 'bg-zinc-950 border-zinc-950 focus:bg-black focus:border-red-600/30 text-white' : 'bg-slate-50 border-slate-50 focus:bg-white text-slate-900'}`}
                  />
                </div>
                
                <button 
                  onClick={addMatch}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-8 rounded-[1.5rem] font-black shadow-2xl transition-all active:scale-95 text-2xl tracking-tighter italic uppercase shadow-red-950"
                >
                  Simpan Pertandingan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Schedule Modal */}
      <AnimatePresence>
        {isAddingSchedule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingSchedule(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-3xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 100 }}
              className={`relative w-full max-w-lg rounded-[3rem] p-12 overflow-hidden border transition-colors ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-100 shadow-2xl'}`}
            >
              <div className="absolute top-0 left-0 w-full h-4 bg-orange-600" />
              
              <div className="flex justify-between items-start mb-14">
                <div className={isDark ? 'text-white' : 'text-slate-900'}>
                  <h2 className="text-5xl font-black leading-none italic uppercase tracking-tighter">Event</h2>
                  <h2 className="text-5xl font-black text-orange-600 mt-2 leading-none italic uppercase tracking-tighter">Schedule</h2>
                </div>
                <button 
                  onClick={() => setIsAddingSchedule(false)} 
                  className={`p-4 rounded-3xl transition-colors ${isDark ? 'hover:bg-zinc-800 text-zinc-600 hover:text-orange-500' : 'hover:bg-slate-50 text-slate-300 hover:text-orange-600'}`}
                >
                  <X size={36} />
                </button>
              </div>
              
              <div className="space-y-8">
                 <div className="flex gap-4 p-2 bg-zinc-950 rounded-[1.5rem] border border-white/5">
                   {(['Mabar', 'Tournament', 'Sparing'] as const).map(t => (
                      <button 
                         key={t}
                         onClick={() => { setScheduleType(t); playSound(660); }}
                         className={`flex-1 py-4 rounded-xl font-black italic uppercase transition-all ${scheduleType === t ? 'bg-orange-600 text-white shadow-xl shadow-orange-600/20' : 'text-zinc-600'}`}
                      >
                        {t}
                      </button>
                   ))}
                </div>

                <div className="space-y-4">
                  <label className={`block text-[11px] font-black uppercase tracking-[0.4em] ml-4 ${isDark ? 'text-zinc-400' : 'text-slate-400'}`}>Nama Kegiatan</label>
                  <input
                    type="text"
                    value={scheduleTitle}
                    onChange={(e) => setScheduleTitle(e.target.value)}
                    placeholder="E.G. TOURNAMENT SEASON 1"
                    className={`w-full border-4 rounded-[1.5rem] py-5 px-6 outline-none transition-all text-xl font-black italic uppercase ${isDark ? 'bg-zinc-950 border-zinc-950 focus:bg-black focus:border-orange-600/30 text-white' : 'bg-slate-50 border-slate-50 focus:bg-white text-slate-900'}`}
                  />
                </div>

                <div className="space-y-4">
                  <label className={`block text-[11px] font-black uppercase tracking-[0.4em] ml-4 ${isDark ? 'text-zinc-400' : 'text-slate-400'}`}>Waktu / Tanggal</label>
                  <input
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className={`w-full border-4 rounded-[1.5rem] py-5 px-6 outline-none transition-all text-xl font-black italic uppercase ${isDark ? 'bg-zinc-950 border-zinc-950 focus:bg-black focus:border-orange-600/30 text-white' : 'bg-slate-50 border-slate-50 focus:bg-white text-slate-900'}`}
                  />
                </div>

                <div className="space-y-4">
                  <label className={`block text-[11px] font-black uppercase tracking-[0.4em] ml-4 ${isDark ? 'text-zinc-400' : 'text-slate-400'}`}>Lokasi / Info</label>
                  <input
                    type="text"
                    value={scheduleLocation}
                    onChange={(e) => setScheduleLocation(e.target.value)}
                    placeholder="E.G. CUSTOM ROOM / CAFE"
                    className={`w-full border-4 rounded-[1.5rem] py-5 px-6 outline-none transition-all text-xl font-black italic uppercase ${isDark ? 'bg-zinc-950 border-zinc-950 focus:bg-black focus:border-orange-600/30 text-white' : 'bg-slate-50 border-slate-50 focus:bg-white text-slate-900'}`}
                  />
                </div>
                
                <button 
                  onClick={addSchedule}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white py-8 rounded-[1.5rem] font-black shadow-2xl transition-all active:scale-95 text-2xl tracking-tighter italic uppercase shadow-orange-950"
                >
                  Post Agenda
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isAddingPoll && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingPoll(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-3xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 100 }}
              className={`relative w-full max-w-lg rounded-[3rem] p-12 overflow-hidden border transition-colors ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-100 shadow-2xl'}`}
            >
              <div className="absolute top-0 left-0 w-full h-4 bg-indigo-600" />
              
              <div className="flex justify-between items-start mb-14">
                <div className={isDark ? 'text-white' : 'text-slate-900'}>
                  <h2 className="text-5xl font-black leading-none italic uppercase tracking-tighter">New</h2>
                  <h2 className="text-5xl font-black text-indigo-600 mt-2 leading-none italic uppercase tracking-tighter">Voting</h2>
                </div>
                <button 
                  onClick={() => setIsAddingPoll(false)} 
                  className={`p-4 rounded-3xl transition-colors ${isDark ? 'hover:bg-zinc-800 text-zinc-600 hover:text-indigo-500' : 'hover:bg-slate-50 text-slate-300 hover:text-indigo-600'}`}
                >
                  <X size={36} />
                </button>
              </div>
              
              <div className="space-y-8">
                <div className="space-y-4">
                  <label className={`block text-[11px] font-black uppercase tracking-[0.4em] ml-4 ${isDark ? 'text-zinc-400' : 'text-slate-400'}`}>Pertanyaan Voting</label>
                  <input
                    type="text"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="E.G. MAIN DIMANA KITA?"
                    className={`w-full border-4 rounded-[1.5rem] py-5 px-6 outline-none transition-all text-xl font-black italic uppercase ${isDark ? 'bg-zinc-950 border-zinc-950 focus:bg-black focus:border-indigo-600/30 text-white' : 'bg-slate-50 border-slate-50 focus:bg-white text-slate-900'}`}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center ml-4">
                    <label className={`block text-[11px] font-black uppercase tracking-[0.4em] ${isDark ? 'text-zinc-400' : 'text-slate-400'}`}>Opsi Jawaban</label>
                    <button 
                      onClick={() => setPollOptions([...pollOptions, ''])}
                      className="text-[10px] font-black text-indigo-500 uppercase flex items-center gap-1"
                    >
                      <Plus size={12} /> Tambah Opsi
                    </button>
                  </div>
                  <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                    {pollOptions.map((opt, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...pollOptions];
                            newOpts[idx] = e.target.value;
                            setPollOptions(newOpts);
                          }}
                          placeholder={`Opsi ${idx + 1}`}
                          className={`flex-1 border-4 rounded-xl py-3 px-4 outline-none transition-all text-sm font-black italic uppercase ${isDark ? 'bg-zinc-950 border-zinc-950 focus:bg-black focus:border-indigo-600/30 text-white' : 'bg-slate-50 border-slate-50 focus:bg-white text-slate-900'}`}
                        />
                        {pollOptions.length > 2 && (
                          <button 
                            onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                            className="p-3 text-red-500"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <button 
                  onClick={addPoll}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-8 rounded-[1.5rem] font-black shadow-2xl transition-all active:scale-95 text-2xl tracking-tighter italic uppercase shadow-indigo-950"
                >
                  Publikasikan Voting
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Moment Modal */}
      <AnimatePresence>
        {isAddingMoment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingMoment(false)}
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
                  <h2 className="text-5xl font-black leading-none italic uppercase tracking-tighter">Upload</h2>
                  <h2 className="text-5xl font-black text-red-600 mt-2 leading-none italic uppercase tracking-tighter">Momen</h2>
                  <div className={`h-2 w-20 mt-6 rounded-full ${isDark ? 'bg-red-600/30' : 'bg-red-100'}`} />
                </div>
                <button 
                  onClick={() => setIsAddingMoment(false)} 
                  className={`p-4 rounded-3xl transition-colors ${isDark ? 'hover:bg-zinc-800 text-zinc-600 hover:text-red-500' : 'hover:bg-slate-50 text-slate-300 hover:text-red-600'}`}
                >
                  <X size={36} />
                </button>
              </div>
              
              <div className="space-y-10">
                <div className="flex flex-col items-center gap-6">
                  <div className={`relative w-full aspect-video rounded-[2rem] border-4 border-dashed flex items-center justify-center overflow-hidden transition-all group/moment ${isDark ? 'border-zinc-800 bg-zinc-950 hover:border-red-600/30' : 'border-slate-100 bg-slate-50 hover:border-red-200'}`}>
                    {momentImage ? (
                      <>
                        <img src={momentImage} className="w-full h-full object-cover" alt="Preview" />
                        <button 
                          onClick={() => setMomentImage(undefined)}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover/moment:opacity-100 transition-opacity flex items-center justify-center text-white"
                        >
                          <X size={24} />
                        </button>
                      </>
                    ) : (
                      <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center gap-4 group/label">
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*" 
                          onChange={handleMomentUpload} 
                        />
                        <Camera size={48} className={`transition-colors ${isDark ? 'text-zinc-700 group-hover/label:text-red-500' : 'text-slate-200 group-hover/label:text-red-500'}`} />
                        <div className="text-center">
                          <span className={`block font-black uppercase tracking-widest text-sm ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Klik Untuk Upload</span>
                          <span className={`text-[10px] mt-1 font-bold ${isDark ? 'text-zinc-700' : 'text-slate-300'}`}>Screenshot Kemenangan / Foto Seru</span>
                        </div>
                      </label>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className={`block text-[11px] font-black uppercase tracking-[0.4em] ml-4 ${isDark ? 'text-zinc-400' : 'text-slate-400'}`}>Caption Momen</label>
                  <input
                    autoFocus
                    type="text"
                    value={momentCaption}
                    onChange={(e) => setMomentCaption(e.target.value)}
                    placeholder="E.G. WIN STREAK HARI INI!"
                    className={`w-full border-4 rounded-[1.5rem] py-7 px-8 outline-none transition-all text-xl font-black italic uppercase ${isDark ? 'bg-zinc-950 border-zinc-950 focus:bg-black focus:border-red-600/30 text-white placeholder:text-zinc-800' : 'bg-slate-50 border-slate-50 focus:bg-white focus:border-red-100 text-slate-900 placeholder:text-slate-200'}`}
                  />
                </div>
                
                <button 
                  onClick={addMoment}
                  disabled={!momentImage}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-8 rounded-[1.5rem] font-black shadow-2xl disabled:opacity-20 transition-all active:scale-95 text-2xl tracking-tighter italic uppercase shadow-red-950"
                >
                  Publish Ke Gallery
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                  <label className={`block text-[11px] font-black uppercase tracking-[0.4em] ml-4 ${isDark ? 'text-zinc-400' : 'text-slate-400'}`}>Pencapaian / Badges</label>
                  <div className="flex flex-wrap gap-2">
                    {(['ELITE', 'MVP', 'FOUNDER', 'MABAR KING', 'FAST HAND', 'SADBOY'].map(badge => (
                      <button
                        key={badge}
                        onClick={() => {
                          const current = memberToEdit?.achievements || [];
                          const updated = current.includes(badge) 
                            ? current.filter(b => b !== badge)
                            : [...current, badge];
                          
                          setMemberToEdit(prev => prev ? { ...prev, achievements: updated } : null);
                          // We need to update circles state too during final save, or sync this way:
                          setCircles(prev => prev.map(c => c.id === activeCircleId ? {
                            ...c,
                            members: c.members.map(m => m.id === memberToEdit?.id ? { ...m, achievements: updated } : m)
                          } : c));
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${memberToEdit?.achievements?.includes(badge) ? 'bg-yellow-500 border-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.3)]' : (isDark ? 'bg-zinc-950 border-zinc-900 text-zinc-600' : 'bg-slate-50 border-slate-100 text-slate-400')}`}
                      >
                        {badge}
                      </button>
                    )))}
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
