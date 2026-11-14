"use client";
import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import type { StudyFileItem } from './study-library';
import { useBackLayer } from './use-back-layer';
import { readPin, checkPin, changePin } from './private-shelf-pin';
const ShelfContext = createContext({ files: [] as StudyFileItem[], openFile: (_file: StudyFileItem) => { }, settings: () => { }, setFiltered: (_value: boolean) => { }, filtered: false });
export const usePrivateShelf = () => useContext(ShelfContext);
export function PrivateShelf({ children, files, openFile, onBack, onLock, onUnlock, onPinChange }: {
    children: ReactNode;
    files: StudyFileItem[];
    openFile: (file: StudyFileItem) => void;
    onBack: () => void;
    onLock: () => void;
    onUnlock: () => void;
    onPinChange: () => void;
}) {
    const [initial] = useState(() => { try {
        const configured = !!readPin();
        return { configured, locked: configured, theme: localStorage.getItem('aerea-private-shelf-theme') || 'App theme', error: '' };
    }
    catch {
        return { configured: true, locked: true, theme: 'App theme', error: 'PIN settings cannot be read. Your files have not been changed.' };
    } });
    const [locked, setLocked] = useState(initial.locked), [configured, setConfigured] = useState(initial.configured);
    const ready = true;
    const [settings, setSettings] = useState(false), [pin, setPin] = useState(''), [next, setNext] = useState(''), [confirm, setConfirm] = useState('');
    const [message, setMessage] = useState(initial.error), [busy, setBusy] = useState(false), [filtered, setFiltered] = useState(false);
    const [theme, setTheme] = useState(initial.theme);
    const lockEpoch = useRef(0);
    useEffect(() => () => { lockEpoch.current++; }, []);
    useEffect(() => { if (!locked)
        onUnlock(); }, [locked, onUnlock]);
    useBackLayer(settings, () => { if (!busy) {
        setSettings(false);
        setPin('');
        setNext('');
        setConfirm('');
    } }, 100);
    useEffect(() => { const lock = () => { if (document.visibilityState === 'hidden' && configured) {
        lockEpoch.current++;
        setLocked(true);
        setSettings(false);
        setPin('');
        setNext('');
        setConfirm('');
        onLock();
    } }; document.addEventListener('visibilitychange', lock); return () => document.removeEventListener('visibilitychange', lock); }, [configured, onLock]);
    async function unlock() { const epoch = lockEpoch.current; setBusy(true); try {
        const valid = await checkPin(pin);
        if (epoch !== lockEpoch.current)
            return;
        if (valid) {
            setLocked(false);
            setPin('');
            setMessage('');
        }
        else
            setMessage('Incorrect PIN.');
    }
    catch (e) {
        setMessage(e instanceof Error ? e.message : 'Could not unlock.');
    }
    finally {
        setBusy(false);
    } }
    async function update(remove = false) { setBusy(true); try {
        if (!remove && next !== confirm)
            throw new Error('PINs do not match.');
        await changePin(pin, remove ? '' : next);
        setConfigured(!remove);
        onPinChange();
        setPin('');
        setNext('');
        setConfirm('');
        setMessage(remove ? 'PIN removed.' : 'PIN saved on this device.');
    }
    catch (e) {
        setMessage(e instanceof Error ? e.message : 'Could not save PIN.');
    }
    finally {
        setBusy(false);
    } }
    return <div className="private-shelf" data-shelf-theme={theme}>
    <style>{`body:has(.private-shelf) .epub-study-reader{z-index:21500}.shelf-gate{position:fixed;inset:0;z-index:22000;background:var(--one-bg,var(--paper,#18171c));color:var(--one-ink,var(--ink,#ddd));display:grid;place-items:center;padding:24px}.shelf-panel{width:min(420px,100%);padding:24px;border-radius:24px;background:var(--one-panel,var(--paper,#26232b));max-height:85dvh;overflow:auto}.shelf-panel label{display:grid;gap:8px;margin:16px 0}.shelf-panel input,.shelf-panel select,.shelf-panel button{font:inherit;color:inherit;background:transparent;border:1px solid #8887;border-radius:12px;padding:12px;max-width:100%}.shelf-panel input{width:100%}.shelf-panel button{margin:4px}.shelf-panel p{line-height:1.5}.shelf-panel small{display:block;opacity:.75}.private-shelf[data-shelf-theme="Midnight Rose"] .ao3-library-layer{--ao3-plum:#d493b1;--ao3-ink:#e5d6df;--ao3-paper:#221e24;--ao3-muted:#b7a8b3;background:#17151a}.private-shelf[data-shelf-theme="Sea Glass"] .ao3-library-layer{--ao3-plum:#81b7ad;--ao3-ink:#d8e7e4;--ao3-paper:#1c2827;--ao3-muted:#abc0bc;background:#14201f}`}</style>
    {theme !== 'App theme' && <style>{`
.private-shelf[data-shelf-theme] .ao3-library{--ao3-ink:#e7e1e8;--ao3-plum:${theme === 'Sea Glass' ? '#9dcac0' : '#e1a7bf'};--ao3-plum-dark:#29242d;--ao3-cream:#242127;--ao3-muted:#bab1bf;--ao3-border:#504752}
.private-shelf[data-shelf-theme] .ao3-library-layer,.private-shelf[data-shelf-theme] .ao3-library-tools,.private-shelf[data-shelf-theme] .ao3-screen-header{background:${theme === 'Sea Glass' ? '#162322' : '#1a171e'}!important;color:#e7e1e8!important}
.private-shelf[data-shelf-theme] .ao3-card,.private-shelf[data-shelf-theme] .ao3-card-header,.private-shelf[data-shelf-theme] .ao3-card-meta,.private-shelf[data-shelf-theme] .ao3-series-parts,.private-shelf[data-shelf-theme] .ao3-part{background:${theme === 'Sea Glass' ? '#22312e' : '#28222c'}!important;color:#e7e1e8!important}
.private-shelf[data-shelf-theme] .ao3-copy-title{color:${theme === 'Sea Glass' ? '#9dcac0' : '#e1a7bf'}!important}
`}</style>}
    {ready && !locked && <ShelfContext.Provider value={{ files, openFile, settings: () => { setMessage(''); setSettings(true); }, filtered, setFiltered }}><div inert={settings || undefined}>{children}</div></ShelfContext.Provider>}
    {(!ready || locked) && <div className="shelf-gate" role="dialog" aria-modal="true" aria-label="Unlock private library"><form className="shelf-panel" onSubmit={e => { e.preventDefault(); void unlock(); }}><button type="button" onClick={onBack}>← Library</button><h2>Private library</h2><label>PIN<input type="password" inputMode="numeric" autoComplete="off" value={pin} onChange={e => setPin(e.target.value)}/></label><p role="status">{message}</p><button disabled={!ready || busy}>{busy ? 'Unlocking…' : 'Unlock'}</button></form></div>}
    {settings && !locked && <div className="shelf-gate" role="dialog" aria-modal="true" aria-label="Library settings"><form className="shelf-panel" onSubmit={e => { e.preventDefault(); void update(); }}><h2>Library settings</h2><label>Theme<select value={theme} onChange={e => { try {
        localStorage.setItem('aerea-private-shelf-theme', e.target.value);
        setTheme(e.target.value);
    }
    catch {
        setMessage('Could not save theme.');
    } }}>{['App theme', 'Midnight Rose', 'Sea Glass'].map(t => <option key={t}>{t}</option>)}</select></label>{configured && <label>Current PIN<input type="password" inputMode="numeric" value={pin} onChange={e => setPin(e.target.value)}/></label>}<label>New PIN<input type="password" inputMode="numeric" pattern="[0-9]{4,}" minLength={4} required value={next} onChange={e => setNext(e.target.value)}/></label><label>Confirm PIN<input type="password" inputMode="numeric" required value={confirm} onChange={e => setConfirm(e.target.value)}/></label><small>At least 4 digits. Locks library access on this device. Keep your PIN somewhere safe.</small><p role="status">{message}</p><button disabled={busy}>Save PIN</button>{configured && <button type="button" disabled={busy} onClick={() => void update(true)}>Remove PIN</button>}<button type="button" disabled={busy} onClick={() => { setSettings(false); setPin(''); setNext(''); setConfirm(''); }}>Done</button></form></div>}
  </div>;
}
export function ShelfCatalogExtras({ children }: {
    children: ReactNode;
}) { return usePrivateShelf().filtered ? null : children; }
