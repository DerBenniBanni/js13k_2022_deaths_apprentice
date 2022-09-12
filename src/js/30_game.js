const color = {
    cloakBg:'#110033',
    cloakOl:'#aa00ff',
    bone:'#eeffee',
    floorBg:'#110033',
    floorOl:'#9944ff66',
    brickBg:'#332255',
    brickOl:'#9944ff66',
    doorBg:'#772200',
    doorOl:'#aa5500',
    jumpBg:'#552233',
    jumpOl:'#ff77ff66',
}

const LOCALSTORAGE_KEY = 'DeathsApprenticeJS13k2022BestTime';


class Game {
    constructor(canvas, leveldata) {
        this.canvas = canvas;
        this.levels = [];
        this.levelPointer = -1;
        this.player = null;
        this.initLevels(leveldata);
        this.musicPlaying = false;

        this.ctx = canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.objs = [];
        this.keys = {
            'KeyA':'l',
            'KeyD':'r',
            'KeyW':'j',
            'ArrowLeft':'l',
            'ArrowRight':'r',
            'ArrowUp':'j',
            'ShiftLeft':'d',
            'ShiftRight':'d'
        };
        this.actions = {
            l:false,
            r:false,
            j:false
        };
        let game = this;
        document.addEventListener('keydown', (ev)=> game.keydown(ev));
        document.addEventListener('keyup', (ev)=> game.keyup(ev));
        this.lastUpdate = Date.now();
        this.startTime = null;
        this.speedRunTime = null;
    }
    initLevels(leveldata) {
        this.levels = leveldata.split('\n#\n');
        this.levelPointer = -1;
    }
    finishedCurrentLevel() {
        if(this.levelPointer == this.levels.length - 2) {
            // finished last level with hourglass, stop timer
            this.speedRunTime = (Date.now() - this.startTime) / 1000.0;
            let currentBest = localStorage.getItem(LOCALSTORAGE_KEY);
            if(!currentBest || currentBest > this.speedRunTime) {
                localStorage.setItem(LOCALSTORAGE_KEY, this.speedRunTime);
            }
        }
        if(this.levelPointer >= this.levels.length - 1) {
            return; // no more levels
        }
        this.player.stopUpdates = true;
        let game = this;
        this.addObj(new LevelBlender({
            target:this.player,
            game:game,
            finishedCallback:(blendObj)=>{
                game.loadNextLevel();
            }
        }));
    }
    loadNextLevel() {
        if(this.levelPointer >= this.levels.length - 1) {
            return; // no more levels
        }
        this.levelPointer++;
        this.loadCurrentLevel();
    }
    loadCurrentLevel() {
        this.objs = [];
        this.player = null;
        let leveldata = this.levels[this.levelPointer];
        leveldata.split("§").forEach(levelObject => {
            let data = levelObject.split("~");
            if(data.length < 2) {
                return;
            }
            let obj = {};
            if(data.length >= 3) {
                obj.pos = new Vec(data[1] * 1, data[2] * 1);
            }
            if(['f','d','j','s'].indexOf(data[0]) > -1) {
                obj.size = new Vec(data[3] * 1, data[4] * 1);
            }
            if(data[0] == "f") {
                game.addObj(new Floor(obj));
            } else if(data[0] == "s") {
                obj.directionUp = data[5] == "1";
                game.addObj(new Spikes(obj));
            } else if(data[0] == "d") {
                obj.lock = data[5];
                game.addObj(new Door(obj));
            } else if(data[0] == "k") {
                obj.unlocking = data[3];
                game.addObj(new Key(obj));
            } else if(data[0] == "j") {
                obj.jumpforce = (data[5] || 1.5) * 1;
                game.addObj(new Jumppad(obj));
            } else if(data[0] == "p") {
                game.player = game.addObj(new Player(obj));
            } else if(data[0] == "h") {
                obj.startTime = data[3] * 1;
                game.addObj(new Hourglass(obj));
            } else if(data[0] == "t") {
                obj.text = data[3];
                if(game.speedRunTime) {
                    obj.text = obj.text.replace("{speedRunTime}", this.getTimeFormated(game.speedRunTime));
                    localStorage.getItem(LOCALSTORAGE_KEY);
                    obj.text = obj.text.replace("{bestTime}", this.getTimeFormated(localStorage.getItem(LOCALSTORAGE_KEY)));
                }
                obj.startTime = data[4] * 1;
                obj.textsize = data[5];
                game.addObj(new Text(obj));
            }
        });
        this.player.stopUpdates = true;
        this.player.stopRendering = true;
        this.addObj(new LevelBlender({
            target:this.player,
            game:game,
            radius:1,
            rate:-game.canvas.width,
            finishedCallback:(blendObj)=>{
                game.removeObj(blendObj);
                game.player.respawn();
            }
        }));
    }
    keydown(ev) {
        if(this.keys[ev.code]) {
            this.actions[this.keys[ev.code]] = true;
        }
        if(ev.code == 'KeyM') {
            if(this.musicPlaying) {
                audio.pause();
                this.musicPlaying = false;
            } else {
                audio.play();
                this.musicPlaying = true;
            }
        }
        if(ev.code == 'KeyO') {
            this.loadNextLevel();
        }
        if(this.levelPointer == 0 && !this.startTime) {
            this.startTime = Date.now();
        }
    }
    keyup(ev) {
        if(this.keys[ev.code]) {
            this.actions[this.keys[ev.code]] = false;
            if(this.keys[ev.code] == "j" && this.player) {
                this.player.jumpReleased = true;
            }
        }
    }
    run() {
        this.lastUpdate = Date.now();
        this.requestFrame();
        audio.play();
        this.musicPlaying = true;
    }
    requestFrame() {
        requestAnimationFrame(() => {this.updateAndRender()});
    }
    updateAndRender() {
        let now = Date.now();
        let delta = (now - this.lastUpdate)/1000;
        this.lastUpdate = now;
        this.objs.forEach(o => o.update(delta));
        this.objs = this.objs.filter(o=>o.ttl > 0);
        this.ctx.fillStyle = '#00001188';
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.objs.forEach(o => o.render(this.ctx));
        if(!this.speedRunTime) {
            let runTime = (now - (this.startTime ? this.startTime : now)) / 1000.0;
            let elapsedTime = this.getTimeFormated(runTime);
            this.ctx.textAlign = "center";
            this.ctx.font = "24px serif";
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(elapsedTime,750,24);
        }
        this.requestFrame();
    }
    getTimeFormated(runTime) {
        runTime = runTime || 0;
        let minutes = Math.floor(runTime / 60.0);
        let seconds = Math.floor(runTime - minutes * 60.0);
        let tenth = Math.floor((runTime - minutes * 60.0 - seconds) * 10);
        return ("0" + minutes).substr(-2) + ":" + ("0" + seconds).substr(-2) + "." + tenth;
    }
    getColliderObjs(collGroup) {
        return this.objs.filter(o=>o.collGroup == collGroup);
    }
    addObj(obj) {
        this.objs.push(obj);
        obj.game = this;
        return obj;
    }
    removeObj(objToRemove) {
        this.objs = this.objs.filter(o => o !== objToRemove);
    }
}
class Vec {
    constructor(x,y) {
        this.x = x;
        this.y = y;
    }
    clone() {
        return new Vec(this.x, this.y);
    }
    multi(multi) {
        return new Vec(this.x * multi, this.y * multi);
    }
    plus(other) {
        return new Vec(this.x + other.x, this.y + other.y);
    }
    add(x,y) {
        this.x += x || 0;
        this.y += y || 0;
        return this;
    }
}
class Obj {
    constructor({pos, size, origin, ttl}) {
        this.pos = pos || new Vec(0,0);
        this.size = size || new Vec(0,0);
        this.origin = origin || new Vec(0.5,0.5);;
        this.type = "obj";
        this.collGroup = "";
        this.fillColor = color.floorBg;
        this.strokeColor = color.floorOl;
        this.game = null;
        this.ttl = ttl || Infinity;
    }
    render(ctx) {
        this.renderStart(ctx);
        ctx.fillStyle = this.fillColor;
        ctx.strokeStyle = this.strokeColor;
        if(this.fillColor) {
            ctx.fillRect(-this.size.x * this.origin.x, -this.size.y * this.origin.y, this.size.x, this.size.y);
        }
        if(this.strokeColor) {
            ctx.beginPath();
            ctx.rect(-this.size.x * this.origin.x, -this.size.y * this.origin.y, this.size.x, this.size.y);
            ctx.stroke();
        }
        this.renderPostProcess(ctx);
        ctx.restore();
    }
    renderStart(ctx) {
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
    }
    renderPostProcess(ctx) {}
    update(delta) {
        this.ttl -= delta;
    }
}
class Dust extends Obj {
    constructor(obj) {
        let ttl = obj.ttl || 0.5;
        let shrinkrate = obj.size / ttl;
        let dx = obj.dx || 80;
        let dy = obj.dy || 80;
        let dxd = obj.dxd || dx/2;
        let dyd = obj.dyd || dy/2;
        obj.size = new Vec(obj.size, obj.size);
        super(obj);
        this.dPos = new Vec(Math.random() * dx - dxd, Math.random() * dy - dyd);
        this.fillColor = "#aaaaaa";
        this.strokeColor = null;
        this.ttl = ttl;
        this.shrinkrate = shrinkrate;
    }
    update(delta) {
        super.update(delta);
        this.size.x -=  this.shrinkrate * delta;
        this.size.y -=  this.shrinkrate * delta;
        this.pos.add(this.dPos.x * delta, this.dPos.y * delta);
    }
}
class LevelBlender extends Obj {
    constructor({game, rate, radius, target, finishedCallback}) {
        super({});
        this.game = game;
        this.target = target || this.game.player;
        this.rate = rate || game.canvas.width / 2;
        this.radius = radius || game.canvas.width;
        this.finishedCallback = finishedCallback || null;
    }
    update(delta) {
        this.radius -= this.rate * delta;
        if(this.radius < 0.1) {
            this.radius = 0.1;
            if(this.finishedCallback) {
                this.finishedCallback(this);
            }
            this.ttl = -1;
        }
        if(this.radius > this.game.canvas.width) {
            this.radius = this.game.canvas.width;
            if(this.finishedCallback) {
                this.finishedCallback(this);
            }
            this.ttl = -1;
        }
    }
    render(ctx) {
        ctx.beginPath();
        ctx.fillStyle = "#000000";
        ctx.rect(this.game.canvas.width, 0, -this.game.canvas.width, this.game.canvas.height);
        ctx.arc(this.target.pos.x, this.target.pos.y, this.radius, 0, 2*Math.PI);
        ctx.fill();
    }

}
class Floor extends Obj {
    constructor(obj) {
        obj.origin = new Vec(0, 0);
        super(obj);
        this.type = "floor";
        this.collGroup = "level";
        this.fillColor = color.floorBg;
        this.strokeColor = color.floorOl;
        this.brickFillColor = color.brickBg;
        this.brickStrokeColor = color.brickOl;
        this.bricks = [];
        let x = 0;
        while(x < this.size.x) {
            let w = Math.ceil(Math.random() * 15) + 5;
            if(x + w > this.size.x) {
                w = this.size.x - x;
            }
            let h = Math.ceil(Math.random() * 5) + 3;
            let y = Math.floor(Math.random() * 2);
            this.bricks.push({
                x: x,
                y: y,
                w: w,
                h: h
            });
            x += w;
        }
        let y = 0;
        while(y < this.size.y) {
            let h = Math.ceil(Math.random() * 15) + 5;
            if(y + h > this.size.y) {
                h = this.size.y - y;
            }
            let w = Math.ceil(Math.random() * 5) + 3;
            let x = Math.floor(Math.random() * 2);
            this.bricks.push({
                x: x,
                y: y,
                w: w,
                h: h
            });
            y += h;
        }
        y = 0;
        while(y < this.size.y) {
            let h = Math.ceil(Math.random() * 15) + 5;
            if(y + h > this.size.y) {
                h = this.size.y - y;
            }
            let w = Math.ceil(Math.random() * 5) + 3;
            let x = Math.floor(Math.random() * 2);
            this.bricks.push({
                x: this.size.x - x - w,
                y: y,
                w: w,
                h: h
            });
            y += h;
        }
    }
    renderPostProcess(ctx) {
        this.bricks.forEach(b => {
            ctx.fillStyle = this.brickFillColor;
            ctx.strokeStyle = this.brickStrokeColor;
            ctx.fillRect(b.x , b.y, b.w, b.h);
            ctx.beginPath();
            ctx.rect(b.x , b.y, b.w, b.h);
            ctx.stroke();
        });
    }
}

class Spikes extends Obj {
    constructor(obj) {
        obj.origin = new Vec(0, 0);
        super(obj);
        this.directionUp = obj.directionUp !== false;
        this.type = "spikes";
        this.collGroup = "level";
        this.fillColor = "#aaaaaa";
        this.strokeColor = "#dddddd";
    }
    render(ctx) {
        this.renderStart(ctx);
        let y1 = this.size.y;
        let y2 = 0;
        if(this.directionUp) {
            y1 = 0;
            y2 = this.size.y;
        }
        ctx.strokeStyle = this.strokeColor;
        ctx.fillStyle = this.fillColor;
        ctx.beginPath();
        ctx.moveTo(0,y2);
        let steps = Math.ceil(this.size.x / 10);
        let stepsize = this.size.x / steps;
        for(let x = 0; x <= this.size.x - stepsize +0.1; x+=stepsize) {
            ctx.lineTo(x+stepsize/2,y1);
            ctx.lineTo(x+stepsize, y2);
        }
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
}

class Door extends Obj {
    constructor(obj) {
        obj.origin = new Vec(0, 0);
        super(obj);
        this.type = "door";
        this.collGroup = "level";
        this.fillColor = color.doorBg;
        this.strokeColor = color.doorOl;
        this.lock = obj.lock || 'allLocks';
        this.unlocked = false;
    }
    update(delta) {
        if(this.unlocked && this.size.y > 0) {
            this.size.y -= delta * 40;
            this.pos.y += delta * 40;
        }
    }
}

class Jumppad extends Obj {
    constructor(obj) {
        obj.origin = new Vec(0, 0);
        super(obj);
        this.jumpforce = obj.jumpforce || 3;
        this.type = "jumppad";
        this.collGroup = "level";
        this.fillColor = color.jumpBg;
        this.strokeColor = color.jumpOl;
    }
}

class Key extends Obj {
    constructor(obj) {
        obj.origin = new Vec(0.5, 0.5);
        obj.size = new Vec(20,20);
        super(obj);
        this.unlocking = obj.unlocking || 'allLocks';
        this.type = "key";
        this.collGroup = "keys";
        let defs = [
            ['#ffff88', null, -5,0, -8,3, -8,6, -11,6, -11,3, -14,-1, -14,-3, -11,-5, -8,-5, -5,-3, 8,-3, 8,-2, 7,-2, 7,1, 5,1, 5,-1, -5,-1, 'c'],
            [null, '#000000', -13,-2, -11,-2, -11,1],
            [null, '#000000', -6,-2, -8,-2, -8,1],
        ];
        this.currentPath = createPath(defs);
    }
    render(ctx) {
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        renderPaths(ctx, this.currentPath);
        ctx.restore();
    }
}
class Hourglass extends Obj {
    constructor(obj) {
        obj.origin = new Vec(0.5, 0.5);
        obj.size = new Vec(20,20);
        super(obj);
        this.type = "hourglass";
        this.collGroup = "collect";
        this.fillColor = '#ffffdd';
        this.textFillColor = '#ffffdd';
        this.strokeColor = '#ffff00';
        this.startTime = obj.startTime || Infinity;
        this.time = this.startTime;
        let defs = [
            [color.cloakBg,color.cloakOl, -5,-10, 0,0, -5,10, 5,10, 0,0, 5,-10, 'c'],
            [color.bone, null, -3,-5, 0,0, 3,-5, 'c'],
            [color.bone, null, -4,9, 0,7, 4,9, 'c'],
            [null, '#aa8822', -7,-10, 7,-10],
            [null, '#aa8822', -7,10, 7,10],
            [null, '#aa8822', -5,-9, -5,9],
            [null, '#aa8822', 5,-9, 5,9],
        ];
        this.currentPath = createPath(defs);
    }
    update(delta) {
        if(this.time < -0.9) {
            this.game.player.stopUpdates = true;
            this.game.addObj(new LevelBlender({
                target:this,
                game:game,
                radius:game.canvas.width,
                rate:game.canvas.width/2,
                finishedCallback:(blendObj)=>{
                    game.removeObj(blendObj);
                    this.game.loadCurrentLevel();
                }
            }));
        } else {
            this.time -= delta;
        }
    }
    render(ctx) {
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        renderPaths(ctx, this.currentPath);
        if(this.time < Infinity) {
            ctx.textAlign = "center";
            if(this.time <= 0) {
                ctx.font = "24px serif";
                ctx.fillStyle = 'red';
            } else {
                ctx.font = "12px serif";
                ctx.fillStyle = this.textFillColor;
            }
            ctx.fillText(Math.ceil(this.time), 0, -15);
        }
        ctx.restore();
    }
}
class Text extends Obj {
    constructor(obj) {
        super(obj);
        this.type = "text";
        this.collGroup = "text";
        this.textFillColor = '#ffffdd';
        this.text = obj.text || "";
        this.textsize = obj.textsize || "12";
        this.startTime = obj.startTime || Infinity;
        this.time = this.startTime;
    }
    update(delta) {
        this.time -= delta;
        if(this.time < -0.5) {
            this.game.removeObj(this);
        }
    }
    render(ctx) {
        this.renderStart(ctx);
        ctx.textAlign = "center";
        ctx.font = this.textsize + "px serif";
        ctx.fillStyle = this.textFillColor;
        ctx.fillText(this.text, 0, 0);
        ctx.restore();
    }
}
let createPath = (defs, flipX) => {
    let fX = flipX ? -1 : 1;
    return defs.map(d=> {
        let p = {
            fill:d[0],
            stroke:d[1],
            path: new Path2D()
        };
        p.path.moveTo(d[2] * fX, d[3]);
        for(let i = 4; i <= d.length -2; i+=2) {
            p.path.lineTo(d[i] * fX, d[i+1]);
        }
        if(d[d.length-1] == 'c') {
            p.path.closePath();
        }
        return p;
    });
}
let renderPaths = (ctx, paths) => {
    paths.forEach(p=> {
        if(p.fill) {
            ctx.fillStyle = p.fill;
            ctx.fill(p.path);
        }
        if(p.stroke) {
            ctx.strokeStyle = p.stroke;
            ctx.stroke(p.path); 
        }   
    });
}
class Player extends Obj {
    constructor(obj) {
        obj.size = new Vec(10,30);
        obj.origin = new Vec(0.5, 1);
        super(obj);
        this.respawnPos = this.pos.clone();
        this.type = "player";
        this.collGroup = "player";
        this.dPos = new Vec(0,0);
        this.speed = 100; // pixel per second
        this.dashFactor = 3;
        this.dashDuration = 0.25;
        this.dashtimer = this.dashDuration;
        this.jumpForce = 200;
        this.jumpReleased = true;
        this.gravity = 500;
        this.maxFallSpeed = 300;
        this.grounded = false;
        this.groundedTo = null;
        this.stopUpdates = false;
        this.stopRendering = false;
        this.walkDustTimout = 0.1;
        this.lastWalkDust = 0;
        let defs = [
            [color.cloakBg,color.cloakOl, -8,0, -3,-15, -2,-27, 5,-20, 5,0, 'c'],
            [color.bone, null, -2,-30, 0,-32, 3,-32, 6,-30, 6,-20, 2,-21, -2,-24],
            ['#000000', null, 3,-28, 5,-28, 5,-26, 3,-26],
            [null, '#aa8822', -3,-2, 12,-35],
            [null, '#ccccdd', 11,-34, 16,-31, 19,-27],
            [color.bone, null, -1,-7, -1,-9, 1,-9, 1,-7],
        ];
        this.paths = {
            r: createPath(defs),
            l: createPath(defs, true)
        };
        defs.push([null, color.bone, -8,-7, -20,-7]);
        defs.push([null, color.bone, -8,-14, -25,-14]);
        defs.push([null, color.bone, -6,-20, -22,-20]);
        this.paths.dr = createPath(defs);
        this.paths.dl = createPath(defs, true);
        
        this.currentPath = this.paths.r;
    }
    update(delta) {
        if(this.stopUpdates) {
            return;
        }
        let walking = this.grounded;
        if(game.actions.l) {
            this.dPos.x = -this.speed;
            this.currentPath = this.paths.l;
        } else if(game.actions.r) {
            this.dPos.x = this.speed;
            this.currentPath = this.paths.r;
        } else {
            this.dPos.x *= 0.2;
            walking = false;
            this.lastWalkDust = 0;
        }
        if(walking) {
            this.lastWalkDust -= delta;
            if(this.lastWalkDust < 0) {
                this.createWalkDust();
                this.lastWalkDust = this.walkDustTimout;
            }
        }
 
        if(this.grounded) { 
            if(this.groundedTo && this.groundedTo.type == "jumppad") {
                this.dPos.y = -this.jumpForce * (this.groundedTo.jumpforce);
            } else if(game.actions.j && this.jumpReleased) {
                this.jumpReleased = false;
                this.dPos.y = -this.jumpForce;
                this.dashtimer = this.dashDuration;
                this.createJumpDust();
            } else {
                this.dPos.y = 0;
            }
        } else {
            if(game.actions.j && this.dPos.y <0) {
                this.dPos.y += this.gravity * 0.5 * delta;
            } else {
                this.dPos.y += this.gravity * delta;
            }
            if(game.actions.d && this.dashtimer > 0) {
                this.dashtimer -= delta;
                if(game.actions.l) {
                    this.dPos.x = -this.speed * this.dashFactor;
                    this.currentPath = this.paths.dl;
                }
                if(game.actions.r) {
                    this.dPos.x = this.speed * this.dashFactor;
                    this.currentPath = this.paths.dr;
                }
            }
        }
        if(this.dPos.y > this.maxFallSpeed) {
            this.dPos.y = this.maxFallSpeed;
        }

        this.pos = this.pos.plus(this.dPos.multi(delta));

        // Collisions
        this.grounded = false;
        let br = this.pos.clone().add(6,0);
        let bl = this.pos.clone().add(-6,0);
        let tl = bl.clone().add(0,-29);
        let tr = br.clone().add(0,-29);
        let t = this.pos.clone().add(0,-29);
        let r = this.pos.clone().add(7,-15);
        let l = this.pos.clone().add(-7,-15);

        let deadlyContact = false;
        game.getColliderObjs("level").forEach(o=> {
            let deadlyObject = ['spikes'].indexOf(o.type) >= 0;
            let otl = o.pos.clone().add(
                -o.size.x * o.origin.x,
                -o.size.y * o.origin.y,
            );
            let obr = o.pos.clone().add(
                o.size.x * (1 - o.origin.x),
                o.size.y * (1 - o.origin.y),
            );
            // jump - head
            if(this.dPos.y < 0 && t.y >= otl.y && t.y <= obr.y && t.x >= otl.x && t.x <= obr.x) {
                this.dPos.y = 0;
                this.pos.y = obr.y + 28;
                deadlyContact |= deadlyObject;
            }

            // right
            if(this.dPos.x > 0 && r.y >= otl.y && r.y <= obr.y && r.x >= otl.x && r.x <= obr.x) {
                this.dPos.x = 0;
                this.pos.x = otl.x -8;
                br = this.pos.clone().add(6,0);
                bl = this.pos.clone().add(-6,0);
                deadlyContact |= deadlyObject;
            }

            // left
            if(this.dPos.x < 0 && l.y >= otl.y && l.y <= obr.y && l.x >= otl.x && l.x <= obr.x) {
                this.dPos.x = 0;
                this.pos.x = obr.x +8;
                br = this.pos.clone().add(6,0);
                bl = this.pos.clone().add(-6,0);
                deadlyContact |= deadlyObject;
            }

            // bottom
            if(
                (br.y >= otl.y && br.y <= obr.y && br.x >= otl.x && br.x <= obr.x)
                || (bl.y >= otl.y && bl.y <= obr.y && bl.x >= otl.x && bl.x <= obr.x)
            ) {
                this.grounded = true;
                if(!this.groundedTo || this.groundedTo.type != "jumppad")
                this.groundedTo = o;
                this.pos.y = otl.y;
                deadlyContact |= deadlyObject;
            }
            
        });
        if(!this.grounded) {
            this.groundedTo = null;
        }
        game.getColliderObjs("collect").forEach(o=> {
            if (
                tl.x < o.pos.x + o.size.x * (1-o.origin.x) &&
                tr.x > o.pos.x - o.size.x * (1-o.origin.x) &&
                tl.y < o.pos.y + o.size.y * o.origin.y &&
                bl.y > o.pos.y - o.size.y * o.origin.y
            ) {
                this.game.removeObj(o);
            }
        });
        game.getColliderObjs("keys").forEach(o=> {
            if (
                tl.x < o.pos.x + o.size.x * (1-o.origin.x) &&
                tr.x > o.pos.x - o.size.x * (1-o.origin.x) &&
                tl.y < o.pos.y + o.size.y * o.origin.y &&
                bl.y > o.pos.y - o.size.y * o.origin.y
            ) {
                game.getColliderObjs("level").forEach(d=> {
                    if(d.lock == o.unlocking) {
                        d.unlocked = true;
                    }
                })
                console.log(o.unlocking);
                this.game.removeObj(o);
            }
        });
        if(game.getColliderObjs("collect").length == 0) {
            game.finishedCurrentLevel();
        }
        
        if(this.pos.y > this.game.canvas.height || deadlyContact) {
            this.dPos.x = 0;
            this.dPos.y = 0;
            this.createDeathDust(10);
            this.stopUpdates = true;
            this.stopRendering = true;
            let player = this;
            setTimeout(()=> player.respawn(), 1000);
        }
    }
    respawn() {
        this.stopUpdates = false;
        this.stopRendering = false;
        this.pos = this.respawnPos.clone();
        this.createDeathDust(15);
    }
    createDeathDust(amount) {
        for(let i = 0; i < (amount || 10); i++) {
            let dustPos = new Vec(this.pos.x + Math.random() * 20 - 10, this.pos.y - 14 + Math.random() * 30 - 15);
            this.game.addObj(new Dust({
                pos:dustPos, 
                size:Math.random() * 8 + 5, 
                ttl:Math.random() * 0.8 + 0.5
            }))
        }
    }
    createWalkDust() {
        this.game.addObj(new Dust({
            pos:this.pos.clone(), 
            size:2, 
            ttl:Math.random() * 0.4 + 0.2,
            dx:80, dy:40,
            dyd:40
        }));
    }
    createJumpDust() {
        for(let i = 0; i < 5; i++) {
            this.game.addObj(new Dust({
                pos:this.pos.clone(), 
                size:4, 
                ttl:Math.random() * 0.4 + 0.2,
                dx:80, dy:20,
                dxd:40, dyd:20
            }));
        }
    }
    render(ctx) {
        if(this.stopRendering) {
            return;
        }
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        renderPaths(ctx, this.currentPath);
        ctx.restore();
    }
}

const levelData = `
p~197~380§t~173~304~Use WASD to move~0~12§t~643~322~Collect these hourglasses~0~12§t~406~134~DEATH'S APPRENTICE~0~66§t~404~166~Welcome to the first day of your apprenticeship in Deaths's realm.~0~24§t~203~321~(or arrow keys)~0~12§h~621~422~0§t~581~537~By the way: Use the [M] key to toggle the music on and off... ~0~12§f~127~348~33~103§f~661~347~31~104§f~125~333~567~15§f~126~450~567~51§t~403~235~Your tasks are simple: collect the hourglasses for your master.~0~18§t~727~49~starts with your first move~0~12§t~626~23~Speedrun Clock:~0~18
#
p~236~194§f~717~219~84~281§f~505~389~212~111§f~182~494~80~6§f~196~487~80~7§f~209~481~78~6§f~222~475~77~6§f~235~469~78~6§f~246~463~78~6§f~318~429~187~81§t~231~374~Stairs can be walked~0~12§f~445~351~60~78§h~679~359~0§t~127~152~Press Up (or W) to jump~0~12§t~460~258~Hold Up (or W) to jump higher~0~12§h~475~330~0§h~350~404~0§h~98~468~0§f~-36~135~66~366§f~2~115~307~21§f~288~136~21~105§f~103~240~204~16§f~103~209~41~33§f~258~457~54~6§f~269~452~42~5§f~283~446~28~6§f~309~434~10~7§f~295~440~25~7§f~1~500~397~30
#
h~738~364~0§p~76~463§f~407~498~71~30§f~519~454~61~18§f~614~421~60~22§f~710~391~60~23§f~-1~335~53~264§f~251~522~30~81§f~434~520~20~82§f~541~467~20~137§f~635~437~22~168§f~731~407~23~198§f~49~503~279~34§t~390~194~So? Too easy, you say? Ok, here are more hourglasses for you to collect...~0~24§t~584~224~Dont fall down! Or....~0~18§t~639~248~You'll respawn ;-)~0~12
#
f~42~93~97~36§f~227~1~24~468§f~67~562~98~37§f~226~560~23~26§f~339~557~100~33§f~502~494~100~25§f~345~419~87~28§f~506~350~75~33§f~387~292~41~33§f~511~236~52~28§f~389~165~42~29§f~511~109~104~24§f~646~95~27~530§f~552~105~95~5§f~573~100~75~5§f~599~95~50~5§f~620~89~86~7§f~723~552~28~64§f~705~543~63~9§p~92~33§h~734~510~0§h~295~502~0§h~522~89~0§t~409~29~Some more todos, young apprentice...~0~18§t~354~48~Go, get 'em all! Quick!~0~12
#
f~687~271~33~115§f~93~271~32~114§f~92~383~628~29§f~92~264~628~7§p~154~301§h~640~354~15§t~253~207~I recently mentioned the word "quick"...~0~18§t~373~225~...some hourglasses have only a few seconds left...~0~14§t~512~240~... so you got to hurry up!~0~12§t~551~440~As soon as one hourglass reaches zero, your lesson will restart.~0~12§t~621~462~An apprenticeship is no piece of cake, after all.~0~12
#
f~289~298~210~131§f~321~494~145~60§f~465~536~211~18§f~102~537~219~17§f~675~104~19~450§f~84~99~610~5§f~82~100~21~456§f~578~246~47~23§f~103~305~42~20§f~120~354~61~20§f~198~467~47~19§f~150~410~64~20§f~184~257~47~20§f~637~307~39~20§f~605~366~45~20§f~570~425~42~23§f~537~475~40~17§p~388~256§h~602~219~22§h~198~228~17§h~129~506~32§h~639~504~6§t~384~57~It's time for a little test, my apprentice!~0~18§t~385~80~You'll have to choose the order in which you should collect the hourglasses.~0~12
#
f~166~329~28~275§f~488~329~30~270§f~90~310~167~19§f~437~308~168~21§p~115~281§h~586~286~0§t~204~77~Sometimes, when it looks too far...~0~18§t~462~90~... a little well timed SHIFT helps.~0~18§t~232~152~Jump while walking, aaaand...~0~12§t~417~166~.. press [SHIFT] for a little extra push.~0~12§f~76~229~14~99
#
h~595~398~0§f~123~429~585~20§p~284~392§j~389~424~44~5~1.7§j~677~424~30~5~2§f~538~301~117~14§h~178~399~0§t~261~83~An obstacle is to big for you to jump over it? ~0~18§t~377~116~When you are lucky, Death left a handy jumppad for you nearby.~0~14§t~467~145~Just walk onto it, and let the thing do its magic... weeee!eh!~0~12§t~310~473~Always remember: when you are stuck, just jump off a cliff. You'll respawn. ;-)~0~12§f~443~300~36~129§f~233~298~41~131
#
d~411~267~5~97~d1§k~471~535~d1§f~71~434~210~15§f~222~427~59~8§f~243~420~60~8§f~261~413~57~8§f~279~408~54~7§f~294~400~56~9§f~313~395~60~9§f~325~387~65~10§f~345~379~63~10§f~363~372~67~9§f~387~362~347~10§f~382~131~42~134§f~377~258~370~11§f~289~122~146~13§f~725~253~29~120§h~690~336~0§f~7~564~522~15§j~15~559~32~5~2§t~164~77~When your path is locked...~0~20§t~462~461~... the indirect way may turns out to be the "KEY" to success.~0~14§p~329~287
#
f~13~18~765~18§f~752~34~26~547§f~228~202~22~172§f~246~359~190~15§f~416~217~20~157§f~523~421~114~17§f~481~375~28~15§f~568~259~25~13§f~608~201~148~17§j~680~569~43~5~1.8§f~13~35~27~541§f~40~208~143~18§f~162~226~18~274§j~40~569~101~5~2.2§f~226~182~124~21§f~334~35~20~147§f~107~112~172~18§f~179~34~18~80§p~148~76§k~230~78~1§d~571~472~5~102~1§f~564~438~21~34§f~242~372~17~70§d~373~373~5~71~2§f~244~440~211~17§k~284~265~3§f~327~203~21~92§j~257~356~152~5~2§h~301~408~0§f~510~35~23~101§f~533~117~144~19§d~661~36~5~81~3§h~563~79~0§k~638~241~2§f~624~314~128~18§h~96~373~0§f~14~573~300~20§f~404~573~374~20§t~83~53~Jump around~0~14§f~538~318~86~14
#
s~224~453~124~45~1§s~410~454~262~81~1§f~212~495~153~30§f~403~528~279~20§f~348~449~62~101§f~673~450~91~104§f~38~447~185~86§f~466~390~36~16§f~555~357~38~19§h~733~426~0§p~64~412§t~234~119~Spikes in Death's domain ?!?!??~0~20§t~325~157~Well, yes. Why not?~0~16§t~394~187~Dont touch them.~0~12
#
s~155~552~244~49~1§s~160~381~250~45~0§f~29~548~127~53§f~510~394~54~55§f~152~361~263~30§f~397~548~94~56§f~248~519~59~17§j~445~543~37~5~2§s~431~176~45~21~1§s~521~176~38~19~1§s~605~173~38~22~1§h~726~165~0§d~364~92~5~104~allLocks§k~588~343~allLocks§j~200~357~31~5~1.7§p~55~517§s~289~209~410~60~0§f~283~193~482~26§f~34~15~342~83§t~186~50~Roses are red, Violets are blue.~0~18§t~221~70~A spike on the head, will also hurt you.~0~15
#
s~-11~566~822~37~1§f~286~469~215~23§j~472~464~28~5~1.7§j~286~464~29~5~1.7§f~628~412~32~22§f~128~412~28~17§j~629~407~29~5~1.7§j~127~407~30~5~1.7§f~356~207~55~43§f~331~159~112~50§f~329~111~18~53§f~382~116~13~46§f~431~110~12~49§f~339~95~97~21§f~361~135~10~11§f~409~139~11~8§t~386~53~That's the end, my apprentice!~0~32§t~387~74~The deadline of js13k 2022 is here, and the game-dev is too tired to add more levels ;-)~0~12§t~384~295~You took {speedRunTime} to complete your training~0~18§t~385~325~(Your best time ever was {bestTime})~0~12§t~390~514~THX for playing! Hope you had fun~0~12§p~386~357§t~385~340~Press F5, if you want to try again...~0~12
`;
const game = new Game(document.getElementById('canvas'), levelData.trim());
game.run();
game.loadNextLevel();


