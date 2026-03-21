import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getHackathon } from './hackathons';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Code, Trophy, AlertCircle, Clock, Zap, ChevronRight } from 'lucide-react';

export function Dashboard() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [prioritizedHackathons, setPrioritizedHackathons] = useState({
    urgent: [],
    thisWeek: [],
    later: []
  });
  const [loading, setLoading] = useState(true);
  const [focusNow, setFocusNow] = useState(null);

  const parseEventDate = (dateString) => {
    if (!dateString) return null;
    const parts = dateString.split('-').map(Number);
    if (parts.length !== 3) return new Date(dateString);
    const [year, month, day] = parts;
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  };

  const getDaysLeft = (deadlineString) => {
    if (!deadlineString) return null;
    const deadline = parseEventDate(deadlineString);
    if (!deadline) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = deadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDeadlineLabel = (daysLeft) => {
    if (daysLeft === 0) return '🔥 Today';
    if (daysLeft === 1) return '⚠️ Tomorrow';
    if (daysLeft === 2) return '⚡ In 2 days';
    if (daysLeft <= 7) return `📅 ${daysLeft} days left`;
    return `📆 ${daysLeft} days left`;
  };

  const getUrgencyColor = (daysLeft) => {
    if (daysLeft <= 1) return 'bg-red-500/20 text-red-700 border-red-500/30 dark:text-red-400 dark:border-red-900/50';
    if (daysLeft <= 3) return 'bg-orange-500/20 text-orange-700 border-orange-500/30 dark:text-orange-400 dark:border-orange-900/50';
    if (daysLeft <= 7) return 'bg-amber-500/20 text-amber-700 border-amber-500/30 dark:text-amber-400 dark:border-amber-900/50';
    return 'bg-green-500/20 text-green-700 border-green-500/30 dark:text-green-400 dark:border-green-900/50';
  };
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const fetchAndPrioritize = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // Get all confirmations from localStorage for current user
        const allKeys = Object.keys(localStorage);
        const confirmationKeys = allKeys.filter(key => 
          key.startsWith(`hackathon_confirmed_`) && key.endsWith(`_${user.uid}`)
        );

        // Extract hackathonIds from confirmation keys
        const hackathonIds = confirmationKeys.map(key => {
          const match = key.match(/hackathon_confirmed_(.+)_/);
          return match ? match[1] : null;
        }).filter(Boolean);

        // Fetch full hackathon details for each confirmed hackathon
        const hackathonsWithDetails = await Promise.all(
          hackathonIds.map(async (hackathonId) => {
            try {
              const hack = await getHackathon(hackathonId);
              return { 
                hackathonId, 
                hackathonDetails: hack,
                confirmedAt: new Date()
              };
            } catch (e) {
              console.error('Failed to fetch hackathon:', e);
              return null;
            }
          })
        );

        // Filter out failed fetches
        const validHackathons = hackathonsWithDetails.filter(h => h && h.hackathonDetails);

        // Prioritize based on deadline
        const urgent = [];
        const thisWeek = [];
        const later = [];

        validHackathons.forEach((item) => {
          const daysLeft = getDaysLeft(item.hackathonDetails.deadline);
          if (daysLeft === null) return;

          const hackathonData = {
            ...item,
            daysLeft,
            deadlineLabel: formatDeadlineLabel(daysLeft),
            urgencyColor: getUrgencyColor(daysLeft)
          };

          if (daysLeft <= 3) urgent.push(hackathonData);
          else if (daysLeft <= 7) thisWeek.push(hackathonData);
          else later.push(hackathonData);
        });

        // Sort each category by daysLeft (ascending - closest first)
        urgent.sort((a, b) => a.daysLeft - b.daysLeft);
        thisWeek.sort((a, b) => a.daysLeft - b.daysLeft);
        later.sort((a, b) => a.daysLeft - b.daysLeft);

        setPrioritizedHackathons({ urgent, thisWeek, later });
        setFocusNow(urgent[0] || thisWeek[0] || later[0] || null);
        setRegistrations(validHackathons);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchAndPrioritize();
  }, [user]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pt-4">
      <div className="bg-card rounded-[2rem] p-8 md:p-10 border border-border mt-4 flex flex-col md:flex-row gap-8 items-center md:items-start relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        
        <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-primary text-4xl font-bold shadow-inner z-10 shrink-0">
          {user?.displayName?.[0] || 'U'}
        </div>
        <div className="flex-1 text-center md:text-left z-10">
          <h1 className="text-3xl font-bold tracking-tight">{user?.displayName}</h1>
          <p className="text-muted-foreground">{user?.email}</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-6">
            <div className="bg-background rounded-full px-4 py-2 text-sm border border-border font-medium flex items-center gap-2 shadow-sm">
              <Trophy className="w-4 h-4 text-amber-500" /> {registrations.length} Hackathons Joined
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
           <Zap className="w-6 h-6 text-primary" /> Focus Dashboard
        </h2>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Computing your priority plan...</div>
        ) : focusNow ? (
          <div className="space-y-6">
            {/* 🔴 FOCUS NOW */}
            <div className="bg-gradient-to-br from-red-500/15 to-orange-600/5 border border-red-500/30 rounded-3xl p-8 md:p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
                    🔴 Priority Focus
                  </span>
                </div>
                <h3 className="text-4xl md:text-5xl font-extrabold mb-3 text-foreground">
                  {focusNow.hackathonDetails.title}
                </h3>
                <p className="text-lg text-muted-foreground mb-8">
                  {focusNow.hackathonDetails.type || 'Hackathon'} • {focusNow.hackathonDetails.location}
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-8 pb-8 border-b border-border/30">
                  <div className={`px-4 py-3 rounded-xl text-base font-bold border inline-flex items-center gap-2 ${focusNow.urgencyColor}`}>
                    <Clock className="w-5 h-5" />
                    {focusNow.deadlineLabel}
                  </div>
                  <p className="text-lg text-foreground/80 font-medium">
                    📅 Due: <span className="text-foreground font-bold">{focusNow.hackathonDetails.deadline}</span>
                  </p>
                </div>
                {focusNow.daysLeft <= 3 && (
                  <div className="bg-gradient-to-r from-red-500/20 to-orange-500/10 border border-red-500/40 rounded-2xl p-5 flex items-start gap-4 mb-8">
                    <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-sm font-bold text-red-700 dark:text-red-300 mb-1">
                        ⚡ Deadline Approaching
                      </p>
                      <p className="text-sm text-red-700/70 dark:text-red-400/70">
                        Only <span className="font-bold">{focusNow.daysLeft} day{focusNow.daysLeft !== 1 ? 's' : ''}</span> left. Make this your priority today.
                      </p>
                    </div>
                  </div>
                )}
                <Link to={`/hackathon/${focusNow.hackathonId}`}>
                  <Button className="w-full sm:w-auto h-12 text-base bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all">
                    Prepare & Submit →
                  </Button>
                </Link>
              </div>
            </div>

            {/* 🟡 THIS WEEK */}
            {prioritizedHackathons.thisWeek.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <h3 className="text-2xl font-bold tracking-tight text-foreground">📅 This Week</h3>
                  <span className="text-sm text-muted-foreground ml-auto">
                    ({prioritizedHackathons.thisWeek.length})
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {prioritizedHackathons.thisWeek.map((item) => (
                    <Link key={item.id} to={`/hackathon/${item.hackathonId}`}>
                      <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/40 rounded-2xl p-6 hover:border-amber-500/70 hover:shadow-lg hover:shadow-amber-500/10 transition-all cursor-pointer group h-full">
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <h4 className="font-bold text-lg text-foreground group-hover:text-primary transition line-clamp-2">
                            {item.hackathonDetails.title}
                          </h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap border ${item.urgencyColor}`}>
                            {item.deadlineLabel}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-1">
                          {item.hackathonDetails.type || 'Hackathon'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-border/40 pt-4">
                          <Clock className="w-4 h-4 opacity-70" />
                          <span><strong>Deadline:</strong> {item.hackathonDetails.deadline}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* 🟢 LATER */}
            {prioritizedHackathons.later.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <h3 className="text-2xl font-bold tracking-tight text-foreground">🚀 Upcoming</h3>
                  <span className="text-sm text-muted-foreground ml-auto">
                    ({prioritizedHackathons.later.length})
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {prioritizedHackathons.later.map((item) => (
                    <Link key={item.id} to={`/hackathon/${item.hackathonId}`}>
                      <div className="bg-gradient-to-br from-green-500/8 to-emerald-500/5 border border-green-500/30 rounded-2xl p-6 hover:border-green-500/60 hover:shadow-lg hover:shadow-green-500/10 transition-all cursor-pointer group h-full">
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <h4 className="font-bold text-lg text-foreground group-hover:text-primary transition line-clamp-2">
                            {item.hackathonDetails.title}
                          </h4>
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/30 whitespace-nowrap">
                            {item.daysLeft}d
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-1">
                          {item.hackathonDetails.type || 'Hackathon'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-border/40 pt-4">
                          <Clock className="w-4 h-4 opacity-70" />
                          <span><strong>Deadline:</strong> {item.hackathonDetails.deadline}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* ⚡ INSIGHT */}
            <div className="bg-gradient-to-r from-primary/12 via-blue-500/8 to-primary/5 border border-primary/25 rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10 flex items-start gap-4">
                <div className="text-3xl flex-shrink-0">⚡</div>
                <div className="flex-1">
                  <p className="text-sm font-bold uppercase tracking-wider text-primary mb-2">Smart Insight</p>
                  <p className="text-lg text-foreground font-medium leading-relaxed">
                    {focusNow.daysLeft <= 3 ? (
                      <>You&apos;re in crunch mode. Lock in on <strong className="text-primary">{focusNow.hackathonDetails.title}</strong> today — deadline in {focusNow.daysLeft} day{focusNow.daysLeft !== 1 ? 's' : ''}.</>
                    ) : prioritizedHackathons.thisWeek.length > 0 ? (
                      <>You have <strong className="text-primary">{prioritizedHackathons.thisWeek.length + prioritizedHackathons.urgent.length}</strong> hackathons this week. Pace yourself and split your focus across {prioritizedHackathons.thisWeek.length + prioritizedHackathons.urgent.length} projects.</>
                    ) : (
                      <>You have {prioritizedHackathons.later.length} hackathons ahead. Start early on the closest one to build momentum.</>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed rounded-3xl bg-muted/20">
            <p className="text-muted-foreground mb-3">No hackathons joined yet</p>
            <Link to="/">
              <Button variant="outline">Explore Hackathons</Button>
            </Link>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
           <Code className="w-6 h-6 text-primary" /> All My Registrations
        </h2>
        
        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Loading your hackathons...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {registrations.map(reg => (
              <Card key={reg.id} className="group hover:border-primary/50 transition-colors flex flex-col">
                <CardHeader>
                  <CardTitle className="text-xl line-clamp-1">{reg.hackathonName}</CardTitle>
                  <p className="text-sm text-muted-foreground bg-muted w-fit px-2 py-0.5 rounded-md mt-2">Team: {reg.teamName}</p>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col mt-2 border-t border-border/50 pt-4">
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="inline-block w-2 h-2 rounded-full bg-primary" />
                      <span className="text-muted-foreground">
                        <span className="font-semibold text-foreground">Event:</span> {reg.hackathonDetails.date}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-muted-foreground">
                        <span className="font-semibold text-foreground">Status:</span> Confirmed ✓
                      </span>
                    </div>
                  </div>
                  <Link to={`/hackathon/${reg.hackathonId}`} className="mt-auto">
                    <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all flex items-center justify-center gap-2">
                      View Details
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
            {registrations.length === 0 && (
              <div className="col-span-full py-20 text-center text-muted-foreground border border-dashed rounded-3xl bg-muted/20">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
                You haven&apos;t confirmed any hackathons yet. <br />
                <Link to="/" className="text-primary hover:underline mt-2 inline-block">Explore hackathons →</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
