import { LevelObject } from "./LevelObject.js";
import { Game } from "../engine/Game.js";
import { Vec2d } from "../engine/Vec2d.js";

const MODE_ADD_RECT_OBJECT = 1;
const MODE_ADD_POINT_OBJECT = 2;

const CLICK_MODE_ADD = 1;
const CLICK_MODE_EDIT = 2;
const CLICK_MODE_REMOVE = 3;
const CLICK_MODE_NOTHING = 4;

const types = {
    floor: {color:'#aaaaff', mode: MODE_ADD_RECT_OBJECT},
    wall: {color:'#ffaaff', mode: MODE_ADD_RECT_OBJECT},
    jumppad: {color:'#ff9999', mode: MODE_ADD_RECT_OBJECT},
    spikes: {color:'#999999', mode: MODE_ADD_RECT_OBJECT},
    door: {color:'#aa5500', mode: MODE_ADD_RECT_OBJECT},
    key: {color:'#ffffff', mode: MODE_ADD_POINT_OBJECT},
    player: {color:'#ff5555', mode: MODE_ADD_POINT_OBJECT},
    hourglass: {color:'#ffff00', mode: MODE_ADD_POINT_OBJECT},
    text: {color:'#aaaaaa', mode: MODE_ADD_POINT_OBJECT},
}
function swap(obj){
    var result = {};
    for(var key in obj){
        result[obj[key]] = key;
    }
    return result;
}
const typeToSaveKey = {
    floor:'f',
    wall:'w',
    jumppad:'j',
    spikes:'s',
    player:'p',
    hourglass:'h',
    text:'t',
    door:'d',
    key:'k'
}

const saveKeyToType = swap(typeToSaveKey);
class Level {
    constructor(levelData) {
        this.levelData = levelData || "";
    }
}
export class Editor extends Game {
    constructor(obj) {
        super(obj);

        this.workSprite = null;

        this.mode = MODE_ADD_RECT_OBJECT;
        this.type = "floor";
        this.clickType = CLICK_MODE_ADD;

        let editor = this;
        this.mouse.subscribe('down', m=>editor.onMouseDown(m));
        this.mouse.subscribe('up', m=>editor.onMouseUp(m));
        this.mouse.subscribe('move', m=>editor.onMouseMove(m));

        this.keyboard.addKeyAction('KeyI', 'debug');
        this.keyboard.subscribe('debug', k=>editor.onDebug(k));

        Array.from(document.querySelectorAll('.clickType')).forEach(
            btn=> btn.addEventListener("click", (ev)=>editor.onClickTypeSelect(ev.target.value))
        );
        Array.from(document.querySelectorAll('.objectType')).forEach(
            btn=> btn.addEventListener("click", (ev)=>editor.onTypeSelect(ev.target.value))
        );

        this.editorFields = {};
        Array.from(document.querySelectorAll('.editfield')).forEach(f => {
            let fieldname = f.getAttribute('field');
            this.editorFields[fieldname] = f;
        });
        document.querySelector('.editStore').addEventListener("click", (ev) => editor.storeData());

        this.currentDraggedObj = null;
        this.dragHandlePos = null;

        this.levels = [new Level(),new Level()];
        this.levelFieldset = document.querySelector('#levels');
        this.currentLevelIdx = 0;
        this.initLevelButtons();
        this.loadLevel();
        
        document.getElementById('saveLevel').addEventListener("click", (ev)=>editor.onSaveLevel());
        document.getElementById('addLevel').addEventListener("click", (ev) => editor.onAddLevel());
        document.getElementById('delLevel').addEventListener("click", (ev) => editor.onDelLevel());

        
        document.getElementById('loadData').addEventListener("click", (ev) => editor.onLoadData());
        document.getElementById('saveData').addEventListener("click", (ev) => editor.onSaveData());
        this.dataPopup = document.getElementById('importexport');
        this.dataTextarea = document.getElementById('data');
        
        document.getElementById('loadDataFromText').addEventListener("click", (ev) => editor.onLoadDataFromText());
        document.getElementById('closePopup').addEventListener("click", (ev) => editor.onClosePopup());

        
        let levelsString = localStorage.getItem('levelsString');
        if(levelsString) {
            this.dataTextarea.value = levelsString;
            this.onLoadDataFromText();
        }
    }

    onLoadData() {
        this.clickType = CLICK_MODE_NOTHING;
        this.dataPopup.classList.remove('hidden');
        this.dataTextarea.select();
    }
    onLoadDataFromText() {
        this.levels = this.dataTextarea.value.split('\n#\n').map(l=> new Level(l));
        this.currentLevelIdx = 0;
        this.initLevelButtons();
        this.loadLevel();
        this.onClosePopup();
    }
    onClosePopup() {
        this.dataTextarea.value = "";
        this.dataPopup.classList.add('hidden');
        this.onClickTypeSelect(CLICK_MODE_ADD);
    }
    onSaveData() {
        this.clickType = CLICK_MODE_NOTHING;
        this.dataPopup.classList.remove('hidden');
        let levelsString = this.levels.map(l => l.levelData).join('\n#\n');
        this.dataTextarea.value = levelsString;
        localStorage.setItem('levelsString', levelsString);
        this.dataTextarea.select();
    }
    onAddLevel() {
        this.levels.push(new Level());
        this.initLevelButtons();
    }
    onDelLevel() {
        if(this.levels.length == 1) {
            this.levels[0].levelData = "";
            this.loadLevel();
            return;
        }
        this.levels.splice(this.currentLevelIdx, 1);
        if(this.currentLevelIdx > this.levels.length -1) {
            this.currentLevelIdx = this.levels.length -1;
        }
        this.initLevelButtons();
        this.loadLevel();
    }

    initLevelButtons() {
        Array.from(document.querySelectorAll('.levelbutton')).forEach(f => f.parentNode.removeChild(f));
        this.levels.forEach((l, i) => {
            this.levelFieldset.appendChild(this.createLevelButton(i+1))
        });
    }

    createLevelButton(number) {
        let editor = this;
        let btn = document.createElement('button');
        btn.classList.add('levelbutton');
        if(number - 1 == this.currentLevelIdx) {
            btn.classList.add('selected');
        }
        btn.setAttribute('idx', number - 1);
        btn.setAttribute('number', number);
        btn.innerText = number;
        btn.addEventListener("click", (ev) => editor.activateLevel(ev.target));
        return btn;
    }

    activateLevel(btn) {
        this.currentLevelIdx = btn.getAttribute('idx');
        Array.from(document.querySelectorAll('.levelbutton')).forEach(f => {
            if(f.getAttribute('idx') == this.currentLevelIdx) {
                f.classList.add('selected');
            }  else { 
                f.classList.remove('selected');
            }
        });
        this.loadLevel();
        
    }

    onClickTypeSelect(type) {
        this.clickType = type;
        Array.from(document.querySelectorAll('.clickType')).forEach(
            btn => {
                if(btn.value == this.clickType) {
                    btn.classList.add('selected');
                } else {
                    btn.classList.remove('selected');
                }
            }
        );
    }

    onTypeSelect(type) {
        this.mode = types[type].mode;
        this.type = type;
        this.onClickTypeSelect(CLICK_MODE_ADD);
        Array.from(document.querySelectorAll('.objectType')).forEach(
            btn => {
                if(btn.value == this.type) {
                    btn.classList.add('selected');
                } else {
                    btn.classList.remove('selected');
                }
            }
        );
    }

    onDebug(k) {
        console.log(this);
    }
    onSaveLevel() {
        let data = this.sprites.level.map(s=> {
            console.log(s);
            let sData = [];
            if(s.type == 'player') {
                sData = [
                    typeToSaveKey[s.type],
                    s.pos.x,
                    s.pos.y
                ];
            } else if(s.type == 'hourglass') {
                sData = [
                    typeToSaveKey[s.type],
                    s.pos.x,
                    s.pos.y,
                    s.data.time
                ];
            } else if(s.type == 'text') {
                sData = [
                    typeToSaveKey[s.type],
                    s.pos.x,
                    s.pos.y,
                    s.data.text,
                    s.data.time,
                    s.data.textsize
                ];
            } else if(s.type == 'jumppad') {
                sData = [
                    typeToSaveKey[s.type],
                    s.pos.x,
                    s.pos.y,
                    s.rect.x,
                    s.rect.y,
                    s.data.jumpforce
                ];
            } else if(s.type == 'door') {
                sData = [
                    typeToSaveKey[s.type],
                    s.pos.x,
                    s.pos.y,
                    s.rect.x,
                    s.rect.y,
                    s.data.lock
                ];
            } else if(s.type == 'spikes') {
                sData = [
                    typeToSaveKey[s.type],
                    s.pos.x,
                    s.pos.y,
                    s.rect.x,
                    s.rect.y,
                    s.data.directionUp ? "1" : "0"
                ];
            } else if(s.type == 'key') {
                sData = [
                    typeToSaveKey[s.type],
                    s.pos.x,
                    s.pos.y,
                    s.data.unlocking
                ];
            }  else {
                sData = [
                    typeToSaveKey[s.type],
                    s.pos.x,
                    s.pos.y,
                    s.rect.x,
                    s.rect.y
                ];
            }
            return sData.join("~");
        });
        this.levels[this.currentLevelIdx].levelData = data.join("§");
    }

    loadLevel() {
        let levelData = this.levels[this.currentLevelIdx].levelData;
        if(this.sprites.level) {
            this.sprites.level = [];
        }
        levelData.split("§").forEach(oString =>{
            if(!oString) {
                return;
            }
            let oData = oString.split("~");
            let type = saveKeyToType[oData[0]];
            let obj = {
                type: type,
                color: types[type].color,
                pos: new Vec2d({x:oData[1] * 1, y: oData[2] * 1})
            };
            
            switch(type) {
                case "player":
                break;
                case "hourglass":
                    obj.time = oData[3] * 1;
                break;
                case "text":
                    obj.text = oData[3];
                    obj.time = oData[4] * 1;
                    obj.textsize = oData[5];
                break;
                case "jumppad":
                    obj.rect = new Vec2d({x:oData[3] * 1, y: oData[4] * 1});
                    obj.jumpforce = oData[5] * 1;
                break;
                case "door":
                    obj.rect = new Vec2d({x:oData[3] * 1, y: oData[4] * 1});
                    obj.lock = oData[5];
                break;
                case "spikes":
                    obj.rect = new Vec2d({x:oData[3] * 1, y: oData[4] * 1});
                    obj.directionUp = oData[5] == 1;
                break;
                case "key":
                    obj.unlocking = oData[3];
                break;
                default:
                    obj.rect = new Vec2d({x:oData[3] * 1, y: oData[4] * 1});
                break;
            }
            this.addSpriteToLayer(new LevelObject(obj), "level");
        });
    }


    storeData() {
        let obj = this.sprites.level.find(s => s.highlighted);
        if(['hourglass', 'text'].indexOf(obj.type) > -1) {
            obj.data.time = this.editorFields.time.value * 1;
        }
        if(['jumppad'].indexOf(obj.type) > -1) {
            obj.data.jumpforce = this.editorFields.jumpforce.value * 1;
        }
        if(['text'].indexOf(obj.type) > -1) {
            obj.data.text = this.editorFields.text.value;
            obj.data.textsize = this.editorFields.textsize.value;
        }
        if(['door'].indexOf(obj.type) > -1) {
            obj.data.lock = this.editorFields.lock.value;
        }
        if(['key'].indexOf(obj.type) > -1) {
            obj.data.unlocking = this.editorFields.lock.value;
        }
        if(['spikes'].indexOf(obj.type) > -1) {
            obj.data.directionUp = this.editorFields.directionUp.checked;
        }
        this.sprites.level.forEach(s => {
            s.highlighted = false;
            s.highlightColor = "";
        });
    }

    

    onMouseDown(m) {
        if(this.clickType == CLICK_MODE_NOTHING) {
           return;
        } else if(this.clickType == CLICK_MODE_ADD) {
            this.onMouseDownAdd(m);
        } else if(this.clickType == CLICK_MODE_EDIT) {
            this.onMouseDownEdit(m);
        } else if(this.clickType == CLICK_MODE_REMOVE) {
            this.onMouseDownRemove(m);
        }
    }

    onMouseDownEdit(m) {
        let obj = this.sprites.level.find(s => (s.pos.x <= m.pos.x && s.pos.x + s.rect.x >= m.pos.x
                && s.pos.y <= m.pos.y && s.pos.y + s.rect.y >= m.pos.y
            ));
        if(!obj) {
            return;
        }

        this.currentDraggedObj = obj;
        this.dragHandlePos = new Vec2d(m.pos.diff(obj.pos));

        this.sprites.level.forEach(s => {
            s.highlighted = false;
            s.highlightColor = "";
        });
        if(['hourglass', 'text', 'jumppad', 'door', 'key','spikes'].indexOf(obj.type) > -1) {
            obj.highlighted = true;
            obj.highlightColor = "green";
            this.editorFields.time.value = obj.data.time ? obj.data.time : "";
            this.editorFields.text.value = obj.data.text ? obj.data.text : "";
            this.editorFields.textsize.value = obj.data.textsize ? obj.data.textsize : "12";
            this.editorFields.jumpforce.value = obj.data.jumpforce ? obj.data.jumpforce : "1.7";
            this.editorFields.lock.value = obj.data.jumpforce ? obj.data.jumpforce : "1.7";
            this.editorFields.directionUp.checked = obj.data.directionUp === true;
        }
        if(['door'].indexOf(obj.type) > -1) {
            this.editorFields.lock.value = obj.data.lock ? obj.data.lock : "allLocks";
        }
        if(['key'].indexOf(obj.type) > -1) {
            this.editorFields.lock.value = obj.data.unlocking ? obj.data.unlocking : "allLocks";
        }
    }

    onMouseDownRemove(m) {
        this.sprites.level = this.sprites.level.filter(s => !(s.pos.x <= m.pos.x && s.pos.x + s.rect.x >= m.pos.x
                && s.pos.y <= m.pos.y && s.pos.y + s.rect.y >= m.pos.y
            ));
    }

    onMouseDownAdd(m) {
        if(m.pos.x < 0 || m.pos.x > this.canvas.width || m.pos.y < 0 || m.pos.y > this.canvas.height) {
            return;
        }
        if(this.mode == MODE_ADD_RECT_OBJECT || this.mode == MODE_ADD_POINT_OBJECT) {
            this.workSprite = this.addSpriteToLayer(new LevelObject({
                x:m.pos.x,
                y:m.pos.y, 
                type:this.type,
                color: types[this.type].color
            }), "level");
        }
        if(this.mode == MODE_ADD_POINT_OBJECT) {
            this.workSprite = null;
        }
    }
    onMouseUp(m) {
        this.currentDraggedObj = null;
        this.dragHandlePos = null;
        if(this.clickType == CLICK_MODE_ADD && this.mode == MODE_ADD_RECT_OBJECT && this.workSprite) {
            let dim = m.pos.diff(m.downPos);
            if(dim.x < 0) {
                dim.x *= -1;
                this.workSprite.pos.x -= dim.x;
            }
            if(dim.y < 0) {
                dim.y *= -1;
                this.workSprite.pos.y -= dim.y;
            }
            this.workSprite.rect.x = dim.x;
            this.workSprite.rect.y = dim.y;
            if(this.workSprite.rect.x == 0 || this.workSprite.rect.y == 0) {
                this.sprites.level = this.sprites.level.filter(s => s !== this.workSprite);
            }
            this.workSprite = null;
        }
    }
    onMouseMove(m) {
        if(this.clickType == CLICK_MODE_ADD && this.workSprite) {
            let dim = m.pos.diff(m.downPos);
            this.workSprite.rect.x = dim.x;
            this.workSprite.rect.y = dim.y;
        }
        if(this.clickType == CLICK_MODE_REMOVE) {
            this.sprites.level.forEach(s => {
                if(s.pos.x <= m.pos.x && s.pos.x + s.rect.x >= m.pos.x
                   && s.pos.y <= m.pos.y && s.pos.y + s.rect.y >= m.pos.y
                ) {
                    s.highlighted = true;
                    s.highlightColor = "red";
                } else {
                    s.highlighted = false;
                    s.highlightColor = "";
                }
            });
        }
        if(this.clickType == CLICK_MODE_EDIT && this.currentDraggedObj) {
            this.currentDraggedObj.pos.x = m.pos.x - this.dragHandlePos.x;
            this.currentDraggedObj.pos.y = m.pos.y - this.dragHandlePos.y;
        }
    }

} 