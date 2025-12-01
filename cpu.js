export class CPU {
    constructor(renderer, keyboard, speaker) {
        this.renderer = renderer;
        this.keyboard = keyboard;
        this.speaker = speaker;

        // 4KB Memory
        this.memory = new Uint8Array(4096);

        // 16 8-bit registers V0-VF
        this.v = new Uint8Array(16);

        // Memory Address Register (16-bit, but only 12 used)
        this.i = 0;

        // Timers
        this.delayTimer = 0;
        this.soundTimer = 0;

        // Program Counter
        this.pc = 0x200; // Start at 512

        // Stack (16 levels)
        this.stack = new Array(16).fill(0);
        this.stackPointer = 0;

        this.paused = false;
        this.speed = 10;
    }

    loadSpritesIntoMemory() {
        // Hex sprites 0-F (5 bytes each)
        const sprites = [
            0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
            0x20, 0x60, 0x20, 0x20, 0x70, // 1
            0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
            0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
            0x90, 0x90, 0xF0, 0x10, 0x10, // 4
            0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
            0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
            0xF0, 0x10, 0x20, 0x40, 0x40, // 7
            0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
            0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
            0xF0, 0x90, 0xF0, 0x90, 0x90, // A
            0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
            0xF0, 0x80, 0x80, 0x80, 0xF0, // C
            0xE0, 0x90, 0x90, 0x90, 0xE0, // D
            0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
            0xF0, 0x80, 0xF0, 0x80, 0x80  // F
        ];
        
        // Load into memory starting at 0x000
        for (let i = 0; i < sprites.length; i++) {
            this.memory[i] = sprites[i];
        }
    }

    loadProgram(program) {
        // Clear memory first
        this.memory = new Uint8Array(4096);
        this.v = new Uint8Array(16);
        this.i = 0;
        this.stack = new Array(16).fill(0);
        this.stackPointer = 0;
        this.pc = 0x200;
        this.delayTimer = 0;
        this.soundTimer = 0;
        
        // Reload sprites
        this.loadSpritesIntoMemory();

        // Load ROM
        for (let i = 0; i < program.length; i++) {
            this.memory[0x200 + i] = program[i];
        }
    }

    cycle() {
        for (let i = 0; i < this.speed; i++) {
            if (!this.paused) {
                // Fetch
                let opcode = (this.memory[this.pc] << 8) | this.memory[this.pc + 1];
                this.execute(opcode);
            }
        }

        if (!this.paused) {
            this.updateTimers();
        }

        this.renderer.render();
    }

    updateTimers() {
        if (this.delayTimer > 0) {
            this.delayTimer -= 1;
        }

        if (this.soundTimer > 0) {
            this.soundTimer -= 1;
            this.speaker.play(440);
        } else {
            this.speaker.stop();
        }
    }

    execute(opcode) {
        this.pc += 2; // Increment PC before execution usually, or adjust in jumps

        let x = (opcode & 0x0F00) >> 8;
        let y = (opcode & 0x00F0) >> 4;

        switch (opcode & 0xF000) {
            case 0x0000:
                switch (opcode) {
                    case 0x00E0: // CLS
                        this.renderer.clear();
                        break;
                    case 0x00EE: // RET
                        this.pc = this.stack[--this.stackPointer];
                        break;
                }
                break;

            case 0x1000: // JP addr
                this.pc = (opcode & 0x0FFF);
                break;

            case 0x2000: // CALL addr
                this.stack[this.stackPointer++] = this.pc;
                this.pc = (opcode & 0x0FFF);
                break;

            case 0x3000: // SE Vx, byte
                if (this.v[x] === (opcode & 0x00FF)) {
                    this.pc += 2;
                }
                break;

            case 0x4000: // SNE Vx, byte
                if (this.v[x] !== (opcode & 0x00FF)) {
                    this.pc += 2;
                }
                break;

            case 0x5000: // SE Vx, Vy
                if (this.v[x] === this.v[y]) {
                    this.pc += 2;
                }
                break;

            case 0x6000: // LD Vx, byte
                this.v[x] = (opcode & 0x00FF);
                break;

            case 0x7000: // ADD Vx, byte
                this.v[x] += (opcode & 0x00FF);
                break;

            case 0x8000:
                switch (opcode & 0xF) {
                    case 0x0: // LD Vx, Vy
                        this.v[x] = this.v[y];
                        break;
                    case 0x1: // OR Vx, Vy
                        this.v[x] |= this.v[y];
                        break;
                    case 0x2: // AND Vx, Vy
                        this.v[x] &= this.v[y];
                        break;
                    case 0x3: // XOR Vx, Vy
                        this.v[x] ^= this.v[y];
                        break;
                    case 0x4: // ADD Vx, Vy (Carry)
                        let sum = this.v[x] + this.v[y];
                        this.v[0xF] = sum > 0xFF ? 1 : 0;
                        this.v[x] = sum;
                        break;
                    case 0x5: // SUB Vx, Vy (Borrow)
                        this.v[0xF] = this.v[x] > this.v[y] ? 1 : 0;
                        this.v[x] -= this.v[y];
                        break;
                    case 0x6: // SHR Vx
                        // Standard quirk: shift VX in place. Some versions shift VY into VX.
                        // We'll stick to modern shift-in-place
                        this.v[0xF] = this.v[x] & 0x1;
                        this.v[x] >>= 1;
                        break;
                    case 0x7: // SUBN Vx, Vy
                        this.v[0xF] = this.v[y] > this.v[x] ? 1 : 0;
                        this.v[x] = this.v[y] - this.v[x];
                        break;
                    case 0xE: // SHL Vx
                        this.v[0xF] = (this.v[x] & 0x80) >> 7;
                        this.v[x] <<= 1;
                        break;
                }
                break;

            case 0x9000: // SNE Vx, Vy
                if (this.v[x] !== this.v[y]) {
                    this.pc += 2;
                }
                break;

            case 0xA000: // LD I, addr
                this.i = (opcode & 0x0FFF);
                break;

            case 0xB000: // JP V0, addr
                this.pc = (opcode & 0x0FFF) + this.v[0];
                break;

            case 0xC000: // RND Vx, byte
                let rand = Math.floor(Math.random() * 0xFF);
                this.v[x] = rand & (opcode & 0x00FF);
                break;

            case 0xD000: // DRW Vx, Vy, nibble
                let width = 8;
                let height = (opcode & 0x000F);
                
                this.v[0xF] = 0;

                for (let row = 0; row < height; row++) {
                    let sprite = this.memory[this.i + row];

                    for (let col = 0; col < width; col++) {
                        // Check if bit in sprite is set (most significant bit first)
                        if ((sprite & 0x80) > 0) {
                            // If drawing outside screen, renderer handles wrap, but standard chip8 clips or wraps.
                            // We will use the renderer's wrap/clip logic (wrap in our implementation).
                            if (this.renderer.setPixel(this.v[x] + col, this.v[y] + row)) {
                                this.v[0xF] = 1; // Collision
                            }
                        }
                        sprite <<= 1;
                    }
                }
                break;

            case 0xE000:
                switch (opcode & 0x00FF) {
                    case 0x9E: // SKP Vx
                        if (this.keyboard.isKeyPressed(this.v[x])) {
                            this.pc += 2;
                        }
                        break;
                    case 0xA1: // SKNP Vx
                        if (!this.keyboard.isKeyPressed(this.v[x])) {
                            this.pc += 2;
                        }
                        break;
                }
                break;

            case 0xF000:
                switch (opcode & 0x00FF) {
                    case 0x07: // LD Vx, DT
                        this.v[x] = this.delayTimer;
                        break;
                    case 0x0A: // LD Vx, K (Wait for key)
                        this.paused = true;
                        this.keyboard.onNextKeyPress = (key) => {
                            this.v[x] = key;
                            this.paused = false;
                        };
                        break;
                    case 0x15: // LD DT, Vx
                        this.delayTimer = this.v[x];
                        break;
                    case 0x18: // LD ST, Vx
                        this.soundTimer = this.v[x];
                        break;
                    case 0x1E: // ADD I, Vx
                        this.i += this.v[x];
                        break;
                    case 0x29: // LD F, Vx
                        this.i = this.v[x] * 5; // Sprites 5 bytes long starting at 0
                        break;
                    case 0x33: // LD B, Vx
                        this.memory[this.i] = parseInt(this.v[x] / 100);
                        this.memory[this.i + 1] = parseInt((this.v[x] % 100) / 10);
                        this.memory[this.i + 2] = parseInt(this.v[x] % 10);
                        break;
                    case 0x55: // LD [I], Vx
                        for (let registerIndex = 0; registerIndex <= x; registerIndex++) {
                            this.memory[this.i + registerIndex] = this.v[registerIndex];
                        }
                        break;
                    case 0x65: // LD Vx, [I]
                        for (let registerIndex = 0; registerIndex <= x; registerIndex++) {
                            this.v[registerIndex] = this.memory[this.i + registerIndex];
                        }
                        break;
                }
                break;
            default:
                console.warn(`Unknown Opcode: ${opcode.toString(16)}`);
        }
    }
}