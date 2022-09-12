export class Game {
    constructor({canvas, keyboard, camera, mouse}) {
        this.canvas = canvas;
        this.keyboard = keyboard || null;
        this.camera = camera || null;
        this.mouse = mouse || null;
        this.sprites= [];
        this.spriteHash = {};
        this.hudSprites = [];
        this.lastUpdate = Date.now();
        this.layerKeys = [];
    }
    init() {
        this.setup();
        this.requestFrame();
    }

    setup() {
    }
    updateAndRender() {
        let now = Date.now();
        let delta = (now - this.lastUpdate)/1000;
        this.lastUpdate = now;
        this.canvas.ctx.fillStyle = '#000000';
        this.canvas.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.cleanupSprites();
        this.updateSprites(delta);
        this.updateHudSprites(delta);
        if(this.camera) {
            this.camera.update(delta);
        }
        if(this.camera) {
            this.camera.transformToCamera(this.canvas.ctx);
        }
        this.renderSprites(this.canvas.ctx);
        if(this.camera) {
            this.camera.resetTransformation(this.canvas.ctx);
        }
        this.renderHudSprites(this.canvas.ctx);
        this.requestFrame();
    }
    requestFrame() {
        requestAnimationFrame(() => {this.updateAndRender()});
    }
    addSprite(sprite, hashKey) {
        return this.addSpriteToLayer(sprite, 'default', hashKey);
    }
    addSpriteToLayer(sprite, layer, hashKey) {
        sprite.game = this;
        if(!this.sprites[layer]) {
            this.sprites[layer] = [];
            this.layerKeys.push(layer);
        }
        this.sprites[layer].push(sprite);
        if(hashKey) {
            if(!this.spriteHash[hashKey]) {
                this.spriteHash[hashKey] = [];
            }
            this.spriteHash[hashKey].push(sprite);
        }
        return sprite;
    }
    addHudSprite(sprite) {
        sprite.game = this;
        this.hudSprites.push(sprite);
        return sprite;
    }
    cleanupSprites() {
        this.layerKeys.forEach(layerKey => {
            this.sprites[layerKey].filter(sprite => sprite.ttl > 0);
        });
        for(let key in this.spriteHash) {
            this.spriteHash[key] = this.spriteHash[key].filter(sprite => sprite.ttl > 0);
        }
        this.hudSprites = this.hudSprites.filter(sprite => sprite.ttl > 0);
    }
    updateSprites(delta) {
        this.layerKeys.forEach(layerKey => {
            this.sprites[layerKey].forEach(sprite => sprite.update(delta));
        })
    }
    updateHudSprites(delta) {
        this.hudSprites.forEach(sprite => sprite.update(delta));
    }
    renderSprites(ctx) {
        this.layerKeys.forEach(layerKey => {
            this.sprites[layerKey].forEach(sprite => sprite.render(ctx));
        });
    }
    renderHudSprites(ctx) {
        this.hudSprites.forEach(sprite => sprite.render(ctx));
    }
    getHashedSprites(key) {
        return this.spriteHash[key];
    }
}