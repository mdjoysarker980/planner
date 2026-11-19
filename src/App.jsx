import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { CalendarDays, Check, CheckCircle2, Circle, Clock3, LogOut, Plus, Search, Sparkles, Target, Trash2, ListTodo } from 'lucide-react';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = url && anonKey ? createClient(url, anonKey) : null;
const today = () => new Date().toLocaleDateString('en-CA');
const dateLabel = new Intl.DateTimeFormat('bn-BD', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('ব্যক্তিগত');
  const [dueDate, setDueDate] = useState(today());
  const [filter, setFilter] = useState('সব কাজ');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) loadTasks();
    else setTasks([]);
  }, [session?.user?.id]);

  async function loadTasks() {
    const { data, error: err } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (err) setError(err.message); else setTasks(data || []);
  }

  async function signIn() {
    if (!supabase) { setError('Supabase সেটআপ করা হয়নি। README.md-এর নির্দেশনা অনুসরণ করুন।'); return; }
    setError('');
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (err) setError(err.message);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setTasks([]);
  }

  async function addTask(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true); setError('');
    const { data, error: err } = await supabase.from('tasks').insert({
      user_id: session.user.id, title: title.trim(), category, due_date: dueDate, is_done: false
    }).select().single();
    if (err) setError(err.message);
    else { setTasks(current => [data, ...current]); setTitle(''); }
    setSaving(false);
  }

  async function toggleTask(task) {
    const { data, error: err } = await supabase.from('tasks').update({ is_done: !task.is_done }).eq('id', task.id).select().single();
    if (err) setError(err.message);
    else setTasks(current => current.map(t => t.id === task.id ? data : t));
  }

  async function deleteTask(id) {
    const { error: err } = await supabase.from('tasks').delete().eq('id', id);
    if (err) setError(err.message);
    else setTasks(current => current.filter(t => t.id !== id));
  }

  const done = tasks.filter(t => t.is_done).length;
  const pending = tasks.length - done;
  const progress = tasks.length ? Math.round(done / tasks.length * 100) : 0;
  const shown = useMemo(() => tasks.filter(t => {
    const matchText = t.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'সব কাজ' || (filter === 'অসম্পূর্ণ' && !t.is_done) || (filter === 'সম্পন্ন' && t.is_done);
    return matchText && matchFilter;
  }), [tasks, search, filter]);

  if (loading) return <div className="center"><div className="spinner" /><p>Planner প্রস্তুত হচ্ছে...</p></div>;

  if (!session) return <main className="login-page">
    <section className="login-card">
      <div className="logo"><CalendarDays size={25}/></div>
      <p className="overline">YOUR DAY, YOUR WAY</p>
      <h1>দিনটা হোক<br/><span>তোমার পরিকল্পনায়।</span></h1>
      <p className="intro">কাজ গুছিয়ে রাখুন, গুরুত্বপূর্ণ বিষয়গুলো মনে রাখুন, আর প্রতিদিন একটু একটু করে এগিয়ে যান।</p>
      <div className="features">
        <p><CheckCircle2/> নিজের কাজ এক জায়গায় রাখুন</p>
        <p><Target/> লক্ষ্যের অগ্রগতি দেখুন</p>
        <p><Sparkles/> সহজ ও পরিষ্কার অভিজ্ঞতা</p>
      </div>
      <button className="google-btn" onClick={signIn}><GoogleIcon/> Google দিয়ে চালিয়ে যান <span>↗</span></button>
      {error && <p className="error">{error}</p>}
      <p className="privacy">আপনার ব্যক্তিগত কাজ শুধু আপনার অ্যাকাউন্টেই থাকবে।</p>
    </section>
    <footer>PLANNER <b>•</b> ছোট ছোট পদক্ষেপ, বড় অগ্রগতি</footer>
  </main>;

  return <div className="layout">
    <aside className="sidebar">
      <div className="brand"><div className="logo mini"><CalendarDays size={19}/></div>planner<span>.</span></div>
      <p className="nav-title">WORKSPACE</p>
      <button className="nav active"><ListTodo/> আমার কাজ</button>
      <button className="nav" onClick={() => setFilter('অসম্পূর্ণ')}><Clock3/> বাকি আছে</button>
      <button className="nav" onClick={() => setFilter('সম্পন্ন')}><CheckCircle2/> সম্পন্ন কাজ</button>
      <div className="account">
        <div className="avatar">{(session.user.email || 'U')[0].toUpperCase()}</div>
        <div className="account-text"><strong>{session.user.user_metadata?.full_name || 'আমার অ্যাকাউন্ট'}</strong><small>{session.user.email}</small></div>
        <button className="logout" title="লগ আউট" onClick={signOut}><LogOut size={17}/></button>
      </div>
    </aside>
    <main className="main">
      <header className="topbar"><div><p className="overline">PERSONAL WORKSPACE</p><h2>আমার ড্যাশবোর্ড</h2></div><div className="date-chip"><CalendarDays size={16}/>{dateLabel}</div></header>
      {error && <div className="error-banner">{error}<button onClick={() => setError('')}>×</button></div>}
      <section className="welcome"><div><p>স্বাগতম 👋</p><h1>আজ কী কী করতে চাও?</h1><small>একটি একটি করে কাজ শেষ করো। তুমি পারবে!</small></div><div className="welcome-icon"><Sparkles/></div></section>
      <section className="stats">
        <article className="stat"><div className="stat-icon purple"><ListTodo/></div><p>মোট কাজ</p><strong>{tasks.length}</strong><small>সব পরিকল্পনা</small></article>
        <article className="stat"><div className="stat-icon orange"><Clock3/></div><p>বাকি কাজ</p><strong>{pending}</strong><small>এখনো শেষ হয়নি</small></article>
        <article className="stat"><div className="stat-icon green"><CheckCircle2/></div><p>সম্পন্ন</p><strong>{done}</strong><small>দারুণ এগোচ্ছো!</small></article>
        <article className="stat progress-stat"><div className="progress-head"><p>অগ্রগতি</p><strong>{progress}%</strong></div><div className="track"><div style={{width: progress + '%'}}/></div><small>কাজ সম্পন্নের হার</small></article>
      </section>
      <section className="columns">
        <div className="panel">
          <div className="panel-head"><div><h3>আমার কাজের তালিকা</h3><p>তোমার পরিকল্পনাগুলো এখানে সাজানো থাকবে</p></div><span className="count">{tasks.length} টি কাজ</span></div>
          <div className="tools"><div className="tabs">{['সব কাজ','অসম্পূর্ণ','সম্পন্ন'].map(f => <button key={f} className={filter === f ? 'chosen' : ''} onClick={() => setFilter(f)}>{f}</button>)}</div><label className="search"><Search size={16}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="কাজ খুঁজুন..."/></label></div>
          <div className="task-list">{shown.length ? shown.map(task => <article className={'task ' + (task.is_done ? 'is-done' : '')} key={task.id}>
            <button className="check" onClick={() => toggleTask(task)}>{task.is_done ? <CheckCircle2/> : <Circle/>}</button>
            <div className="task-body"><strong>{task.title}</strong><div><span className="tag">{task.category}</span><small><CalendarDays size={12}/> {task.due_date || 'তারিখ নেই'}</small></div></div>
            <button className="delete" onClick={() => deleteTask(task.id)} title="মুছে ফেলুন"><Trash2 size={17}/></button>
          </article>) : <div className="empty"><div><Check/></div><strong>{tasks.length ? 'এই তালিকায় কোনো কাজ নেই' : 'এখনো কোনো কাজ যোগ করোনি'}</strong><p>পাশের ফর্ম থেকে তোমার প্রথম কাজটি যোগ করো।</p></div>}</div>
        </div>
        <aside className="add-panel">
          <div className="add-title"><div className="add-symbol"><Plus/></div><div><h3>নতুন কাজ যোগ করো</h3><p>পরিকল্পনায় নতুন কিছু যুক্ত করো</p></div></div>
          <form onSubmit={addTask}>
            <label>কাজের নাম<input value={title} onChange={e => setTitle(e.target.value)} placeholder="যেমন: আজকের পড়াশোনা..." maxLength={160} required/></label>
            <label>ক্যাটাগরি<select value={category} onChange={e => setCategory(e.target.value)}><option>ব্যক্তিগত</option><option>কাজ</option><option>পড়াশোনা</option><option>ব্যবসা</option><option>অন্যান্য</option></select></label>
            <label>শেষ করার তারিখ<input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}/></label>
            <button className="add-btn" disabled={saving || !title.trim()}><Plus size={17}/> কাজ যোগ করো</button>
          </form>
          <div className="tip"><Sparkles size={17}/><p><b>ছোট্ট পরামর্শ</b><br/>বড় কাজকে ছোট ছোট ধাপে ভাগ করলে শেষ করা অনেক সহজ হয়।</p></div>
        </aside>
      </section>
      <footer className="app-footer">Made for your everyday progress <b>♥</b></footer>
    </main>
  </div>;
}

function GoogleIcon() {
  return <svg viewBox="0 0 48 48" width="19" height="19" aria-hidden="true"><path fill="#FFC107" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z"/><path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4 1.9-6.9 1.9-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44Z"/><path fill="#4A90E2" d="M12.6 27.5a12 12 0 0 1 0-7v-5.3H5.8a20 20 0 0 0 0 17.6l6.8-5.3Z"/><path fill="#EA4335" d="M24 12.1c3 0 5.7 1 7.8 3.1l5.9-5.9C34.1 6 29.5 4 24 4A20 20 0 0 0 5.8 15.2l6.8 5.3c1.6-4.8 6.1-8.4 11.4-8.4Z"/></svg>;
}