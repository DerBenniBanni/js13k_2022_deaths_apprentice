import {Vec2d} from './Vec2d.js';

export class Sprite {
    constructor({x, y, w, h, pos, dPos, rect, ttl, origin, color, game}) {
        x = x || 0;
        y = y || 0;
        h = h || 0;
        w = w || 0;
        this.pos = new Vec2d(pos || {x:x, y:y});
        this.rect = new Vec2d(rect || {x:w, y:h});
        this.origin = new Vec2d(origin || this.rect.getMultiplied(.5));
        this.dPos = new Vec2d(dPos || {x:0, y:0});
        this.ttl = ttl || Infinity;
        this.color = color || '#ffffff';
        this.game = game;
    }
    getPos() {
        return this.pos;
    }
    update(delta) {
        this.ttl -= delta;
        this.pos._add(this.dPos.getMultiplied(delta));
    }
    render(ctx) {}
}
