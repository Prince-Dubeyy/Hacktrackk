import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getHackathon } from '../lib/hackathons';
import { getRegistrationsForHackathon, createRegistration, deleteRegistration } from '../lib/registrations';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Users, UserPlus, MapPin, Calendar, ExternalLink } from 'lucide-react';

export function HackathonDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loginWithGoogle } = useAuth();
  
  const [hackathon, setHackathon] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState(['']);
  const [isLookingForTeam, setIsLookingForTeam] = useState(false);

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

  const fetchData = async () => {
    setLoading(true);
    try {
      const hackData = await getHackathon(id);
      if (hackData) {
        setHackathon(hackData);
        const regData = await getRegistrationsForHackathon(id);
        setRegistrations(regData);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const existingRegistration = user ? registrations.find(r => r.userId === user.uid) : null;

  const handleAddMember = () => setMembers([...members, '']);
  const handleMemberChange = (index, value) => {
    const newMembers = [...members];
    newMembers[index] = value;
    setMembers(newMembers);
  };
  const handleRemoveMember = (index) => {
    const newMembers = members.filter((_, i) => i !== index);
    setMembers(newMembers);
  };

  const handleSubmitRegistration = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      await createRegistration({
        userId: user.uid,
        hackathonId: id,
        hackathonName: hackathon.title,
        teamName,
        leaderName: user.displayName,
        leaderEmail: user.email,
        members: members.filter(m => m.trim() !== ''),
        isLookingForTeam,
      });
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Registration Error", error);
    }
  };

  const handleUnregister = async () => {
    if (window.confirm("Are you sure you want to withdraw your registration?")) {
      await deleteRegistration(existingRegistration.id);
      fetchData();
    }
  };

  if (loading) return <div className="text-center py-32 text-muted-foreground text-lg">Loading Hackathon Details...</div>;
  if (!hackathon) return <div className="text-center py-32 text-muted-foreground text-lg">Hackathon not found.</div>;

  const lookingForTeam = registrations.filter(r => r.isLookingForTeam);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pt-4">
      <div className="bg-card rounded-[2rem] p-8 md:p-10 border border-border shadow-sm flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        
        <div className="flex-1 space-y-6 z-10">
          <div className="flex items-center gap-3 mb-2">
             <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                {parseEventDate(hackathon.date) < new Date()
                  ? `Past ${hackathon.type || 'Hackathon'}`
                  : `Upcoming ${hackathon.type || 'Hackathon'}`}
             </span>
             <div className="text-sm text-foreground/70 font-medium px-3 py-1 bg-muted rounded-full">Ends: {formatEventDate(hackathon.deadline)}</div>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">{hackathon.title}</h1>
          <p className="text-lg text-muted-foreground whitespace-pre-wrap leading-relaxed max-w-3xl">
            {hackathon.description}
          </p>
          <div className="flex flex-wrap items-center gap-6 text-sm text-foreground/80 font-medium pt-4">
             <div className="flex items-center gap-2"><Calendar className="w-5 h-5 opacity-70" /> {formatEventDate(hackathon.date)}</div>
             <div className="flex items-center gap-2"><MapPin className="w-5 h-5 opacity-70" /> {hackathon.location}</div>
             {hackathon.link && (
               <a href={hackathon.link} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary hover:underline group">
                 <ExternalLink className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" /> Official Website
               </a>
             )}
          </div>
        </div>
        
        <div className="w-full md:w-80 bg-background/50 backdrop-blur-sm p-6 rounded-3xl border border-border/50 text-center space-y-6 z-10 relative">
           <div className="py-2">
             <div className="text-5xl font-extrabold bg-gradient-to-br from-foreground to-foreground/50 bg-clip-text text-transparent">{registrations.length}</div>
             <div className="text-sm text-muted-foreground font-medium mt-1">Teams Registered</div>
           </div>
           
           {user ? (
             existingRegistration ? (
               <div className="space-y-3">
                 <Button variant="secondary" className="w-full cursor-default py-6">Registered as {existingRegistration.teamName}</Button>
                 <Button variant="outline" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900" onClick={handleUnregister}>Withdraw Registration</Button>
               </div>
             ) : (
                <Button className="w-full h-14 text-lg rounded-full shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all" onClick={() => setIsModalOpen(true)}>
                  Attend {hackathon.type || 'Hackathon'}
                </Button>
             )
           ) : (
             <Button className="w-full h-14 text-lg rounded-full" onClick={loginWithGoogle}>Sign In to Attend</Button>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b border-border">
            <Users className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">Registered Teams</h2>
          </div>
          {registrations.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {registrations.map(reg => (
                <Card key={reg.id} className="bg-card hover:border-border/80 transition-colors">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex justify-between items-start gap-2">
                      <span className="truncate">{reg.teamName}</span>
                      {reg.isLookingForTeam && <span className="shrink-0 text-[10px] uppercase tracking-wider font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full dark:bg-blue-900/30 dark:text-blue-400">Looking</span>}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground truncate">Led by {reg.leaderName}</p>
                  </CardHeader>
                  {reg.members?.length > 0 && (
                     <CardContent className="pt-0">
                       <p className="text-sm text-muted-foreground flex items-center gap-1.5"><Users className="w-3.5 h-3.5 opacity-70" /> {reg.members.length} extra member(s)</p>
                     </CardContent>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-muted-foreground border border-dashed rounded-3xl bg-muted/20">
               No teams registered yet. Be the first to join!
            </div>
          )}
        </div>

        <div className="space-y-6">
           <div className="flex items-center gap-3 pb-2 border-b border-border">
             <UserPlus className="w-6 h-6 text-amber-500" />
             <h2 className="text-2xl font-bold tracking-tight">Teammate Finder</h2>
           </div>
           <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 rounded-3xl p-6 space-y-4 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
             <p className="text-sm text-foreground/70 font-medium relative z-10">Teams looking for more members:</p>
             {lookingForTeam.length > 0 ? (
               <div className="space-y-3 relative z-10">
                 {lookingForTeam.map(reg => (
                   <div key={`lf-${reg.id}`} className="bg-background border border-border/50 p-4 rounded-xl text-sm shadow-sm">
                     <p className="font-semibold text-base mb-1">{reg.teamName}</p>
                     <p className="text-muted-foreground">Contact: <span className="text-foreground">{reg.leaderName}</span></p>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="text-sm text-muted-foreground text-center py-8 bg-background/50 rounded-xl border border-border/50 relative z-10">
                 No one is currently looking.
               </div>
             )}
           </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Register for ${hackathon.type || 'Hackathon'}`}>
        <form onSubmit={handleSubmitRegistration} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Team Name</label>
            <Input value={teamName} onChange={e => setTeamName(e.target.value)} required placeholder="e.g. Awesome Squad" className="h-12" />
          </div>
          
          <div className="space-y-3">
            <label className="text-sm font-semibold">Team Members (Optional)</label>
            <p className="text-xs text-muted-foreground -mt-2 mb-2">You (the leader) are already included.</p>
            {members.map((member, index) => (
              <div key={index} className="flex gap-2">
                <Input value={member} onChange={e => handleMemberChange(index, e.target.value)} placeholder={`Member ${index + 1} Name`} />
                <Button type="button" variant="outline" onClick={() => handleRemoveMember(index)} className="px-3" title="Remove member">✕</Button>
              </div>
            ))}
            <Button type="button" variant="secondary" size="sm" onClick={handleAddMember} className="w-full border border-dashed rounded-lg bg-muted/50">
              <UserPlus className="w-4 h-4 mr-2" /> Add Member
            </Button>
          </div>

          <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl border border-border">
            <input 
              type="checkbox" 
              id="lookingForTeam" 
              checked={isLookingForTeam} 
              onChange={e => setIsLookingForTeam(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
            />
            <label htmlFor="lookingForTeam" className="text-sm font-medium cursor-pointer select-none">
              We are looking for more team members
            </label>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-border/50 mt-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="rounded-full px-8">Confirm Registration</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
