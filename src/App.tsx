import { AnimatePresence, motion, type HTMLMotionProps } from 'framer-motion';
import { BriefcaseBusiness, Building2, Check, ChevronRight, FileUp, LogOut, Search, Send, ShieldAlert, Sparkles, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { signIn, signOut, signUp } from './lib/auth';
import { mockCategories, mockListings } from './lib/mockData';
import { supabase, type Application, type Category, type Listing, type Profile, type Role } from './lib/supabase';

const page = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.25 },
};

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-ink to-coal ring-1 ring-white/10">
        <div className="flex items-end gap-1">
          <span className="h-4 w-2 rounded bg-gradient-to-t from-ember to-amber" />
          <span className="h-6 w-2 rounded bg-gradient-to-t from-ember to-amber" />
          <span className="h-8 w-2 rounded bg-gradient-to-t from-ember to-amber" />
        </div>
      </div>
      <div>
        <p className="font-display text-xl font-bold">Foothold</p>
        <p className="text-xs text-white/55">Get your foothold.</p>
      </div>
    </div>
  );
}

function Button(props: HTMLMotionProps<'button'> & { quiet?: boolean }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      {...props}
      className={`${props.quiet ? 'glass text-white' : 'action-gradient text-ink'} inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-bold shadow-glow transition disabled:cursor-not-allowed disabled:opacity-60 ${props.className ?? ''}`}
    />
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="w-full rounded-lg border border-white/10 bg-white/[0.07] px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-amber/70" />;
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className="min-h-32 w-full rounded-lg border border-white/10 bg-white/[0.07] px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-amber/70" />;
}

function Shell({ profile, children }: { profile: Profile | null; children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-ink/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link to={profile ? '/app' : '/'}><Logo /></Link>
          {profile && (
            <nav className="flex items-center gap-2">
              <Link className="rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white" to="/app">Dashboard</Link>
              {profile.role === 'user' && <Link className="rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white" to="/browse">Browse</Link>}
              {profile.role === 'company' && <Link className="rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white" to="/listings/new">New listing</Link>}
              <button className="rounded-lg p-2 text-white/70 hover:bg-white/10" onClick={() => signOut()} title="Sign out"><LogOut size={18} /></button>
            </nav>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-8">{children}</main>
    </div>
  );
}

function Welcome() {
  return (
    <motion.section {...page} className="grid min-h-[78vh] content-center gap-10">
      <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }} className="max-w-4xl">
        <motion.div variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}><Logo /></motion.div>
        <motion.h1 variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }} className="mt-8 font-display text-6xl font-bold leading-none md:text-8xl">Get your foothold.</motion.h1>
        <motion.p variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }} className="mt-6 max-w-2xl text-lg leading-8 text-white/68">A sharper place to find real opportunities, post meaningful work, and keep every application moving one step upward.</motion.p>
        <motion.div variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }} className="mt-8 flex flex-wrap gap-3">
          <Link to="/auth?role=user"><Button><Search size={18} />Find opportunities</Button></Link>
          <Link to="/auth?role=company"><Button quiet><Building2 size={18} />Post a listing</Button></Link>
        </motion.div>
      </motion.div>
      <div className="grid gap-3 md:grid-cols-3">
        {['Browse roles by craft, place, and terms.', 'Upload CVs into private Supabase storage.', 'Acceptances become interview plans instantly.'].map((text) => (
          <div key={text} className="glass rounded-lg p-5 text-white/70"><Sparkles className="mb-4 text-amber" size={20} />{text}</div>
        ))}
      </div>
    </motion.section>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const roleFromUrl = new URLSearchParams(location.search).get('role') as Role | null;
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [role, setRole] = useState<Role>(roleFromUrl ?? 'user');
  const [form, setForm] = useState({ email: '', password: '', fullName: '', orgName: '', orgDescription: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (mode === 'login') await signIn(form.email, form.password);
      else await signUp({ ...form, role });
      navigate('/app');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.form {...page} onSubmit={submit} className="mx-auto grid max-w-xl gap-4">
      <h1 className="font-display text-5xl font-bold">{mode === 'login' ? 'Welcome back' : 'Start upward'}</h1>
      <div className="grid grid-cols-2 gap-2 rounded-lg bg-white/5 p-1">
        <button type="button" onClick={() => setMode('signup')} className={`rounded-md py-2 font-semibold ${mode === 'signup' ? 'action-gradient text-ink' : 'text-white/70'}`}>Signup</button>
        <button type="button" onClick={() => setMode('login')} className={`rounded-md py-2 font-semibold ${mode === 'login' ? 'action-gradient text-ink' : 'text-white/70'}`}>Login</button>
      </div>
      {mode === 'signup' && <Field required placeholder="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />}
      <Field required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <Field required type="password" minLength={6} placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      {mode === 'signup' && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <RoleCard active={role === 'user'} icon={<BriefcaseBusiness />} title="I'm looking" onClick={() => setRole('user')} />
            <RoleCard active={role === 'company'} icon={<Building2 />} title="I'm hiring" onClick={() => setRole('company')} />
          </div>
          {role === 'company' && (
            <div className="grid gap-3">
              <p className="flex items-center gap-2 rounded-lg border border-amber/25 bg-amber/10 p-3 text-sm text-amber"><ShieldAlert size={16} />Organization verification is coming later. Your account starts unverified.</p>
              <Field required placeholder="Organization name" value={form.orgName} onChange={(e) => setForm({ ...form, orgName: e.target.value })} />
              <TextArea placeholder="Short description" value={form.orgDescription} onChange={(e) => setForm({ ...form, orgDescription: e.target.value })} />
            </div>
          )}
        </>
      )}
      <AnimatePresence>{error && <motion.p initial={{ x: -8, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ opacity: 0 }} className="rounded-lg border border-ember/30 bg-ember/10 p-3 text-sm text-amber">{error}</motion.p>}</AnimatePresence>
      <Button disabled={busy}>{busy ? 'Working...' : mode === 'login' ? 'Login' : 'Create account'}<ChevronRight size={18} /></Button>
    </motion.form>
  );
}

function RoleCard({ active, icon, title, onClick }: { active: boolean; icon: React.ReactNode; title: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`rounded-lg border p-4 text-left transition ${active ? 'border-amber bg-amber/10' : 'border-white/10 bg-white/[0.04]'}`}><span className="text-amber">{icon}</span><span className="mt-3 block font-bold">{title}</span></button>;
}

function useSessionProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return setLoading(false);
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      setProfile(data);
      setLoading(false);
    }
    load();
    return supabase.auth.onAuthStateChange(() => load()).data.subscription.unsubscribe;
  }, []);
  return { profile, loading };
}

function Dashboard({ profile }: { profile: Profile }) {
  return profile.role === 'company' ? <CompanyDashboard profile={profile} /> : <UserDashboard profile={profile} />;
}

function Empty({ text }: { text: string }) {
  return <div className="glass rounded-lg p-8 text-center text-white/55"><Sparkles className="mx-auto mb-3 text-amber" />{text}</div>;
}

function UserDashboard({ profile }: { profile: Profile }) {
  const [apps, setApps] = useState<Application[]>([]);
  useEffect(() => {
    loadApplications().then(setApps);
    const channel = supabase.channel('user-apps').on('postgres_changes', { event: '*', schema: 'public', table: 'applications', filter: `user_id=eq.${profile.id}` }, () => loadApplications().then(setApps)).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile.id]);
  async function loadApplications() {
    const { data } = await supabase.from('applications').select('*, listings(*, companies(*), categories(*)), interviews(*)').order('created_at', { ascending: false });
    return data ?? [];
  }
  return <motion.section {...page}><h1 className="font-display text-4xl font-bold">Your applications</h1><div className="mt-6 grid gap-4">{apps.length ? apps.map((app) => <ApplicationCard key={app.id} app={app} />) : <Empty text="Applications you send will climb into view here." />}</div></motion.section>;
}

function StatusBadge({ status }: { status: string }) {
  const map = { pending: 'border-amber/35 bg-amber/10 text-amber', accepted: 'border-emerald-300/30 bg-emerald-300/10 text-emerald-200', rejected: 'border-ember/35 bg-ember/10 text-orange-200' } as Record<string, string>;
  return <motion.span layout className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${map[status] ?? map.pending}`}>{status}</motion.span>;
}

function ApplicationCard({ app }: { app: Application }) {
  const interview = app.interviews?.[0];
  return (
    <motion.article layout className="glass rounded-lg p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-display text-2xl font-bold">{app.listings?.title}</h2><p className="text-white/55">{app.listings?.companies?.org_name}</p></div><StatusBadge status={app.status} /></div>
      {app.feedback_message && <p className="mt-4 rounded-lg bg-white/[0.06] p-3 text-white/72">{app.feedback_message}</p>}
      {interview && <p className="mt-4 rounded-lg border border-amber/25 bg-amber/10 p-3 text-amber">Interview: {new Date(interview.scheduled_at).toLocaleString()} at {interview.location_or_link}{interview.notes ? ` - ${interview.notes}` : ''}</p>}
    </motion.article>
  );
}

function Browse() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  useEffect(() => {
    supabase.from('listings').select('*, companies(*), categories(*)').eq('status', 'open').order('created_at', { ascending: false }).then(({ data }) => setListings(data?.length ? data : mockListings));
    supabase.from('categories').select('*').then(({ data }) => setCategories(data?.length ? data : mockCategories));
  }, []);
  const filtered = useMemo(() => listings.filter((l) => (category === 'all' || l.category_id === category) && `${l.title} ${l.location} ${l.description}`.toLowerCase().includes(query.toLowerCase())), [listings, query, category]);
  return (
    <motion.section {...page}>
      <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-display text-5xl font-bold">Browse openings</h1><p className="mt-2 text-white/58">Filter without losing your place.</p></div><div className="flex gap-2"><Field placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} /><select className="rounded-lg border border-white/10 bg-coal px-4 text-white" value={category} onChange={(e) => setCategory(e.target.value)}><option value="all">All</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div></div>
      <motion.div layout className="mt-7 grid gap-4 md:grid-cols-2">{filtered.length ? filtered.map((listing) => <ListingCard key={listing.id} listing={listing} />) : <Empty text="No listings match that search yet." />}</motion.div>
    </motion.section>
  );
}

function ListingCard({ listing }: { listing: Listing }) {
  return <motion.article layout whileHover={{ y: -3 }} className="glass rounded-lg p-5"><div className="flex justify-between gap-4"><h2 className="font-display text-2xl font-bold">{listing.title}</h2>{listing.companies?.is_verified === false && <span className="h-fit rounded-full border border-amber/25 px-2 py-1 text-xs text-amber">Unverified</span>}</div><p className="mt-2 text-white/55">{listing.companies?.org_name} - {listing.location} - {listing.employment_type}</p><p className="mt-4 line-clamp-3 text-white/68">{listing.description}</p><Link to={`/listings/${listing.id}`} className="mt-5 inline-flex items-center gap-2 font-bold text-amber">View listing <ChevronRight size={16} /></Link></motion.article>;
}

function ListingDetail({ profile }: { profile: Profile }) {
  const { id } = useParams();
  const [listing, setListing] = useState<Listing | null>(null);
  const [cover, setCover] = useState('');
  const [cv, setCv] = useState<File | null>(null);
  const [success, setSuccess] = useState(false);
  useEffect(() => {
    const fallback = mockListings.find((item) => item.id === id) ?? null;
    supabase.from('listings').select('*, companies(*), categories(*)').eq('id', id).single().then(({ data }) => setListing(data ?? fallback));
  }, [id]);
  async function apply() {
    let cvUrl = null;
    if (cv) {
      const path = `${profile.id}/${crypto.randomUUID()}-${cv.name}`;
      const { error } = await supabase.storage.from('application-documents').upload(path, cv);
      if (error) throw error;
      cvUrl = path;
    }
    const { error } = await supabase.from('applications').insert({ listing_id: id, user_id: profile.id, cv_url: cvUrl, cover_letter_text: cover });
    if (error) throw error;
    setSuccess(true);
  }
  if (!listing) return <Empty text="Loading listing details..." />;
  return <motion.section {...page} className="grid gap-6 lg:grid-cols-[1fr_380px]"><article><p className="text-amber">{listing.categories?.name}</p><h1 className="mt-2 font-display text-5xl font-bold">{listing.title}</h1><p className="mt-3 text-white/58">{listing.companies?.org_name} - {listing.location} - {listing.employment_type}</p><p className="mt-8 whitespace-pre-wrap leading-8 text-white/72">{listing.description}</p></article>{profile.role === 'user' && <aside className="glass h-fit rounded-lg p-5"><h2 className="font-display text-2xl font-bold">Apply</h2><label className="mt-4 flex cursor-pointer flex-col items-center rounded-lg border border-dashed border-amber/35 p-6 text-center text-white/60"><FileUp className="mb-2 text-amber" />{cv?.name ?? 'Upload CV'}<input className="sr-only" type="file" onChange={(e) => setCv(e.target.files?.[0] ?? null)} /></label><TextArea className="mt-3" placeholder="Cover letter" value={cover} onChange={(e) => setCover(e.target.value)} />{success ? <motion.p initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="mt-4 flex items-center gap-2 rounded-lg bg-amber/15 p-3 text-amber"><Check />Application submitted</motion.p> : <Button className="mt-4 w-full" onClick={apply}><Send size={18} />Submit</Button>}</aside>}</motion.section>;
}

function CompanyDashboard({ profile }: { profile: Profile }) {
  const [apps, setApps] = useState<Application[]>([]);
  useEffect(() => { load().then(setApps); const channel = supabase.channel('company-apps').on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, () => load().then(setApps)).subscribe(); return () => { supabase.removeChannel(channel); }; }, []);
  async function load() {
    const { data } = await supabase.from('applications').select('*, profiles(*), listings(*, companies(*)), interviews(*)').order('created_at', { ascending: false });
    return (data ?? []).filter((a) => a.listings?.company_id === profile.id);
  }
  return <motion.section {...page}><div className="flex justify-between gap-4"><h1 className="font-display text-4xl font-bold">Applications inbox</h1><Link to="/listings/new"><Button><BriefcaseBusiness size={18} />New listing</Button></Link></div><div className="mt-6 grid gap-4">{apps.length ? apps.map((app) => <CompanyApplication key={app.id} app={app} />) : <Empty text="Applications for your listings will land here." />}</div></motion.section>;
}

function CompanyApplication({ app }: { app: Application }) {
  const [feedback, setFeedback] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [place, setPlace] = useState('');
  async function reject() { await supabase.from('applications').update({ status: 'rejected', feedback_message: feedback || null }).eq('id', app.id); }
  async function accept() { await supabase.from('applications').update({ status: 'accepted' }).eq('id', app.id); if (scheduledAt && place) await supabase.from('interviews').insert({ application_id: app.id, scheduled_at: scheduledAt, location_or_link: place }); }
  return <motion.article layout className="glass rounded-lg p-5"><div className="flex flex-wrap justify-between gap-3"><div><h2 className="font-display text-2xl font-bold">{app.profiles?.full_name}</h2><p className="text-white/55">{app.listings?.title}</p></div><StatusBadge status={app.status} /></div><p className="mt-4 text-white/70">{app.cover_letter_text || 'No cover letter text provided.'}</p><div className="mt-4 grid gap-3 md:grid-cols-3"><Field type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} /><Field placeholder="Interview link or location" value={place} onChange={(e) => setPlace(e.target.value)} /><Field placeholder="Feedback for rejection" value={feedback} onChange={(e) => setFeedback(e.target.value)} /></div><div className="mt-4 flex gap-2"><Button onClick={accept}><Check size={18} />Accept</Button><Button quiet onClick={reject}><X size={18} />Reject</Button></div></motion.article>;
}

function NewListing({ profile }: { profile: Profile }) {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({ title: '', description: '', category_id: '', location: '', employment_type: 'full-time', salary_range: '' });
  useEffect(() => { supabase.from('categories').select('*').then(({ data }) => setCategories(data ?? [])); }, []);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const { error } = await supabase.from('listings').insert({ ...form, company_id: profile.id, salary_range: form.salary_range || null, category_id: form.category_id || null });
    if (!error) navigate('/app');
  }
  return <motion.form {...page} onSubmit={submit} className="mx-auto grid max-w-2xl gap-4"><h1 className="font-display text-5xl font-bold">Create listing</h1><Field required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /><TextArea required placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /><div className="grid gap-3 md:grid-cols-2"><select className="rounded-lg border border-white/10 bg-coal px-4 py-3 text-white" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}><option value="">Category</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select><select className="rounded-lg border border-white/10 bg-coal px-4 py-3 text-white" value={form.employment_type} onChange={(e) => setForm({ ...form, employment_type: e.target.value })}><option value="full-time">Full-time</option><option value="part-time">Part-time</option><option value="contract">Contract</option><option value="freelance">Freelance</option></select></div><Field required placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /><Field placeholder="Salary range" value={form.salary_range} onChange={(e) => setForm({ ...form, salary_range: e.target.value })} /><Button>Publish listing</Button></motion.form>;
}

function App() {
  const { profile, loading } = useSessionProfile();
  const location = useLocation();
  if (loading) return <Shell profile={null}><Empty text="Preparing your workspace..." /></Shell>;
  return (
    <Shell profile={profile}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={profile ? <Navigate to="/app" /> : <Welcome />} />
          <Route path="/auth" element={profile ? <Navigate to="/app" /> : <AuthPage />} />
          <Route path="/app" element={profile ? <Dashboard profile={profile} /> : <Navigate to="/auth" />} />
          <Route path="/browse" element={profile ? <Browse /> : <Navigate to="/auth" />} />
          <Route path="/listings/new" element={profile?.role === 'company' ? <NewListing profile={profile} /> : <Navigate to="/app" />} />
          <Route path="/listings/:id" element={profile ? <ListingDetail profile={profile} /> : <Navigate to="/auth" />} />
        </Routes>
      </AnimatePresence>
    </Shell>
  );
}

export default App;
