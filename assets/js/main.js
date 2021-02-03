class Drawable {
    constructor(game) {
        this.game = game;
        this.$html = this.createElement();
        this.position = {
            x: 0,
            y: 0
        };
        this.size = {
            w: 0,
            h: 0
        };
        this.offsets = {
            x: 0,
            y: 0
        };
        this.speedPerFrame = 0;
    }

    createElement() {
        return $(`<div class="element ${this.constructor.name.toLowerCase()}"></div>`);
    }

    update() {
        this.position.x += this.offsets.x;
        this.position.y += this.offsets.y;
    }

    draw() {
        this.$html.css({
            left: this.position.x + 'px',
            top: this.position.y + 'px',
            width: this.size.w + 'px',
            height: this.size.h + 'px'
        });
    }

    isCollision(element) {
        const a = {
            x1: this.position.x,
            x2: this.position.x + this.size.w,
            y1: this.position.y,
            y2: this.position.y + this.size.h,
        };
        const b = {
            x1: element.position.x,
            x2: element.position.x + element.size.w,
            y1: element.position.y,
            y2: element.position.y + element.size.h,
        };
        return a.x1 < b.x2 && b.x1 < a.x2 && a.y1 < b.y2 && b.y1 < a.y2;
    }

    isLeftBorderCollision() {
        return this.position.x < this.speedPerFrame;
    }

    isRightBorderCollision() {
        return this.position.x + this.size.w + this.speedPerFrame > this.game.$html.width();
    }
}

class Player extends Drawable {
    constructor(game) {
        super(game);
        this.size = {
            w: 200,
            h: 50,
        };
        this.position = {
            x: this.game.$html.width() / 2 - this.size.w / 2,
            y: this.game.$html.height() - this.size.h,
        };
        this.keys = {
            ArrowLeft: false,
            ArrowRight: false,
        };
        this.speedPerFrame = 10;

        this.bindKeyEvents();
    }

    update() {
        switch (true) {
            case this.keys.ArrowLeft:
                if (this.isLeftBorderCollision()) {
                    this.position.x = 0;
                    break;
                }
                this.position.x -= this.speedPerFrame;
                break;
            case this.keys.ArrowRight:
                if (this.isRightBorderCollision()) {
                    this.position.x = this.game.$html.width() - this.size.w;
                    break;
                }
                this.position.x += this.speedPerFrame;
                break;
        }
    }

    bindKeyEvents() {
        document.addEventListener('keydown', ev => this.changeKeyStatus(ev.code, true));
        document.addEventListener('keyup', ev => this.changeKeyStatus(ev.code, false));
    }

    changeKeyStatus(code, value) {
        if (code in this.keys) {
            this.keys[code] = value;
        }
    }
}

class Ball extends Drawable {
    constructor(game) {
        super(game);
        this.size = {
            w: 50,
            h: 50,
        };
        this.position = {
            x: this.game.$html.width() / 2 - this.size.w / 2,
            y: this.speedPerFrame + 5,
        };

        this.speedPerFrame = 10;
        this.offsets.y = this.speedPerFrame;
    }
}

class Game {
    constructor() {
        this.$html = $('#game .elements');
        this.elements = [];
        this.player = this.generate(Player);
        this.ball = this.generate(Ball);
    }

    generate(ClassName) {
        const element = new ClassName(this);
        this.elements.push(element);
        this.$html.append(element.$html);
        return element;
    }

    loop() {
        requestAnimationFrame(() => {
            this.updateElements();
            this.loop();
        });
    }

    updateElements() {
        this.elements.forEach(element => {
            element.update();
            element.draw();
        });
    }

    start() {
        this.loop();
    }
}

const game = new Game;
game.start();