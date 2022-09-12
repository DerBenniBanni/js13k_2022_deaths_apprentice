import { Vec2d } from "./Vec2d.js";

export class Mouse {
    constructor(obj) {
        this.pos = new Vec2d({
            x:obj.x || 0,
            y:obj.y || 0,
        });
        
        if(obj.canvas) {
            this.canvasOffset = new Vec2d({
                x: obj.canvas.offsetLeft,
                y: obj.canvas.offsetTop
            });
        } else {
            this.canvasOffset = new Vec2d({x:0, y:0});
        }
        this.downPos = null;
        this.upPos = null;

        this.subscribers = {
            down:[],
            up:[],
            move:[]
        };

        let mouse = this;
        document.addEventListener('mousemove', (e) => mouse.onMove(e));
        document.addEventListener('mousedown', (e) => mouse.onDown(e));
        document.addEventListener('mouseup', (e) => mouse.onUp(e));
    }

    subscribe(eventCode, callback) {
        this.subscribers[eventCode].push(callback);
    }

    notifySubscribers(eventCode) {
        this.subscribers[eventCode].forEach(callback => callback(this));
    }


    onMove(e) {
        this.pos.x = e.pageX - this.canvasOffset.x;
        this.pos.y = e.pageY - this.canvasOffset.y;
        this.notifySubscribers('move');
    }

    onDown(e) {
        this.downPos = new Vec2d({
            x:e.pageX - this.canvasOffset.x,
            y:e.pageY - this.canvasOffset.y
        });
        this.upPos = new Vec2d(this.downPos);
        this.notifySubscribers('down');
    }

    onUp(e) {
        this.upPos = new Vec2d({
            x:e.pageX - this.canvasOffset.x,
            y:e.pageY - this.canvasOffset.y
        });
        this.notifySubscribers('up');
    }
}