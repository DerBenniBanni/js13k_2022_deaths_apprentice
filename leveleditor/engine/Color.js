export class Color {
    constructor(color) {
        this.r = 0;
        this.g = 0;
        this.b = 0;
        this.a = 255;
        if(typeof color == "string") {
            this.r = parseInt("0x"+color.substr(0,2));
            this.g = parseInt("0x"+color.substr(2,2));
            this.b = parseInt("0x"+color.substr(4,2));
            if(color.length == 8) {
                this.a = parseInt("0x"+color.substr(6,2));
            }
        } else if(color.r != undefined && color.g != undefined&& color.b != undefined){
            this.r = color.r;
            this.g = color.g;
            this.b = color.b;
            this.a = color.a || 255;
        }
    }

    rgbHexString() {
        return "#" + this._toHex(this.r) + this._toHex(this.g) + this._toHex(this.b);
    }
    rgbaHexString() {
        return this.rgbHexString() + this._toHex(this.a);
    }

    _toHex(rgb) {
        let hex = Number(rgb).toString(16);
        if(hex.length < 2) {
            hex = "0"+ hex;
        }
        return hex;
    }

    getMixed(targetColor, percentage) {
        percentage = percentage || 0.5;
        return new Color({
            r: Math.round(this.r + (targetColor.r - this.r) * percentage),
            g: Math.round(this.g + (targetColor.g - this.g) * percentage),
            b: Math.round(this.b + (targetColor.b - this.b) * percentage),
            a: Math.round(this.a + (targetColor.a - this.a) * percentage)
        });
    }
}