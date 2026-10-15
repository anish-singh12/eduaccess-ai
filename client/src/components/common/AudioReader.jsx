import React, { useState, useEffect } from 'react';
import { Volume2, Play, Pause, Square } from 'lucide-react';
import { speechService } from '../../services/speechService';

export default function AudioReader({ text, label = 'Read Aloud' }) {
  const [status, setStatus] = useState('idle'); // 'idle' | 'playing' | 'paused'
  const [rate, setRate] = useState(1.0);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(speechService.isSupported());

    const unsubscribe = speechService.subscribe(({ state }) => {
      setStatus(state);
    });

    return () => {
      unsubscribe();
      speechService.cancel();
    };
  }, []);

  useEffect(() => {
    speechService.cancel();
    setStatus('idle');
  }, [text]);

  if (!isSupported || !text) {
    return null;
  }

  const handlePlay = () => {
    if (status === 'paused') {
      speechService.resume();
    } else {
      speechService.speak(text, {
        rate,
        onEnd: () => setStatus('idle'),
        onError: () => setStatus('idle')
      });
    }
  };

  const handlePause = () => {
    speechService.pause();
  };

  const handleStop = () => {
    speechService.cancel();
  };

  const handleSpeedChange = (newRate) => {
    setRate(newRate);
    if (status === 'playing') {
      // Restart with new rate
      speechService.speak(text, {
        rate: newRate,
        onEnd: () => setStatus('idle'),
        onError: () => setStatus('idle')
      });
    }
  };

  return (
    <div
      aria-label="Audio Reader Controls"
      className="inline-flex items-center gap-1.5 p-1.5 bg-brand-50/80 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 rounded-xl text-xs"
    >
      <span className="font-semibold text-brand-800 dark:text-brand-300 px-1.5 flex items-center gap-1.5">
        <Volume2 className="w-3.5 h-3.5 text-brand-700 dark:text-brand-300" aria-hidden="true" />
        <span>{label}</span>
      </span>

      {status === 'idle' ? (
        <button
          onClick={handlePlay}
          type="button"
          aria-label="Play text-to-speech audio"
          className="px-2.5 py-1 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg shadow-sm transition-all flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <Play className="w-3 h-3 fill-current" aria-hidden="true" /> Play
        </button>
      ) : status === 'playing' ? (
        <>
          <button
            onClick={handlePause}
            type="button"
            aria-label="Pause audio playback"
            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg shadow-sm transition-all flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <Pause className="w-3 h-3 fill-current" aria-hidden="true" /> Pause
          </button>
          <button
            onClick={handleStop}
            type="button"
            aria-label="Stop audio playback"
            className="px-2 py-1 bg-charcoal-200 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-200 hover:bg-rose-600 hover:text-white font-medium rounded-lg transition-all focus-visible:ring-2"
          >
            <Square className="w-3 h-3 fill-current" aria-hidden="true" />
          </button>
          <div className="flex items-center gap-0.5 px-1">
            <span className="w-1.5 h-3 bg-brand-600 rounded-full animate-pulse" />
            <span className="w-1.5 h-4 bg-brand-500 rounded-full animate-pulse delay-75" />
            <span className="w-1.5 h-2 bg-brand-400 rounded-full animate-pulse delay-150" />
          </div>
        </>
      ) : (
        <>
          <button
            onClick={handlePlay}
            type="button"
            aria-label="Resume audio playback"
            className="px-2.5 py-1 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg shadow-sm transition-all flex items-center gap-1.5"
          >
            <Play className="w-3 h-3 fill-current" aria-hidden="true" /> Resume
          </button>
          <button
            onClick={handleStop}
            type="button"
            aria-label="Stop audio playback"
            className="px-2 py-1 bg-charcoal-200 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-200 hover:bg-rose-600 hover:text-white font-medium rounded-lg transition-all"
          >
            <Square className="w-3 h-3 fill-current" aria-hidden="true" />
          </button>
        </>
      )}

      {/* Speed Selector */}
      <select
        value={rate}
        onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
        aria-label="Playback speed"
        className="px-1.5 py-1 bg-white dark:bg-charcoal-900 border border-brand-200 dark:border-brand-800 rounded-lg text-[11px] font-medium text-charcoal-700 dark:text-charcoal-300 focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        <option value={0.75}>0.75x</option>
        <option value={1.0}>1.0x</option>
        <option value={1.25}>1.25x</option>
        <option value={1.5}>1.5x</option>
      </select>
    </div>
  );
}
