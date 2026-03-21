import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getHackathons } from './hackathons';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Search, Calendar, MapPin, Users, TrendingUp, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Home() {
  const { isAdmin } = useAuth();
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('upcoming');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const data = await getHackathons();
        setHackathons(data);
      } catch (error) {
        console.error('Failed to load:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const calculateDaysLeft = (date) => {
    if (!date) return '-';
    const target = parseEventDate(date);
    if (!target) return '-';
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Ended';
    if (diffDays === 0) return 'Today 🔥';
    if (diffDays === 1) return 'Tomorrow';
    return `${diffDays}d left`;
  };

  const filteredHackathons = hackathons
    .filter(h => {
      if (search && !h.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter !== 'all' && h.type !== typeFilter) return false;
      if (filter === 'upcoming') {
        const date = parseEventDate(h.date);
        return date ? date >= today : false;
      }
      if (filter === 'past') {
        const date = parseEventDate(h.date);
        return date ? date < today : false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'upcoming') {
        const da = parseEventDate(a.date);
        const db = parseEventDate(b.date);
        return da && db ? da - db : 0;
      }
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      const da = parseEventDate(a.date);
      const db = parseEventDate(b.date);
      return da && db ? db - da : 0;
    });

  const stats = {
    total: hackathons.length,
    upcoming: hackathons.filter(h => {
      const date = parseEventDate(h.date);
      return date ? date >= today : false;
    }).length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-12">
      {/* Hero Section */}
      <section className="relative py-12 md:py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center space-y-6">
            <div className="inline-block">
              <div className="px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-sm font-semibold text-primary flex items-center gap-2">
                <Zap className="w-4 h-4" /> The Future of Innovation Events
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary via-primary to-blue-600 bg-clip-text text-transparent">
                VisionX
              </span>
              <br />
              <span className="text-foreground">Where Innovators Connect</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover groundbreaking hackathons, build your network with brilliant minds, showcase your skills, and compete for amazing prizes across the globe.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 pb-8">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl p-6 border border-blue-500/30 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-semibold">Total Events</p>
                  <p className="text-3xl font-bold text-primary mt-1">{stats.total}</p>
                </div>
                <Users className="w-10 h-10 opacity-20" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-xl p-6 border border-green-500/30 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-semibold">Upcoming</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">{stats.upcoming}</p>
                </div>
                <TrendingUp className="w-10 h-10 opacity-20" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="sticky top-16 z-20 bg-background/80 backdrop-blur-xl border-b border-border/40 py-4 px-4">
        <div className="container mx-auto space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="🔍 Search hackathons by name or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-12 rounded-xl text-base bg-card border border-border/50 transition focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div className="flex flex-wrap gap-2 items-center">
            {['all', 'Hackathon', 'Event'].map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                  typeFilter === type
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'bg-card border border-border/50 hover:border-primary/50 text-foreground'
                }`}
              >
                {type === 'all' ? 'All Types' : type}
              </button>
            ))}

            <div className="h-6 border-l border-border/50 mx-2" />

            {['all', 'upcoming', 'past'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  filter === f
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'bg-card border border-border/50 hover:border-primary/50 text-foreground'
                }`}
              >
                {f === 'all' ? '📋 All' : f === 'upcoming' ? '🚀 Upcoming' : '✓ Past'}
              </button>
            ))}

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="ml-auto px-4 py-2 rounded-lg border border-border/50 bg-card text-foreground font-medium transition hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="upcoming">📅 Soonest First</option>
              <option value="title">🔤 A-Z</option>
              <option value="latest">🆕 Latest First</option>
            </select>
          </div>
        </div>
      </section>

      {/* Hackathons Grid */}
      <section className="px-4 py-8">
        <div className="container mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Zap className="w-12 h-12 text-primary animate-pulse mb-4" />
              <p className="text-muted-foreground text-lg font-medium">Loading hackathons...</p>
            </div>
          ) : filteredHackathons.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHackathons.map((h, idx) => {
                const eventDate = parseEventDate(h.date);
                const isPast = eventDate && eventDate < today;
                const daysLeft = calculateDaysLeft(h.date);
                
                return (
                  <div
                    key={h.id}
                    className="group bg-gradient-to-br from-card to-card/50 border border-border/60 rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 flex flex-col h-full backdrop-blur-sm"
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    {/* Header */}
                    <div className="p-6 pb-4 flex-1 relative">
                      <div className="absolute top-4 right-4">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full backdrop-blur-sm inline-block ${
                          isPast
                            ? 'bg-gray-500/20 text-gray-700'
                            : daysLeft === 'Today 🔥'
                            ? 'bg-red-500/20 text-red-700 animate-pulse'
                            : daysLeft === 'Tomorrow'
                            ? 'bg-orange-500/20 text-orange-700'
                            : 'bg-green-500/20 text-green-700'
                        }`}>
                          {isPast ? '✓ Past' : daysLeft}
                        </span>
                      </div>
                      
                      <h3 className="text-lg md:text-xl font-bold line-clamp-2 mb-1 group-hover:text-primary transition pr-24">
                        {h.title}
                      </h3>
                      <div className="inline-flex items-center gap-2 mb-3">
                        <span className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary">
                          {h.type || 'Hackathon'}
                        </span>
                      </div>
                      
                      <p className="text-muted-foreground line-clamp-2 text-sm mb-4">
                        {h.description}
                      </p>

                      <div className="space-y-2 text-sm text-muted-foreground">
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

                    {/* Footer */}
                    <div className="px-6 pb-6 pt-4 border-t border-border/30 flex gap-3">
                      {h.link ? (
                        <a href={h.link} target="_blank" rel="noreferrer" className="flex-1">
                          <Button className="w-full transition-all duration-200 hover:scale-105 active:scale-95 bg-gradient-to-r from-primary to-primary/80">
                            🌐 Register
                          </Button>
                        </a>
                      ) : (
                        <Link to={`/hackathon/${h.id}`} className="flex-1">
                          <Button className="w-full transition-all duration-200 hover:scale-105 active:scale-95 bg-gradient-to-r from-primary to-primary/80">
                            📝 Join
                          </Button>
                        </Link>
                      )}
                      <Link to={`/hackathon/${h.id}`} className="flex-1">
                        <Button variant="outline" className="w-full transition-all duration-200 hover:bg-primary/10 hover:border-primary active:scale-95">
                          📋 Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-24 px-4">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold mb-3">
                {typeFilter === 'Event'
                  ? 'No events found'
                  : typeFilter === 'Hackathon'
                  ? 'No hackathons found'
                  : 'No hackathons found'}
              </h3>
              <p className="text-muted-foreground mb-8 text-lg">
                {search
                  ? `No results for "${search}". Try a different search.`
                  : `Check back soon! More ${typeFilter === 'Event' ? 'events' : 'hackathons'} are being added.`}
              </p>
              {search && (
                <Button variant="outline" onClick={() => setSearch('')} size="lg">
                  Clear Search
                </Button>
              )}
              {isAdmin && (
                <Link to="/admin">
                  <Button size="lg" className="ml-3">
                    ➕ Add First {typeFilter === 'Event' ? 'Event' : 'Hackathon'}
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      {!loading && hackathons.length > 0 && (
        <section className="px-4 py-12 md:py-16">
          <div className="container mx-auto">
            <div className="bg-gradient-to-r from-primary/20 to-blue-600/20 rounded-2xl border border-primary/30 p-8 md:p-12 text-center backdrop-blur-sm">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to Vision Your Future?</h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Join thousands of innovators on VisionX. Find the perfect hackathon that matches your skills and ambitions.
              </p>
              <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-primary/80">
                🚀 Start Exploring
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
