export class Keyboard {
    constructor(actionmapping) {
        this.keystates = {};
        this.actionmapping = actionmapping || {};
        this.actionstates = {};
        this.subscribers = {};
        let keyboard = this;
        document.addEventListener('keydown', (e) => keyboard.onKeyDown(e));
        document.addEventListener('keyup', (e) => keyboard.onKeyUp(e));
    }

    addKeyAction(keyCode, actionCode) {
        this.actionmapping[keyCode] = actionCode;
    }

    removeKey(keyCode) {
        delete this.actionmapping[keyCode];
    }

    subscribe(actionCode, callback) {
        if(!this.subscribers[actionCode]) {
            this.subscribers[actionCode] = [];
        }
        this.subscribers[actionCode].push(callback);
    }

    notifySubscribers(actionCode) {
        if(this.subscribers[actionCode]) {
            this.subscribers[actionCode].forEach(callback => callback(this));
        }
    }

    _handlekey(keycode, state) {
        this.keystates[keycode] = state;
        if(this.actionmapping[keycode] !== undefined) {
            let actionCode = this.actionmapping[keycode];
            this.actionstates[actionCode] = state;
            if(state) {
                this.notifySubscribers(actionCode);
            }
        }
    }

    onKeyDown(e) {
        this._handlekey(e.code, true);
    }

    onKeyUp(e) {
        this._handlekey(e.code, false);
    }

    keyPressed(code) {
        return this.keyboard[code];
    }

    actionPressed(action) {
        return this.actionstates[action];
    }

}