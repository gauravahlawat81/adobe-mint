/**
 * ScanningService — global singleton that manages the async AI scan lifecycle.
 *
 * Survives:
 *   - Tab switches within the app (singleton lives outside any component)
 *   - App going to background (React Native JS thread keeps running)
 *   - Component unmounts/remounts (subscribers re-attach on mount)
 *
 * Usage:
 *   scanningService.start(photos)          // fire-and-forget
 *   scanningService.on('photo_found', cb)  // stream results live
 *   scanningService.getState()             // get current snapshot
 *   scanningService.reset()               // start fresh
 */

import { AppState, AppStateStatus } from 'react-native';
import type { Photo, TaggedPhoto } from '../types';
import { scanCameraRoll } from '../utils/aiTagging';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ScanStatus = 'idle' | 'running' | 'complete';

export interface ScanProgress {
  scanned: number;
  total:   number;
  found:   number;
  errors:  number;
}

export interface ScanState {
  status:   ScanStatus;
  cards:    TaggedPhoto[];
  progress: ScanProgress;
}

type ScanEvent = 'photo_found' | 'progress' | 'complete' | 'reset';
type Listener<T = any> = (data: T) => void;

// ─── Service ─────────────────────────────────────────────────────────────────

class ScanningService {
  private _state: ScanState = {
    status:   'idle',
    cards:    [],
    progress: { scanned: 0, total: 0, found: 0, errors: 0 },
  };

  // Each new scan gets a unique ID — stale callbacks from old scans are ignored
  private _scanId = 0;

  private _listeners = new Map<ScanEvent, Set<Listener>>();

  constructor() {
    // Log AppState transitions for debugging; actual scanning keeps running regardless
    AppState.addEventListener('change', (state: AppStateStatus) => {
      if (__DEV__) {
        console.log(`[ScanningService] AppState → ${state}, scan: ${this._state.status}`);
      }
    });
  }

  // ── Pub/Sub ───────────────────────────────────────────────────────────────

  on<T = any>(event: ScanEvent, listener: Listener<T>): () => void {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event)!.add(listener);
    // Return unsubscribe function so callers can clean up in useEffect
    return () => this.off(event, listener);
  }

  off(event: ScanEvent, listener: Listener): void {
    this._listeners.get(event)?.delete(listener);
  }

  private _emit(event: ScanEvent, data?: any): void {
    this._listeners.get(event)?.forEach(l => {
      try { l(data); } catch (e) { console.warn('[ScanningService] listener error:', e); }
    });
  }

  // ── Public API ────────────────────────────────────────────────────────────

  getState(): ScanState {
    return {
      ...this._state,
      cards: [...this._state.cards],       // shallow copy so callers can't mutate
      progress: { ...this._state.progress },
    };
  }

  /**
   * Start scanning. Fire-and-forget — returns immediately.
   * If a scan is already running, does nothing (idempotent).
   */
  start(photos: Photo[], knownHashes: Set<string> = new Set()): void {
    if (this._state.status === 'running') return;

    this._scanId++;
    const thisScanId = this._scanId;

    this._state = {
      status:   'running',
      cards:    [],
      progress: { scanned: 0, total: photos.length, found: 0, errors: 0 },
    };

    // Run entirely async — no await here, intentional
    scanCameraRoll(
      photos,

      // onProgress — called after each photo attempt
      (scanned, total, found, errors) => {
        if (this._scanId !== thisScanId) return; // stale scan, ignore
        this._state.progress = { scanned, total, found, errors };
        this._emit('progress', { ...this._state.progress });
      },

      // onPhotoFound — called immediately when a worthy photo is discovered
      (photo: TaggedPhoto) => {
        if (this._scanId !== thisScanId) return; // stale scan, ignore
        this._state.cards.push(photo);
        this._emit('photo_found', photo);
      },

      knownHashes,

    ).then(() => {
      if (this._scanId !== thisScanId) return;
      this._state.status = 'complete';
      this._emit('complete', { ...this._state.progress });

    }).catch(err => {
      if (this._scanId !== thisScanId) return;
      console.error('[ScanningService] fatal scan error:', err);
      this._state.status = 'complete';
      this._emit('complete', { ...this._state.progress });
    });
  }

  /**
   * Replace a card in place after the user edits its metadata.
   * Matched by photo.id so it survives tab switches / restores.
   */
  updateCard(updated: TaggedPhoto): void {
    const i = this._state.cards.findIndex(c => c.photo.id === updated.photo.id);
    if (i !== -1) this._state.cards[i] = updated;
  }

  /**
   * Reset to idle and clear all found photos.
   * Safe to call even while scanning — the running scan's callbacks will be ignored.
   */
  reset(): void {
    this._scanId++; // invalidates any running scan
    this._state = {
      status:   'idle',
      cards:    [],
      progress: { scanned: 0, total: 0, found: 0, errors: 0 },
    };
    this._emit('reset');
  }
}

// ─── Singleton export ─────────────────────────────────────────────────────────

export const scanningService = new ScanningService();
