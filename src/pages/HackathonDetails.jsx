import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getHackathon } from './hackathons';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui/Button';
import { MapPin, Calendar, ExternalLink, Check, Users, Zap, TrendingUp } from 'lucide-react';

export function HackathonDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loginWithGoogle } = useAuth();
  const toast = useToast();
  
  const [hackathon, setHackathon] = useState(null);
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(true);

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

  const getStatusBadge = (daysLeft) => {
    if (daysLeft < 0) return { label: '✓ Completed', color: 'bg-gray-500/20 text-gray-700 dark:text-gray-400' };
    if (daysLeft === 0) return { label: '🔥 Today', color: 'bg-red-500/20 text-red-700 dark:text-red-400' };
    if (daysLeft <= 3) return { label: '⚠️ Deadline Soon', color: 'bg-orange-500/20 text-orange-700 dark:text-orange-400' };
    if (daysLeft <= 7) return { label: '📅 This Week', color: 'bg-amber-500/20 text-amber-700 dark:text-amber-400' };
    return { label: '🟢 Upcoming', color: 'bg-green-500/20 text-green-700 dark:text-green-400' };
  };

  const fetchHackathon = async () => {
    setLoading(true);
    try {
      const hackData = await getHackathon(id);
      if (hackData) {
        setHackathon(hackData);
        
        // Check if user already confirmed (from localStorage for demo; replace with DB call when ready)
        if (user) {
          const confirmed = localStorage.getItem(`hackathon_confirmed_${id}_${user.uid}`);
          setHasConfirmed(!!confirmed);
        }
      }
    } catch (error) {
      console.error(error);
      toast?.('Failed to load hackathon details', 'destructive');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchHackathon();
  }, [id, user]);

  const handleConfirmRegistration = async () => {
    if (!user) {
      loginWithGoogle();
      return;
    }

    setIsSubmitting(true);
    try {
      // Save confirmation to localStorage (replace with DB when ready)
      localStorage.setItem(`hackathon_confirmed_${id}_${user.uid}`, 'true');
      setHasConfirmed(true);
      setShowConfirmation(false);
      
      toast?.('✅ Added to your dashboard!', 'success');
      
      // Optional: redirect to dashboard after 1.5s
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error) {
      console.error('Confirmation error:', error);
      toast?.('Failed to confirm registration', 'destructive');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-32 text-muted-foreground text-lg">Loading details...</div>;
  }

  if (!hackathon) {
    return <div className="text-center py-32 text-muted-foreground text-lg">{hackathon?.type || 'Hackathon'} not found.</div>;
  }

  const daysLeft = getDaysLeft(hackathon.deadline);
  const statusBadge = getStatusBadge(daysLeft);

  return (
    <div className="space-y-8 max-w-4xl mx-auto pt-4">
      {/* Header Section */}
      <div className="bg-card rounded-[2rem] p-8 md:p-10 border border-border shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        
        <div className="relative z-10 space-y-6">
          {/* Status Row */}
          <div className="flex flex-wrap items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusBadge.color}`}>
              {statusBadge.label}
            </span>
            <span className="text-sm text-foreground/70 font-medium px-3 py-1 bg-muted rounded-full">
              {hackathon.type || 'Hackathon'}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            {hackathon.title}
          </h1>

          {/* Description */}
          <p className="text-lg text-muted-foreground whitespace-pre-wrap leading-relaxed max-w-3xl">
            {hackathon.description}
          </p>

          {/* Details Grid */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-foreground/80 font-medium pt-4 border-t border-border/30">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 opacity-70" />
              <span>{formatEventDate(hackathon.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 opacity-70" />
              <span>{hackathon.location}</span>
            </div>
            {daysLeft !== null && (
              <div className="flex items-center gap-2 font-bold text-primary">
                ⏰ {daysLeft} days left
              </div>
            )}
            {hackathon.link && (
              <a
                href={hackathon.link}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-primary hover:underline group ml-auto"
              >
                <ExternalLink className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" />
                Official Website
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Section */}
      {hasConfirmed ? (
        // After Confirmation - Premium State
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/30 rounded-2xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10 flex items-start gap-6">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-2">
                ✅ You&apos;re Attending
              </h2>
              <p className="text-green-700/70 dark:text-green-400/70 mb-4">
                This {hackathon.type?.toLowerCase() || 'hackathon'} has been added to your dashboard.
              </p>
              <Button
                onClick={() => navigate('/dashboard')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                View Dashboard →
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // Before Confirmation - Call to Action
        showConfirmation && user && (
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30 rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative z-10 space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Have you registered?</h2>
                <p className="text-muted-foreground text-lg">
                  Visit the official website to complete your registration, then confirm here.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                {hackathon.link && (
                  <a href={hackathon.link} target="_blank" rel="noreferrer" className="flex-1">
                    <Button
                      variant="outline"
                      className="w-full h-12 text-base gap-2 hover:border-primary hover:text-primary"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Go to Official Site
                    </Button>
                  </a>
                )}
                <Button
                  onClick={handleConfirmRegistration}
                  disabled={isSubmitting}
                  className="flex-1 h-12 text-base bg-gradient-to-r from-primary to-primary/80 hover:shadow-lg shadow-primary/25"
                >
                  {isSubmitting ? (
                    <>
                      <span className="inline-block animate-spin mr-2">⏳</span>
                      Confirming...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      I&apos;ve Registered
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )
      )}

      {/* Team Selection & Invite Links Section */}
      {(hackathon.teamALink || hackathon.teamBLink) && (
        <div className="bg-card border border-border/60 rounded-[2rem] p-8 md:p-10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 pointer-events-none" />
          
          <div className="relative z-10 space-y-8">
            <div className="flex items-center justify-between border-b border-border/40 pb-6">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Join Your Team</h2>
                <p className="text-muted-foreground mt-1">Choose your team and join the community</p>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-xl border border-primary/10">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-sm font-bold text-primary italic font-serif">Collaboration Space</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Team A Card */}
              {hackathon.teamALink && (
                <div className="group relative bg-gradient-to-br from-primary/5 via-background to-background border border-primary/20 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60 bg-primary/5 px-2 py-1 rounded">Option A</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Team A Hub</h3>
                  <p className="text-muted-foreground text-sm mb-6 line-clamp-2 italic font-serif">
                    Connect with fellow innovators and start building your breakthrough solution.
                  </p>
                  <a href={hackathon.teamALink} target="_blank" rel="noreferrer">
                    <Button className="w-full h-12 gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                      Join Team A <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                </div>
              )}

              {/* Team B Card */}
              {hackathon.teamBLink && (
                <div className="group relative bg-gradient-to-br from-cyan-500/5 via-background to-background border border-cyan-500/20 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/5 hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-cyan-600" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-600/60 bg-cyan-500/5 px-2 py-1 rounded">Option B</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Team B Hub</h3>
                  <p className="text-muted-foreground text-sm mb-6 line-clamp-2 italic font-serif">
                    Join the specialized track and collaborate with experts in the field.
                  </p>
                  <a href={hackathon.teamBLink} target="_blank" rel="noreferrer">
                    <Button className="w-full h-12 gap-2 bg-cyan-600 hover:bg-cyan-700 shadow-lg shadow-cyan-600/20">
                      Join Team B <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                </div>
              )}
            </div>

            <div className="bg-muted/30 border border-border/40 rounded-xl p-4 flex items-start gap-3">
              <div className="text-lg mt-0.5">💡</div>
              <p className="text-xs text-muted-foreground leading-relaxed italic font-serif">
                You can join either Team A or Team B based on your interest or assigned group. 
                Please ensure you've registered on the official website before joining the team hubs.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sign In Prompt */}
      {!user && (
        <div className="bg-card border border-border/60 rounded-2xl p-8 text-center space-y-4">
          <h2 className="text-2xl font-bold">Sign in to track this {hackathon.type?.toLowerCase() || 'hackathon'}</h2>
          <p className="text-muted-foreground text-lg">
            Create an account to confirm your participation and track deadlines.
          </p>
          <Button
            onClick={loginWithGoogle}
            size="lg"
            className="mx-auto bg-gradient-to-r from-primary to-primary/80"
          >
            Sign In with Google →
          </Button>
        </div>
      )}

      {/* Deadline Info */}
      {daysLeft !== null && daysLeft <= 3 && (
        <div className="bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/30 rounded-xl p-6 flex items-start gap-4">
          <div className="text-2xl flex-shrink-0">⚠️</div>
          <div>
            <h3 className="font-bold text-red-900 dark:text-red-200 mb-1">
              Deadline Approaching
            </h3>
            <p className="text-red-800 dark:text-red-300">
              Only {daysLeft} day{daysLeft !== 1 ? 's' : ''} left! Make sure to register on the official website before the deadline closes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
