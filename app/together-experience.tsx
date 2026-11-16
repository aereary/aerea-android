"use client";
import { useEffect, useRef, useState } from 'react';
import { togetherDocument } from './together-document';
import { TogetherIds, togetherState, togetherChanges, type TogetherRow } from './together-model';
import { prepareTogetherReader } from './together-reader';
import { useBackLayer } from './use-back-layer';
export function TogetherExperience({ data, onPatch, onCommand }: {
    data: TogetherRow;
    onPatch: (patch: TogetherRow) => void;
    onCommand: (action: string, value: TogetherRow, ids: TogetherIds) => void | Promise<void>;
}) {
    const readerKey = data.reader ? data.reader.file.id + ':' + data.reader.kind : '', readerOpen = !!data.reader, image = data.image;
    const frame = useRef<HTMLIFrameElement>(null), ids = useRef(new TogetherIds()), latest = useRef({ data, onPatch, onCommand });
    const [ready, setReady] = useState(false);
    const [revision, setRevision] = useState(0);
    const lastPayload = useRef('');
    const pdf = useRef<import('pdfjs-dist').PDFDocumentProxy | null>(null);
    const pdfDestroy = useRef<(() => Promise<void>) | null>(null);
    const imageUrls = useRef<string[]>([]);
    const imagePages = useRef(new Set<number>());
    useEffect(() => { latest.current = { data, onPatch, onCommand }; }, [data, onPatch, onCommand]);
    useBackLayer(!data.privateGate, () => frame.current?.contentWindow?.postMessage({ type: 'together-back' }, '*'), 110);
    useEffect(() => { const handler = async (e: MessageEvent) => { if (e.source !== frame.current?.contentWindow)
        return; const message = e.data, p = latest.current; if (message?.type === 'together-ready')
        setReady(true); if (message?.type === 'together-command' && typeof message.action === 'string') {
        try {
            if (message.action === 'pdf-image' && pdf.current) {
                if (!Number.isInteger(message.page) || message.page < 1 || message.page > pdf.current.numPages || imagePages.current.has(message.page))
                    return;
                imagePages.current.add(message.page);
                const page = await pdf.current.getPage(message.page), base = page.getViewport({ scale: 1 }), viewport = page.getViewport({ scale: Math.min(1.5, 1200 / base.width) }), canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const context = canvas.getContext('2d');
                if (!context)
                    return;
                await page.render({ canvas, canvasContext: context, viewport }).promise;
                const blob = await new Promise<Blob | null>(r => canvas.toBlob(r));
                canvas.width = canvas.height = 1;
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    imageUrls.current.push(url);
                    frame.current?.contentWindow?.postMessage({ type: 'together-pdf-image', page: message.page, url }, '*');
                }
                return;
            }
            await p.onCommand(message.action, message, ids.current);
        }
        catch (error) {
            frame.current?.contentWindow?.postMessage({ type: 'together-error', message: error instanceof Error ? error.message : 'This action could not be completed.' }, '*');
        }
    } if (message?.type === 'together-change' && message.state && typeof message.action === 'string') {
        try {
            const patch = togetherChanges(p.data, ids.current, message.action, message.state);
            if (Object.keys(patch).length)
                p.onPatch(patch);
            if (['accent', 'dayTag', 'form:postit', 'course', 'archiveInbox'].includes(message.action))
                await p.onCommand(message.action, message, ids.current);
        }
        catch (error) {
            frame.current?.contentWindow?.postMessage({ type: 'together-error', message: error instanceof Error ? error.message : 'This change could not be saved.' }, '*');
        }
    } }; window.addEventListener('message', handler); return () => window.removeEventListener('message', handler); }, []);
    useEffect(() => { if (!data.privateUnlocked)
        return; const timer = setInterval(() => setRevision(n => n + 1), 2000); return () => clearInterval(timer); }, [data.privateUnlocked]);
    useEffect(() => { if (!ready)
        return; const state = { ...togetherState(data, ids.current), privateUnlocked: data.privateUnlocked }; const fingerprint = JSON.stringify({ ...state, recordingSeconds: 0 }); if (fingerprint === lastPayload.current) {
        frame.current?.contentWindow?.postMessage({ type: 'together-recording-tick', seconds: state.recordingSeconds }, '*');
        return;
    } lastPayload.current = fingerprint; frame.current?.contentWindow?.postMessage({ type: 'together-state', state }, '*'); }, [data, ready, revision]);
    useEffect(() => { if (ready && !readerOpen)
        frame.current?.contentWindow?.postMessage({ type: 'together-reader-reset' }, '*'); }, [ready, readerOpen]);
    const imageKey = image?.id + ':' + image?.url;
    useEffect(() => { const image = latest.current.data.image; if (ready && image?.url)
        frame.current?.contentWindow?.postMessage({ type: 'together-image', ...image }, '*'); }, [ready, imageKey]);
    useEffect(() => { const reader = latest.current.data.reader; if (!ready || !reader)
        return; let cancelled = false; const pages = imagePages.current; void prepareTogetherReader(reader, (document, destroy) => { if (cancelled)
        void destroy();
    else {
        pdf.current = document;
        pdfDestroy.current = destroy;
    } }).then(payload => { if (!cancelled && payload)
        frame.current?.contentWindow?.postMessage(payload, '*'); }).catch(error => { if (!cancelled)
        frame.current?.contentWindow?.postMessage({ type: 'together-error', message: error instanceof Error ? error.message : 'The reader could not open this file.' }, '*'); }); return () => { cancelled = true; void pdfDestroy.current?.(); pdfDestroy.current = null; pdf.current = null; pages.clear(); imageUrls.current.forEach(url => URL.revokeObjectURL(url)); imageUrls.current = []; }; }, [ready, readerKey]);
    return <div style={{ position: 'fixed', inset: 0, zIndex: 19000, background: data.colorMode === 'light' ? '#f8f6f1' : '#181719' }}><iframe ref={frame} srcDoc={togetherDocument} title="aérea Together" style={{ position: 'absolute', left: 0, right: 0, top: 'var(--aerea-safe-area-top, env(safe-area-inset-top, 0px))', bottom: 'var(--aerea-safe-area-bottom, env(safe-area-inset-bottom, 0px))', width: '100%', height: 'calc(100dvh - var(--aerea-safe-area-top, env(safe-area-inset-top, 0px)) - var(--aerea-safe-area-bottom, env(safe-area-inset-bottom, 0px)))', border: 0, background: 'transparent' }}/></div>;
}
