import {Vec2d} from './Vec2d.js';

export class Camera {
    constructor({x, y, follow, canvas}) {
        this.canvas = canvas;
        this.pos = new Vec2d({
            x: x || this.canvas.width / 2,
            y: y || this.canvas.height / 2
        });
        this.follow = follow;
    }
    update(delta) {
        if(this.follow) {
            let pos = this.follow.getPos();
            this.pos.x = pos.x;
            this.pos.y = pos.y;
        }
    }
    transformToCamera(ctx) {
        ctx.save()
        ctx.translate(
            -(this.pos.x - this.canvas.width/2),
            -(this.pos.y - this.canvas.height/2)
        );
    }
    resetTransformation(ctx) {
        ctx.restore();
    }
    followSprite(sprite) {
        this.follow = sprite;
    }
}