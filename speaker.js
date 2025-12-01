export class Speaker {
    constructor() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        this.gain = this.ctx.createGain();
        this.gain.connect(this.ctx.destination);
        this.oscillator = null;
        this.muted = false;
    }

    play(frequency = 440) {
        if (this.muted) return;
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        if (this.oscillator) return; // Already playing

        this.oscillator = this.ctx.createOscillator();
        this.oscillator.type = 'square';
        this.oscillator.frequency.setValueAtTime(frequency, this.ctx.currentTime);
        this.oscillator.connect(this.gain);
        this.oscillator.start();
        this.gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    }

    stop() {
        if (this.oscillator) {
            this.oscillator.stop();
            this.oscillator.disconnect();
            this.oscillator = null;
        }
    }
    
    toggleMute() {
        this.muted = !this.muted;
        this.stop();
        return this.muted;
    }
}