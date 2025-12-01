export class Keyboard {
    constructor() {
        this.keysPressed = {};
        
        // CHIP-8 Keypad:
        // 1 2 3 C
        // 4 5 6 D
        // 7 8 9 E
        // A 0 B F
        
        // Keyboard mapping (Standard):
        // 1 2 3 4
        // Q W E R
        // A S D F
        // Z X C V
        
        this.keyMap = {
            49: 0x1, // 1
            50: 0x2, // 2
            51: 0x3, // 3
            52: 0xC, // 4 -> C
            81: 0x4, // Q -> 4
            87: 0x5, // W -> 5
            69: 0x6, // E -> 6
            82: 0xD, // R -> D
            65: 0x7, // A -> 7
            83: 0x8, // S -> 8
            68: 0x9, // D -> 9
            70: 0xE, // F -> E
            90: 0xA, // Z -> A
            88: 0x0, // X -> 0
            67: 0xB, // C -> B
            86: 0xF  // V -> F
        };

        this.onNextKeyPress = null;
        
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));
        
        // Touch UI binding
        this.bindTouchControls();
    }

    isKeyPressed(keyCode) {
        return this.keysPressed[keyCode];
    }

    onKeyDown(event) {
        const key = this.keyMap[event.keyCode];
        if (key !== undefined) {
            this.keysPressed[key] = true;
            
            // Highlight UI button
            const btn = document.querySelector(`button[data-key="${key.toString(16).toUpperCase()}"]`);
            if (btn) btn.classList.add('active');

            if (this.onNextKeyPress !== null && key !== undefined) {
                this.onNextKeyPress(key);
                this.onNextKeyPress = null;
            }
        }
    }

    onKeyUp(event) {
        const key = this.keyMap[event.keyCode];
        if (key !== undefined) {
            this.keysPressed[key] = false;
            
            const btn = document.querySelector(`button[data-key="${key.toString(16).toUpperCase()}"]`);
            if (btn) btn.classList.remove('active');
        }
    }
    
    bindTouchControls() {
        const buttons = document.querySelectorAll('.keypad button');
        buttons.forEach(btn => {
            const keyChar = btn.getAttribute('data-key');
            const keyVal = parseInt(keyChar, 16);
            
            const pressStart = (e) => {
                e.preventDefault();
                this.keysPressed[keyVal] = true;
                btn.classList.add('active');
                if (this.onNextKeyPress !== null) {
                    this.onNextKeyPress(keyVal);
                    this.onNextKeyPress = null;
                }
            };
            
            const pressEnd = (e) => {
                e.preventDefault();
                this.keysPressed[keyVal] = false;
                btn.classList.remove('active');
            };

            btn.addEventListener('mousedown', pressStart);
            btn.addEventListener('mouseup', pressEnd);
            btn.addEventListener('touchstart', pressStart);
            btn.addEventListener('touchend', pressEnd);
            // Handle touch drag off
            btn.addEventListener('touchcancel', pressEnd);
        });
    }
}