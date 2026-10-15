/**
 * Browser Web Speech API (SpeechSynthesis) wrapper for accessible Text-to-Speech
 */

class SpeechService {
  constructor() {
    this.synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
    this.currentUtterance = null;
    this.state = 'idle'; // 'idle' | 'playing' | 'paused'
    this.listeners = new Set();
  }

  isSupported() {
    return !!this.synth;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  _notify(state, charIndex = 0) {
    this.state = state;
    this.listeners.forEach((l) => l({ state: this.state, charIndex }));
  }

  getVoices() {
    if (!this.isSupported()) return [];
    return this.synth.getVoices();
  }

  speak(text, options = {}) {
    if (!this.isSupported()) {
      console.warn('SpeechSynthesis is not supported in this browser.');
      return;
    }

    // Cancel any ongoing speech
    this.cancel();

    if (!text || !text.trim()) return;

    // Remove markdown symbols and extra spacing for cleaner speech
    const cleanText = text
      .replace(/[#*_`~[\]()]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);

    utterance.rate = options.rate || 1.0;
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = options.volume !== undefined ? options.volume : 1.0;

    if (options.voice) {
      utterance.voice = options.voice;
    }

    utterance.onstart = () => {
      this._notify('playing', 0);
      if (options.onStart) options.onStart();
    };

    utterance.onend = () => {
      this._notify('idle', cleanText.length);
      this.currentUtterance = null;
      if (options.onEnd) options.onEnd();
    };

    utterance.onerror = (event) => {
      if (event.error !== 'interrupted' && event.error !== 'canceled') {
        console.error('SpeechSynthesis error:', event);
      }
      this._notify('idle', 0);
      this.currentUtterance = null;
      if (options.onError) options.onError(event);
    };

    utterance.onpause = () => {
      this._notify('paused');
      if (options.onPause) options.onPause();
    };

    utterance.onresume = () => {
      this._notify('playing');
      if (options.onResume) options.onResume();
    };

    utterance.onboundary = (event) => {
      if (event.name === 'word' || event.name === 'sentence') {
        this._notify(this.state, event.charIndex);
        if (options.onBoundary) options.onBoundary(event);
      }
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  pause() {
    if (this.isSupported() && this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
      this._notify('paused');
    }
  }

  resume() {
    if (this.isSupported() && this.synth.paused) {
      this.synth.resume();
      this._notify('playing');
    }
  }

  cancel() {
    if (this.isSupported()) {
      this.synth.cancel();
      this.currentUtterance = null;
      this._notify('idle', 0);
    }
  }

  getState() {
    return this.state;
  }
}

export const speechService = new SpeechService();
