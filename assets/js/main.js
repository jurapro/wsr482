function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //Максимум не включается, минимум включается
}

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

    removeElement() {
        this.$html.remove();
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

    isTopBorderCollision() {
        return this.position.y - this.speedPerFrame < 0;
    }

    isButtonBorderCollision() {
        return this.position.y - this.speedPerFrame > this.game.$html.height();
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
        this.offsets.x = 5;
        this.bindKeyEvents();
    }

    bindKeyEvents() {
        document.addEventListener('block-collision', () => this.ballBounce());
    }

    update() {
        super.update();
        if (this.isCollision(this.game.player) || this.isTopBorderCollision()) {
            if (getRandomInt(0, 2)) {
                this.changeRandomDirection();
            }
            this.changeDirectionY();
            if (this.isCollision(this.game.player)) {
                document.dispatchEvent(new CustomEvent('player-collision'));
            }

        }
        if (this.isLeftBorderCollision() || this.isRightBorderCollision()) {
            this.changeDirectionX();
        }
        if (this.isButtonBorderCollision()) {
            document.dispatchEvent(new CustomEvent('end-game'));
        }
    }

    changeDirectionY() {
        this.offsets.y *= -1;
    }

    changeDirectionX() {
        this.offsets.x *= -1;
    }

    changeRandomDirection() {
        this.offsets.x = getRandomInt(-this.speedPerFrame, this.speedPerFrame);
    }

    ballBounce() {
        this.changeRandomDirection();
        this.changeDirectionY();
    }
}

class Block extends Drawable {

    update() {
        if (this.isCollision(this.game.ball)) {
            this.removeElement();
            document.dispatchEvent(new CustomEvent('block-collision', {
                detail: {block: this}
            }));
        }
    }
}

class Game {
    constructor() {
        this.$html = $('#game .elements');
        this.$panel = $('#game .panel');
        this.elements = [];
        this.newGame();
        this.bindKeyEvents();
    }

    newGame() {
        this.player = this.generate(Player);
        this.ball = this.generate(Ball);
        this.options = {
            scope: 0,
            multiplier: 1,
            pause: false,
            timer: 15,
            currentTime: this.getTime(),
        };
        this.keys = {
            Escape: false,
        };

        this.blocksGenerate({gap: 50, row: 3, size: {w: 200, h: 50}});
    }

    bindKeyEvents() {
        document.addEventListener('block-collision', evt => this.ballBounce(evt.detail.block));
        document.addEventListener('player-collision', () => this.clearMultiplier());
        document.addEventListener('end-game', () => this.endGame());
        document.addEventListener('keyup', ev => this.changeKeyStatus(ev.code));
    }

    changeKeyStatus(code) {
        if (code in this.keys) {
            this.keys[code] = !this.keys[code];
        }
    }

    blocksGenerate(options) {
        let top = options.gap;
        for (let row = 0; row < options.row; row++) {
            for (let x = options.gap; x < this.$html.width() - options.size.w; x += options.gap + options.size.w) {
                this.createBlock({x: x, y: top}, {w: options.size.w, h: options.size.h});
            }
            top += options.size.h + options.gap;
        }
    }

    createBlock(position, size) {
        let element = this.generate(Block);
        element.size = size;
        element.position = position;
    }

    generate(ClassName) {
        const element = new ClassName(this);
        this.elements.push(element);
        this.$html.append(element.$html);
        return element;
    }

    removeElement(item) {
        const ind = this.elements.indexOf(item);
        if (ind !== -1) {
            this.elements.splice(ind, 1);
        }
    }

    getPanel() {
        return `
            <span class="score">Очки: ${this.options.scope}</span>
            <span class="timer">Таймер: ${this.getTimer().min}:${this.getTimer().sec}</span>
            `;
    }

    getTime() {
        return Math.trunc(new Date().getTime() / 1000);
    }

    getTimer() {
        let min = Math.trunc(this.options.timer / 60);
        if (min < 10) {
            min = '0' + min;
        }
        let sec = this.options.timer % 60;
        if (sec < 10) {
            sec = '0' + sec;
        }

        return {min: min, sec: sec};
    }

    ballBounce(item) {
        this.removeElement(item);
        this.addScore();
    }

    addScore() {
        this.options.scope += this.options.multiplier;
        this.options.multiplier++;
    }

    clearMultiplier() {
        this.options.multiplier = 1;
    }

    update() {
        this.updateTime();
        this.$panel.html(this.getPanel());
    }

    updateTime() {
        if (this.options.currentTime === this.getTime()) return;
        this.options.currentTime = this.getTime();
        if (this.options.timer > 0) {
            this.options.timer--;
            return;
        }
        document.dispatchEvent(new CustomEvent('end-game'));
    }

    updatePause() {
        if (this.options.pause === this.keys.Escape) return;

        this.options.pause = this.keys.Escape;

        if (this.options.pause) {
            this.$panel.addClass('pause');
        } else {
            this.$panel.removeClass('pause');
        }


    }


    loop() {
        requestAnimationFrame(() => {
            if (!this.options.pause) {
                this.updateElements();
                this.update();
            }
            this.updatePause();
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

    restart() {
        this.elements = [];
        this.$html.html('');
        this.newGame();
    }

    endGame() {
        this.options.pause = true;
        alert('Конец игры');
        this.restart();
    }
}

const game = new Game;
game.start();