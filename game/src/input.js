// Input for Gobble Run: keyboard and mouse, read as a small state object
// the game polls each frame. Keys are edge-triggered where the game
// needs a single press (jump, pause, mute, restart) and held where it
// needs a state (sprint, hide). Mouse clicks jump when they land on the
// canvas during play, and press the menu buttons on the title and end
// screens. Arrow keys and Space never scroll the page.

export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.pressed = new Set();
    this.mouseX = 0;
    this.mouseY = 0;
    this.clicked = false;
    this.canvas = canvas;

    window.addEventListener('keydown', (event) => {
      const code = event.code;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) {
        event.preventDefault();
      }
      if (!event.repeat) this.pressed.add(code);
      this.keys.add(code);
    });
    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.code);
    });
    canvas.addEventListener('pointerdown', (event) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      this.mouseX = (event.clientX - rect.left) * scaleX;
      this.mouseY = (event.clientY - rect.top) * scaleY;
      this.clicked = true;
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
    });
  }

  held(code) {
    return this.keys.has(code);
  }

  wasPressed(code) {
    return this.pressed.has(code);
  }

  get jumpPressed() {
    return this.wasPressed('Space') || this.wasPressed('KeyW') || this.wasPressed('ArrowUp');
  }

  get hideHeld() {
    return this.held('ArrowDown') || this.held('KeyS');
  }

  get sprintHeld() {
    return this.held('ShiftLeft') || this.held('ShiftRight');
  }

  get pausePressed() {
    return this.wasPressed('KeyP') || this.wasPressed('Escape');
  }

  get mutePressed() {
    return this.wasPressed('KeyM');
  }

  get restartPressed() {
    return this.wasPressed('KeyR');
  }

  get startPressed() {
    return this.wasPressed('Enter') || this.jumpPressed;
  }

  // True when the last click landed inside the given button rect.
  clickedButton(rect) {
    if (!rect || !this.clicked) return false;
    return (
      this.mouseX >= rect.x &&
      this.mouseX <= rect.x + rect.w &&
      this.mouseY >= rect.y &&
      this.mouseY <= rect.y + rect.h
    );
  }

  // Clear the edge-triggered state at the end of each frame.
  endFrame() {
    this.pressed.clear();
    this.clicked = false;
  }
}
