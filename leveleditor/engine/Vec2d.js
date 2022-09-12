export class Vec2d {
    constructor({x,y}) {
        this.x = x || 0;
        this.y = y || 0;
        this.dist = null;
    }
    diff(other) {
        return new Vec2d(this)._sub(other);
    }
    sum(other) {
        return new Vec2d(this)._add(other);
    }
    _sub(other) {
        this.x -= other.x;
        this.y -= other.y;
        this.dist = null;
        return this;
    }
    _add(other) {
        this.x += other.x;
        this.y += other.y;
        this.dist = null;
        return this;
    }
    calcDist() {
        this.dist = Math.sqrt(this.x*this.x + this.y*this.y);
        return this.dist;
    }
    getDist() {
        if(!this.dist) {
            this.calcDist();
        }
        return this.dist;
    }
    getMultiplied(factor) {
        return new Vec2d({
            x: this.x * factor,
            y: this.y * factor,
            dist: this.dist ? this.dist * factor : null
        });
    }
    getNormalized() {
        if(!this.dist) {
            this.calcDist();
        }
        return this.getMultiplied(1 / this.dist);
    }
    getRotated(angle) {
        let vec2d = new Vec2d({});
        let cos = Math.cos(angle);
        let sin = Math.sin(angle);
        vec2d.x = cos*this.x - sin*this.y;
        vec2d.y = sin*this.x + cos*this.y;
        return vec2d;
    }
    _rotate(angle) {
        let vec2d = this.getRotated(angle);
        this.x = vec2d.x;
        this.y = vec2d.y;
    }
    getRotateClockwise(angle) {
        return this.getRotated(angle);
    }
    getRotateCounterClockwise(angle) {
        return this.getRotated(-angle);
    }
}