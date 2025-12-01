export class Renderer {
    constructor(scale) {
        this.cols = 64;
        this.rows = 32;
        this.scale = scale;
        this.canvas = document.querySelector('canvas');
        this.ctx = this.canvas.getContext('2d');

        // Internal resolution of canvas
        this.canvas.width = this.cols * this.scale;
        this.canvas.height = this.rows * this.scale;

        this.display = new Array(this.cols * this.rows).fill(0);
    }

    setPixel(x, y) {
        // Wrap around
        if (x > this.cols - 1) x -= this.cols;
        else if (x < 0) x += this.cols;

        if (y > this.rows - 1) y -= this.rows;
        else if (y < 0) y += this.rows;

        const pixelLoc = x + (y * this.cols);
        this.display[pixelLoc] ^= 1; // XOR

        return !this.display[pixelLoc]; // Return true if pixel was erased
    }

    clear() {
        this.display = new Array(this.cols * this.rows).fill(0);
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw pixels
        for (let i = 0; i < this.display.length; i++) {
            const x = (i % this.cols) * this.scale;
            const y = Math.floor(i / this.cols) * this.scale;

            if (this.display[i]) {
                this.ctx.fillStyle = '#33ff33';
                this.ctx.shadowBlur = 4;
                this.ctx.shadowColor = '#33ff33';
                this.ctx.fillRect(x, y, this.scale - 1, this.scale - 1); // -1 for grid gap effect
                this.ctx.shadowBlur = 0;
            }
        }
    }

    testRender() {
        this.setPixel(0, 0);
        this.setPixel(63, 31);
        this.render();
    }
}