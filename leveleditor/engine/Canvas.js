export class Canvas {
    constructor({canvas, doResize}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.doResize = doResize == undefined ? true : doResize;
        if(this.doResize) {
            window.addEventListener('resize', () => {
                this.handleResize();
            });
            this.handleResize();
        }
    }

    handleResize() {
        let docElem = document.documentElement;
        let body = document.getElementsByTagName('body')[0];
        let width = window.innerWidth || docElem.clientWidth || body.clientWidth;
        let height = window.innerHeight|| docElem.clientHeight|| body.clientHeight;
    
        this.canvas.width = width;
        this.canvas.height = height;

        this.width = this.canvas.width;
        this.height = this.canvas.height;
    } 
}