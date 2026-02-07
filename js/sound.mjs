const BGM_VOLUME = 0.34;
const RESULT_VOLUME = 0.84;
const DUCK_VOLUME = 0.14;

function toAssetUrl(fileName) {
    return new URL(`../assets/audio/${fileName}`, import.meta.url).href;
}

export class SoundController {
    constructor({ muted = false } = {}) {
        this.muted = Boolean(muted);
        this.unlocked = false;

        this.ctx = null;
        this.master = null;
        this.lastHoverAt = 0;

        this.backgroundTrack = this.createAudio('background.mp3', {
            loop: true,
            volume: BGM_VOLUME
        });

        this.winTrack = this.createAudio('win.mp3', {
            loop: false,
            volume: RESULT_VOLUME
        });

        this.lossTrack = this.createAudio('loss.mp3', {
            loop: false,
            volume: RESULT_VOLUME
        });

        this.bgmRestoreTimer = null;
        this.resultPlaybackId = 0;

        this.applyMutedState();
    }

    createAudio(fileName, { loop, volume }) {
        if (typeof window === 'undefined' || typeof Audio === 'undefined') return null;

        const audio = new Audio(toAssetUrl(fileName));
        audio.preload = 'auto';
        audio.loop = loop;
        audio.volume = volume;
        audio.playsInline = true;
        return audio;
    }

    async unlock() {
        this.unlocked = true;

        await this.ensureContext();
        if (this.ctx?.state === 'suspended') {
            await this.ctx.resume();
        }

        this.primeMedia();
        await this.startBackground();
    }

    primeMedia() {
        [this.backgroundTrack, this.winTrack, this.lossTrack].forEach((track) => {
            if (!track) return;
            try {
                track.load();
            } catch {
                // Ignore media loading failures.
            }
        });
    }

    async ensureContext() {
        if (this.ctx || typeof window === 'undefined') return;

        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;

        this.ctx = new AudioCtx();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 1;
        this.master.connect(this.ctx.destination);
    }

    setMuted(value) {
        this.muted = Boolean(value);
        this.applyMutedState();

        if (this.muted) {
            this.stopResultTracks();
            this.stopBackground();
            return;
        }

        if (this.unlocked) {
            this.startBackground().catch(() => undefined);
        }
    }

    toggleMuted() {
        this.setMuted(!this.muted);
        return this.muted;
    }

    applyMutedState() {
        if (this.master) {
            this.master.gain.value = this.muted ? 0 : 1;
        }

        [this.backgroundTrack, this.winTrack, this.lossTrack].forEach((track) => {
            if (!track) return;
            track.muted = this.muted;
        });
    }

    async startBackground() {
        if (this.muted || !this.unlocked || !this.backgroundTrack) return;
        if (!this.backgroundTrack.paused) return;

        this.backgroundTrack.volume = BGM_VOLUME;
        await this.safePlay(this.backgroundTrack, { restart: false });
    }

    stopBackground() {
        if (!this.backgroundTrack) return;
        this.backgroundTrack.pause();
    }

    stopResultTracks() {
        this.resultPlaybackId += 1;

        if (this.bgmRestoreTimer) {
            clearTimeout(this.bgmRestoreTimer);
            this.bgmRestoreTimer = null;
        }

        [this.winTrack, this.lossTrack].forEach((track) => {
            if (!track) return;
            track.pause();
            track.currentTime = 0;
        });

        this.restoreBackgroundVolume();
    }

    onRoundStart() {
        this.stopResultTracks();
        if (this.unlocked && !this.muted) {
            this.startBackground().catch(() => undefined);
        }
    }

    onRestart() {
        this.onRoundStart();
    }

    playHover() {
        const now = Date.now();
        if (now - this.lastHoverAt < 120) return;
        this.lastHoverAt = now;

        this.playTone(520, 0.12, { type: 'triangle', gain: 0.03 });
    }

    playClick() {
        this.playTone(330, 0.08, { type: 'triangle', gain: 0.045 });
        this.playTone(440, 0.1, { type: 'triangle', gain: 0.03, delay: 0.05 });
    }

    playRevealPulse() {
        this.playTone(300, 0.06, { type: 'sine', gain: 0.025 });
    }

    playResult(result) {
        this.stopResultTracks();

        if (result === 'win') {
            if (this.playResultTrack(this.winTrack)) return;
            this.playTone(392, 0.14, { gain: 0.05 });
            this.playTone(523.25, 0.22, { gain: 0.05, delay: 0.08 });
            this.playTone(659.25, 0.28, { gain: 0.045, delay: 0.16 });
            return;
        }

        if (result === 'lose') {
            if (this.playResultTrack(this.lossTrack)) return;
            this.playTone(280, 0.2, { type: 'sawtooth', gain: 0.035 });
            this.playTone(220, 0.24, { type: 'sawtooth', gain: 0.03, delay: 0.08 });
            return;
        }

        this.playTone(350, 0.12, { type: 'triangle', gain: 0.03 });
        this.playTone(370, 0.14, { type: 'triangle', gain: 0.03, delay: 0.09 });
    }

    playResultTrack(track) {
        if (this.muted || !this.unlocked || !track) return false;

        const playbackId = this.resultPlaybackId;
        this.duckBackground();

        this.safePlay(track, { restart: true }).then((started) => {
            if (!started) {
                this.restoreBackgroundVolume();
                return;
            }

            const expectedDurationMs = Number.isFinite(track.duration) && track.duration > 0
                ? Math.ceil(track.duration * 1000)
                : 2200;

            this.bgmRestoreTimer = setTimeout(() => {
                if (playbackId !== this.resultPlaybackId) return;
                this.restoreBackgroundVolume();
                this.bgmRestoreTimer = null;
            }, expectedDurationMs + 80);
        });

        return true;
    }

    duckBackground() {
        if (!this.backgroundTrack || this.backgroundTrack.paused) return;
        this.backgroundTrack.volume = DUCK_VOLUME;
    }

    restoreBackgroundVolume() {
        if (!this.backgroundTrack) return;
        this.backgroundTrack.volume = BGM_VOLUME;
    }

    async safePlay(track, { restart = false } = {}) {
        if (!track || this.muted) return false;

        try {
            if (restart) {
                track.currentTime = 0;
            }
            await track.play();
            return true;
        } catch {
            return false;
        }
    }

    playTone(frequency, duration, { type = 'sine', gain = 0.04, delay = 0 } = {}) {
        if (this.muted || !this.ctx || !this.master) return;

        const now = this.ctx.currentTime + delay;
        const oscillator = this.ctx.createOscillator();
        const envelope = this.ctx.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, now);

        envelope.gain.setValueAtTime(0, now);
        envelope.gain.linearRampToValueAtTime(gain, now + 0.02);
        envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        oscillator.connect(envelope);
        envelope.connect(this.master);

        oscillator.start(now);
        oscillator.stop(now + duration + 0.03);
    }
}
