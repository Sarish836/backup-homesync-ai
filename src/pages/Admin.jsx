import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Shield, Trash2, Edit2, Check, X, Mail, Phone, MapPin, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const ADMIN_EMAILS = ['shreyassamal05@gmail.com', 'sarishdinesh@gmail.com', 'pmohanty.live@gmail.com', 'samarthravi30@gmail.com'];

export default function Admin() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    base44.auth.me().then(async u => {
      setCurrentUser(u);
      if (u && ADMIN_EMAILS.includes(u.email)) {
        const [userList, profileList] = await Promise.all([
          base44.entities.User.list(),
          base44.entities.UserProfile.list(),
        ]);
        setUsers(userList);
        setProfiles(profileList);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const isAdmin = currentUser && ADMIN_EMAILS.includes(currentUser.email);

  const getProfile = (user) => profiles.find(p => p.created_by === user.email);

  const handleDelete = async (userId, userEmail) => {
    if (ADMIN_EMAILS.includes(userEmail)) return;
    if (!confirm('Are you sure you want to delete this account?')) return;
    await base44.entities.User.delete(userId);
    setUsers(u => u.filter(x => x.id !== userId));
  };

  const handleEdit = (user) => {
    const prof = getProfile(user);
    setEditingId(user.id);
    setEditForm({
      full_name: user.full_name || '',
      email: user.email || '',
      role: user.role || 'user',
      phone: prof?.phone || '',
      home_address: prof?.home_address || '',
      city: prof?.city || '',
      state: prof?.state || '',
      country: prof?.country || '',
      username: prof?.username || '',
    });
  };

  const handleSaveEdit = async (user) => {
    // Update User entity (name, role)
    await base44.entities.User.update(user.id, {
      full_name: editForm.full_name,
      role: editForm.role,
    });

    // Update or create UserProfile
    const prof = getProfile(user);
    const profileUpdates = {
      phone: editForm.phone,
      home_address: editForm.home_address,
      city: editForm.city,
      state: editForm.state,
      country: editForm.country,
      username: editForm.username,
    };
    if (prof?.id) {
      await base44.entities.UserProfile.update(prof.id, profileUpdates);
      setProfiles(prev => prev.map(p => p.id === prof.id ? { ...p, ...profileUpdates } : p));
    } else {
      const newProf = await base44.entities.UserProfile.create(profileUpdates);
      setProfiles(prev => [...prev, newProf]);
    }

    setUsers(u => u.map(x => x.id === user.id ? { ...x, full_name: editForm.full_name, role: editForm.role } : x));
    setEditingId(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="font-heading font-bold text-xl text-foreground">Access Denied</h2>
        <p className="text-sm text-muted-foreground mt-2">You don't have permission to view this page.</p>
      </div>
    );
  }

  const inputCls = "w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-heading font-bold text-xl text-foreground">Admin Panel</h2>
          <p className="text-sm text-muted-foreground">{users.length} accounts registered</p>
        </div>
      </div>

      <div className="space-y-3">
        {users.map(user => {
          const isThisAdmin = ADMIN_EMAILS.includes(user.email);
          const prof = getProfile(user);
          return (
            <motion.div key={user.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`bg-card rounded-2xl border p-4 ${isThisAdmin ? 'border-primary/30' : 'border-border/50'}`}>
              {editingId === user.id ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Editing {user.email}</p>
                  <input className={inputCls} value={editForm.full_name} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Full name" />
                  <input className={inputCls} value={editForm.username} onChange={e => setEditForm(f => ({ ...f, username: e.target.value }))} placeholder="Username" />
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input className={`${inputCls} pl-9`} value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone number" />
                  </div>
                  <input className={inputCls} value={editForm.home_address} onChange={e => setEditForm(f => ({ ...f, home_address: e.target.value }))} placeholder="Street address" />
                  <div className="grid grid-cols-2 gap-2">
                    <input className={inputCls} value={editForm.city} onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))} placeholder="City" />
                    <input className={inputCls} value={editForm.state} onChange={e => setEditForm(f => ({ ...f, state: e.target.value }))} placeholder="State" />
                  </div>
                  <input className={inputCls} value={editForm.country} onChange={e => setEditForm(f => ({ ...f, country: e.target.value }))} placeholder="Country" />
                  <select className={inputCls} value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={() => handleSaveEdit(user)} className="flex-1"><Check className="w-4 h-4 mr-1" /> Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="flex-1"><X className="w-4 h-4 mr-1" /> Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="font-bold text-primary text-sm">{(user.full_name || user.email || '?')[0].toUpperCase()}</span>
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <p className="font-semibold text-sm text-foreground">{user.full_name || '(no name)'}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 truncate"><Mail className="w-3 h-3 shrink-0" />{user.email}</p>
                      {prof?.phone && <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3 shrink-0" />{prof.phone}</p>}
                      {prof?.home_address && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3 shrink-0" />{[prof.home_address, prof.city, prof.state].filter(Boolean).join(', ')}</p>}
                      {prof?.username && <p className="text-xs text-muted-foreground flex items-center gap-1"><User className="w-3 h-3 shrink-0" />@{prof.username}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isThisAdmin ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                          {isThisAdmin ? '⭐ Super Admin' : user.role || 'user'}
                        </span>
                      </div>
                    </div>
                  </div>
                  {!isThisAdmin && (
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => handleEdit(user)} className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
                        <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      {user.id !== currentUser?.id && (
                        <button onClick={() => handleDelete(user.id, user.email)} className="h-8 w-8 rounded-lg hover:bg-destructive/10 flex items-center justify-center transition-colors">
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}