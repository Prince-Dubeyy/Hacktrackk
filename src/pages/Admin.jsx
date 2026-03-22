import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHackathons, createHackathon, updateHackathon, deleteHackathon } from './hackathons';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Plus, Edit2, Trash2, Search, BarChart3, Calendar, MapPin, TrendingUp, Zap } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

export function Admin() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const toast = useToast();
  
  const [hackathons, setHackathons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [typeFilter, setTypeFilter] = useState('all');

  const parseEventDate = (dateString) => {
    if (!dateString) return null;
    const parts = dateString.split('-').map(Number);
    if (parts.length !== 3) return new Date(dateString);
    const [year, month, day] = parts;
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  };

  const formatEventDate = (dateString) => {
    const date = parseEventDate(dateString);
    if (!date || Number.isNaN(date.getTime())) return dateString || '-';
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };
  
  const [eventType, setEventType] = useState('Hackathon');
  const [formData, setFormData] = useState({
    type: 'Hackathon',
    title: '',
    date: '',
    location: '',
    description: '',
    deadline: '',
    link: '',
    teamALink: '',
    teamBLink: ''
  });

  const fetchHackathons = async () => {
    setIsLoading(true);
    try {
      const data = await getHackathons();
      setHackathons(data);
    } catch (error) {
      console.error('Fetch error:', error);
      toast?.('Could not load hackathons.', 'destructive');
    } finally {
      setIsLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isAdmin) fetchHackathons();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">🔒</div>
          <h2 className="text-3xl font-bold mb-3">Admin Access Required</h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Only authorized administrators can access this panel. Please sign in with your admin account.
          </p>
          <Button onClick={() => navigate('/')} size="lg">Return Home</Button>
        </div>
      </div>
    );
  }

  const handleOpenModal = (hackathon = null) => {
    if (hackathon) {
      setEditingId(hackathon.id);
      setEventType(hackathon.type || 'Hackathon');
      setFormData({
        type: hackathon.type || 'Hackathon',
        title: hackathon.title || '',
        date: hackathon.date || '',
        location: hackathon.location || '',
        description: hackathon.description || '',
        deadline: hackathon.deadline || '',
        link: hackathon.link || '',
        teamALink: hackathon.teamALink || '',
        teamBLink: hackathon.teamBLink || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        type: eventType || 'Hackathon',
        title: '',
        date: '',
        location: '',
        description: '',
        deadline: '',
        link: '',
        teamALink: '',
        teamBLink: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let redirectId = editingId;
      if (editingId) {
        await updateHackathon(editingId, formData);
        setHackathons((prev) => prev.map((h) => (h.id === editingId ? { ...h, ...formData } : h)));
        toast?.(`✨ ${formData.type} updated successfully!`, 'success');
      } else {
        const createdId = await createHackathon(formData);
        redirectId = createdId;
        const newHackathon = { id: createdId, ...formData };
        setHackathons((prev) => [...prev, newHackathon]);
        toast?.(`🎉 ${formData.type} created!`, 'success');
      }

      handleCloseModal();

      if (!editingId) {
        const path = `/hackathon/${redirectId}`;
        setTimeout(() => navigate(path), 650);
      }
    } catch (error) {
      console.error('Save error:', error);
      toast?.('❌ Failed to save. Check console for details.', 'destructive');
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('🗑️ Delete this hackathon? This action cannot be undone.')) return;

    try {
      await deleteHackathon(id);
      toast?.('✅ Hackathon deleted successfully.', 'success');
      setHackathons(prev => prev.filter(h => h.id !== id));
    } catch (error) {
      console.error('Delete error:', error);
      toast?.('❌ Failed to delete. Please try again.', 'destructive');
    }
  };

  const uniqueHackathons = Array.from(new Map(hackathons.map((h) => [h.id, h])).values());

  const filtered = uniqueHackathons
    .filter((h) => {
      const label = h.title.toLowerCase();
      const term = searchTerm.toLowerCase();
      if (searchTerm && !label.includes(term)) return false;
      if (typeFilter !== 'all' && h.type !== typeFilter) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = parseEventDate(a.date);
        const dateB = parseEventDate(b.date);
        return dateA - dateB;
      }
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return 0;
    });

  const now = new Date();
  const stats = {
    total: hackathons.length,
    upcoming: hackathons.filter(h => {
      const d = parseEventDate(h.date);
      return d && d >= now;
    }).length,
    past: hackathons.filter(h => {
      const d = parseEventDate(h.date);
      return d && d < now;
    }).length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-12">
      {/* Sticky Header */}
      <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-xl border-b border-border/40 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">✨ VisionX Event Admin</h1>
              <p className="text-muted-foreground mt-1 text-sm">Manage and organize your events</p>
            </div>
            <div>
              <Button
                onClick={() => {
                  setEventType('Hackathon');
                  setFormData((prev) => ({ ...prev, type: 'Hackathon' }));
                  handleOpenModal();
                }}
                size="lg"
                className="gap-2 w-full sm:w-auto transform transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl bg-gradient-to-r from-primary to-cyan-500"
              >
                <Plus className="w-5 h-5" /> Add Hackathon/Event
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { icon: BarChart3, label: 'Total Events', value: stats.total, color: 'from-blue-500/20 to-blue-600/20', border: 'border-blue-500/30' },
            { icon: TrendingUp, label: 'Upcoming', value: stats.upcoming, color: 'from-green-500/20 to-green-600/20', border: 'border-green-500/30' },
            { icon: Calendar, label: 'Past Events', value: stats.past, color: 'from-purple-500/20 to-purple-600/20', border: 'border-purple-500/30' }
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className={`bg-gradient-to-br ${stat.color} rounded-xl p-6 border ${stat.border} backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">{stat.label}</p>
                    <p className="text-4xl font-bold mt-2">{stat.value}</p>
                  </div>
                  <Icon className="w-12 h-12 opacity-20" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Search & Sort Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="🔍 Search hackathons by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 rounded-xl transition-all focus:ring-2 focus:ring-primary border-border/50"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'Hackathon', 'Event'].map((typeItem) => (
              <button
                key={typeItem}
                onClick={() => setTypeFilter(typeItem)}
                className={`px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                  typeFilter === typeItem
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'bg-card border border-border/50 text-foreground hover:border-primary/70'
                }`}
              >
                {typeItem === 'all' ? 'All Types' : typeItem}
              </button>
            ))}
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-12 px-4 rounded-xl border border-border/50 bg-card text-foreground transition hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary font-medium"
          >
            <option value="date">📅 Sort by Date</option>
            <option value="title">🔤 Sort by Title</option>
          </select>
        </div>

        {/* Hackathons Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="inline-block mb-4">
                <Zap className="w-12 h-12 text-primary animate-pulse" />
              </div>
              <p className="text-lg text-muted-foreground font-medium">Loading your hackathons...</p>
            </div>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((h, idx) => {
              const eventDate = parseEventDate(h.date);
              const isPast = eventDate ? eventDate <= new Date() : false;
              const daysLeft = eventDate ? Math.ceil((eventDate - new Date()) / (1000 * 60 * 60 * 24)) : 0;
              
              return (
                <div 
                  key={h.id}
                  className="group bg-gradient-to-br from-card to-card/50 border border-border/60 rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 flex flex-col h-full backdrop-blur-sm"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  {/* Card Header */}
                  <div className="p-6 pb-4 flex-1 relative">
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full backdrop-blur-sm ${
                        isPast 
                          ? 'bg-gray-500/20 text-gray-700' 
                          : daysLeft === 0 
                          ? 'bg-red-500/20 text-red-700 animate-pulse' 
                          : daysLeft === 1
                          ? 'bg-orange-500/20 text-orange-700'
                          : 'bg-green-500/20 text-green-700'
                      }`}>
                        {isPast ? '✓ Past' : daysLeft === 0 ? '🔥 Today' : `⏰ ${daysLeft}d`}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold line-clamp-2 mb-4 group-hover:text-primary transition pr-20">{h.title}</h3>
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <p className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 flex-shrink-0" /> 
                        <span className="font-medium">{formatEventDate(h.date)}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 flex-shrink-0" /> 
                        <span className="font-medium truncate">{h.location}</span>
                      </p>
                    </div>
                  </div>
                  
                  {/* Card Footer */}
                  <div className="px-6 pb-6 pt-4 border-t border-border/30 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenModal(h)}
                      className="flex-1 transition-all duration-200 hover:bg-primary/10 hover:border-primary hover:text-primary active:scale-95"
                    >
                      <Edit2 className="w-4 h-4 mr-2" /> Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(h.id)}
                      className="flex-1 transition-all duration-200 hover:bg-red-600/90 active:scale-95"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24 px-4">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-2xl font-bold mb-3">No events found</h3>
            <p className="text-muted-foreground mb-8 text-lg">
              {searchTerm ? 'Try a different search term or clear filters' : 'Click "Add Hackathon / Event" to create your first entry'}
            </p>
            {searchTerm && (
              <Button variant="outline" onClick={() => setSearchTerm('')} size="lg">Clear Search</Button>
            )}
          </div>
        )}
      </div>

      {/* Premium Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingId ? `✏️ Edit ${formData.type}` : eventType === 'Event' ? '🚀 Create New Event' : '🚀 Create New Hackathon'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold mb-2 uppercase tracking-wide">Type *</label>
            <select
              value={formData.type}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, type: e.target.value }));
                setEventType(e.target.value);
              }}
              className="w-full h-12 rounded-lg border border-border px-3 bg-card text-foreground"
            >
              <option value="Hackathon">Hackathon</option>
              <option value="Event">Event</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 uppercase tracking-wide">
              {formData.type || 'Hackathon'} Title *
            </label>
            <Input
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder={`e.g., Smart Campus ${formData.type || 'Hackathon'} 2026`}
              required
              className="h-12 rounded-lg text-base transition-all focus:ring-2 focus:ring-primary"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2 uppercase tracking-wide">{formData.type || 'Hackathon'} Date *</label>
              <Input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="h-12 rounded-lg text-base [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 uppercase tracking-wide">Registration Deadline *</label>
              <Input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                required
                className="h-12 rounded-lg text-base [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 uppercase tracking-wide">Location *</label>
            <Input
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., South Asian University, New Delhi"
              required
              className="h-12 rounded-lg text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 uppercase tracking-wide flex items-center gap-2">
              <span>External Registration Link (Optional)</span>
              <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-normal">Public Website</span>
            </label>
            <Input
              type="url"
              name="link"
              value={formData.link}
              onChange={handleChange}
              placeholder="https://example.com/register"
              className="h-12 rounded-lg text-base"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2 uppercase tracking-wide flex items-center gap-2 text-primary/80">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>Team A Invite Link</span>
              </label>
              <Input
                type="url"
                name="teamALink"
                value={formData.teamALink}
                onChange={handleChange}
                placeholder="https://discord.gg/..."
                className="h-12 rounded-lg text-base border-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 uppercase tracking-wide flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                <span>Team B Invite Link</span>
              </label>
              <Input
                type="url"
                name="teamBLink"
                value={formData.teamBLink}
                onChange={handleChange}
                placeholder="https://whatsapp.com/..."
                className="h-12 rounded-lg text-base border-cyan-500/20 focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 uppercase tracking-wide">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder={`Tell us about this ${formData.type || 'hackathon'}... What's the theme? What tech stack? Who should apply?`}
              required
              className="w-full min-h-[160px] rounded-lg border border-border bg-background px-4 py-3 text-base ring-offset-background placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 resize-none transition-all"
            />
          </div>

          <div className="pt-4 flex gap-3 justify-end border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCloseModal}
              disabled={isSubmitting}
              className="px-6 h-11 rounded-lg transition hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-8 h-11 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-50 bg-gradient-to-r from-primary to-primary/80"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block animate-spin mr-2">⏳</span>
                  {editingId ? 'Updating...' : `Creating ${formData.type || 'Hackathon'}...`}
                </>
              ) : editingId ? (
                '💾 Save Changes'
              ) : (
                `🚀 Create ${formData.type || 'Hackathon'}`
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
