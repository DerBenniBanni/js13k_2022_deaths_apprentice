import {Sprite} from '../engine/Sprite.js';

export class LevelObject extends Sprite {
    constructor(obj) {
        super(obj);
        this.data = {};
        this.type = obj.type || "floor";
        if(['player', 'hourglass', 'text', 'key'].indexOf(this.type) > -1) {
            this.rect.x = 10;
            this.rect.y = 10;
        }
        if(['text', 'hourglass'].indexOf(this.type) > -1) {
            this.data.time = obj.time || 0;
        }
        if(this.type == 'text') {
            this.data.text = obj.text || "Text";
            this.data.textsize = obj.textsize || "12";
        }
        if(this.type == 'jumppad') {
            this.data.jumpforce = obj.jumpforce || "1.7";
        }
        if(this.type == 'door') {
            this.data.lock = obj.lock || "allLocks";
        }
        if(this.type == 'key') {
            this.data.unlocking = obj.unlocking || "allLocks";
        }
        if(this.type == 'spikes') {
            this.data.directionUp = obj.directionUp !== false;
        }
        this.highlighted = false;
        this.highlightColor = "";
    }
    update(delta) {
        super.update(delta);
        if(this.type == "jumppad") {
            this.rect.y = 5;
        }
        if(this.type == "door") {
            this.rect.x = 5;
        }
    }
    render(ctx) {
        ctx.save();
        let pos = this.getPos();
        ctx.translate(pos.x, pos.y);
        let doFillRect = ['spikes'].indexOf(this.type) < 0;
        ctx.fillStyle = this.color;
        if(doFillRect) {
            ctx.fillRect(0,0,this.rect.x,this.rect.y);
        }
        if(this.type == "spikes") {
            let y1 = this.rect.y;
            let y2 = 0;
            if(this.data.directionUp) {
                y1 = 0;
                y2 = this.rect.y;
            }
            ctx.strokeStyle = '#00000088';
            ctx.beginPath();
            ctx.moveTo(0,y2);
            let steps = Math.ceil(this.rect.x / 10);
            let stepsize = this.rect.x / steps;
            for(let x = 0; x <= this.rect.x - stepsize +0.1; x+=stepsize) {
                ctx.lineTo(x+stepsize/2,y1);
                ctx.lineTo(x+stepsize, y2);
            }
            ctx.fill();
            ctx.stroke();
        }
        
        if(this.highlighted) {
            ctx.strokeStyle = this.highlightColor;
        } else {
            ctx.strokeStyle = '#00000088';
        }
        ctx.beginPath();
        ctx.rect(0,0,this.rect.x,this.rect.y);
        ctx.stroke();

        if(this.type == "hourglass") {
            if(this.data.time > 0) { 
                ctx.textAlign = "center";
                ctx.font = "12px serif";
                ctx.fillText(this.data.time, 5, -7);
            }
        }
        if(this.type == "text") {
            ctx.textAlign = "center";
            ctx.font = this.data.textsize + "px serif";
            ctx.fillStyle = '#ffffff';
            ctx.fillText(this.data.text, 0, 0);
            if(this.data.time > 0) { 
                ctx.fillStyle = this.color;
                ctx.fillText(this.data.time, 0, -12);
            }
        }
        if(this.type == "door") {
            ctx.textAlign = "center";
            ctx.font = "12px serif";
            ctx.fillStyle = '#ffffff';
            ctx.fillText(this.data.lock, 2, this.rect.y / 2);
        }
        if(this.type == "key") {
            ctx.textAlign = "center";
            ctx.font = "12px serif";
            ctx.fillStyle = '#ffffff';
            ctx.fillText(this.data.unlocking, 0, -2);
        }
        ctx.restore();
    }
}