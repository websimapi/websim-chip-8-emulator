import { Renderer } from './renderer.js';
import { Keyboard } from './keyboard.js';
import { Speaker } from './speaker.js';
import { CPU } from './cpu.js';
import { ROMS } from './roms.js';

const renderer = new Renderer(10);
const keyboard = new Keyboard();
const speaker = new Speaker();
const cpu = new CPU(renderer, keyboard, speaker);

let animationId;
let lastTime = 0;
let fpsInterval = 1000 / 60; // 60 Hz for timers

function step(currentTime) {
    animationId = requestAnimationFrame(step);

    const elapsed = currentTime - lastTime;

    if (elapsed > fpsInterval) {
        lastTime = currentTime - (elapsed % fpsInterval);
        cpu.cycle();
    }
}

// UI Controls
const romSelect = document.getElementById('romSelect');
const fileInput = document.getElementById('fileInput');
const resetBtn = document.getElementById('resetBtn');
const speedRange = document.getElementById('speedRange');
const soundToggle = document.getElementById('soundToggle');
const led = document.getElementById('led');

function loadROM(romName) {
    if (ROMS[romName]) {
        cpu.loadProgram(ROMS[romName]);
        led.className = 'led-on'; // Visual indicator
        setTimeout(() => led.className = 'led-off', 100);
    }
}

// Event Listeners
romSelect.addEventListener('change', (e) => {
    loadROM(e.target.value);
    fileInput.value = ''; // Reset file input
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const arrayBuffer = event.target.result;
            const program = new Uint8Array(arrayBuffer);
            cpu.loadProgram(program);
            romSelect.value = ''; // Deselect built-in
        };
        reader.readAsArrayBuffer(file);
    }
});

resetBtn.addEventListener('click', () => {
    if (romSelect.value && ROMS[romSelect.value]) {
        loadROM(romSelect.value);
    } else if (fileInput.files.length > 0) {
        // Reload uploaded file
        const event = new Event('change');
        fileInput.dispatchEvent(event);
    } else {
        // Default to Pong if nothing selected
        romSelect.value = 'pong';
        loadROM('pong');
    }
});

speedRange.addEventListener('input', (e) => {
    cpu.speed = parseInt(e.target.value);
});

soundToggle.addEventListener('click', () => {
    const isMuted = speaker.toggleMute();
    soundToggle.textContent = `Sound: ${isMuted ? 'OFF' : 'ON'}`;
});

// Initialize
loadROM('pong');
cpu.speed = 10;
speedRange.value = 10;
animationId = requestAnimationFrame(step);