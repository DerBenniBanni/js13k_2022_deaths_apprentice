import {Canvas} from './engine/Canvas.js';
import {Sprite} from './engine/Sprite.js';
import {Color} from './engine/Color.js';
import {Game} from './engine/Game.js';

import { Keyboard } from './engine/Keyboard.js';
import { Mouse } from './engine/Mouse.js';
import { Editor } from './editor/Editor.js';

let canvasElement = document.querySelector('#canvas');
let editor = new Editor({
    canvas: new Canvas({
        canvas: canvasElement,
        doResize:false
    }),
    keyboard: new Keyboard({}),
    mouse: new Mouse({canvas:canvasElement})
});
editor.init();
