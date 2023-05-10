class State {
    context;

    constructor(context) {
        if (this.constructor === State) {
            throw new Error("Can't instantiate abstract class!");
        }

        this.context = context;
    }

    onInit() {
        throw new Error("onInit not implemented");
    }

    onUpdate() {
        throw new Error("onUpdate not implemented");
    }

    onRender() {
        throw new Error("onRender not implemented");
    }
}

class StateManager {
    setState(newState) {
        this._state = newState;
        this._state.onInit();
    }
  
    onUpdate() {
        if(!this._state) throw new Error("State not defined please 'setState'");
        this._state.onUpdate();
    }
    
    onRender() {
        if(!this._state) throw new Error("State not defined please 'setState'");
        this._state.onRender();
    }
}

class StateInitStart extends State {

    constructor(context){
        super(context);
    }

    onInit() {}
    
    onUpdate() {
        console.log("StateInitStart.onUpdate");
        init_drivers();
        if (System.doesFileExist("login.json")) {
            let logfile = std.parseExtJSON(std.loadFile("login.json"));
            auth.login = logfile.login;
            auth.password = logfile.password;

            stateManager.setState(new StateInitLoginRequestInit(this.context));
        } else {
            stateManager.setState(new StateInitLoginInput(this.context));
        }
    }

    onRender() {}
}

class StateInitLoginInput extends State {

    constructor(context){
        super(context);
    }   

    onInit() {}
    
    onUpdate() {
        if (kbd_char != 0 && kbd_char != VK_RETURN && kbd_char != VK_RETURN && kbd_char != VK_LEFT && kbd_char != VK_RIGHT && kbd_char != VK_NEW_DOWN && kbd_char != VK_NEW_UP ){
            msg += String.fromCharCode(kbd_char);
        }

        if (kbd_char == VK_RETURN) {
            if(auth.login == "") {
                auth.login = msg;
            } else {
                auth.password = msg;
                stateManager.setState(new StateLoadWait(this.context));
            }

            msg = "";
        }

    }

    onRender() {
        font_bold.print(60, 83, msg);
    }
}

class StateInitLoginRequestInit extends State {

    constructor(context){
        super(context);
    }   

    onInit() {}
    
    onUpdate() {
        r.asyncPost("https://discordapp.com/api/auth/login", JSON.stringify(auth));
        stateManager.setState(new StateInitLoginRequestWait(this.context));
    }

    onRender() {}
}

class StateInitLoginRequestWait extends State {
    constructor(context){ super(context);}

    onInit() {}
    
    onUpdate() {
        if(r.ready(5)) { 
            stateManager.setState(new StateInitLoginRequestEnd(this.context));    
        }
    }
    
    onRender() {
        buttons_loading.draw(15, 400);
    }
}

class StateInitLoginRequestEnd extends State {
    constructor(context){ super(context);}

    onInit() {}
    
    onUpdate() {
        buttons_loading.reset();
        console.log("Packet size: " + r.getAsyncSize());
        r.headers = [`Authorization: ${std.parseExtJSON(r.getAsyncData()).token}`];
        
        stateManager.setState(new StateLoadInit(this.context));    
    }

    onRender() {}
}

class StateLoadInit extends State {

    constructor(context){
        super(context);
    }   

    onInit() {}
    
    onUpdate() {
        r.asyncGet("https://discordapp.com/api/users/@me/guilds");
        stateManager.setState(new StateLoadWait(this.context));
    }

    onRender() {}
}

class StateLoadWait extends State {
    constructor(context){ super(context);}

    onInit() {}
    
    onUpdate() {
        if(r.ready(5)) { 
            stateManager.setState(new StateLoadEnd(this.context));    
        }
    }
    
    onRender() {}
}

class StateLoadEnd extends State {
    constructor(context){ super(context);}

    onInit() {}
    
    onUpdate() {
        console.log("Packet size: " + r.getAsyncSize());
        servers = std.parseExtJSON(r.getAsyncData());
        
        stateManager.setState(new StateServerIdle(this.context));    
    }

    onRender() {}
}

class StateServerIdle extends State {
    constructor(context){ super(context);}

    onInit() {}
    
    onUpdate() {
        console.log("StateServerIdle.onUpdate")
        if(Pads.check(new_pad, Pads.UP) && !Pads.check(old_pad, Pads.UP) || old_kbd_char == VK_ACT && kbd_char == VK_NEW_UP) {
            servers.unshift(servers.pop());
        }
    
        if(Pads.check(new_pad, Pads.DOWN) && !Pads.check(old_pad, Pads.DOWN) || old_kbd_char == VK_ACT && kbd_char == VK_NEW_DOWN){
            servers.push(servers.shift());
        }

        if(Pads.check(new_pad, Pads.CROSS) && !Pads.check(old_pad, Pads.CROSS) || kbd_char == VK_RETURN){
            stateManager.setState(new StateServerLoadInit(this.context));    
        }
    }
    
    onRender() {
        console.log("StateServerIdle.onRender");
        font_medium.print(50, 125, servers[0].name);

        for(let i = 1; i < (servers.length < 10? servers.length : 10); i++) {
            font.print(50, 125+(23*i), servers[i].name);
        }   
    }
}

class StateServerLoadInit extends State {
    constructor(context){ super(context);}

    onInit() {}
    
    onUpdate() {
        r.asyncGet(`https://discordapp.com/api/guilds/${servers[0].id}/channels`);
        stateManager.setState(new StateServerLoadWait(this.context));
    }
    
    onRender() {}
}

class StateServerLoadWait extends State {
    constructor(context){ super(context);}

    onInit() {}
    
    onUpdate() {
        if(r.ready(5)) { 
            stateManager.setState(new StateServerLoadEnd(this.context));    
        }
    }
    
    onRender() {}
}

class StateServerLoadEnd extends State {
    constructor(context){ super(context);}

    onInit() {}
    
    onUpdate() {
        console.log("Packet size: " + r.getAsyncSize());
        channels = std.parseExtJSON(r.getAsyncData());
        
        stateManager.setState(new StateServerNavIdle(this.context));    
    }
    
    onRender() {}
}

class StateServerNavIdle extends State {
    constructor(context){ super(context);}

    onInit() {}
    
    onUpdate() {
        if(Pads.check(new_pad, Pads.UP) && !Pads.check(old_pad, Pads.UP) || old_kbd_char == VK_ACT && kbd_char == VK_NEW_UP) {
            channels.unshift(channels.pop());
        }

        if(Pads.check(new_pad, Pads.DOWN) && !Pads.check(old_pad, Pads.DOWN) || old_kbd_char == VK_ACT && kbd_char == VK_NEW_DOWN){
            channels.push(channels.shift());
        }

        if(Pads.check(new_pad, Pads.CROSS) && !Pads.check(old_pad, Pads.CROSS) || kbd_char == VK_RETURN){
            stateManager.setState(new StateServerNavLoadInit(this.context));    
        }
        
        if(Pads.check(new_pad, Pads.TRIANGLE) && !Pads.check(old_pad, Pads.TRIANGLE) || kbd_char == VK_BACKSPACE){
            stateManager.setState(new StateServerIdle(this.context));    
        }

    }
    
    onRender() {
        font_medium.print(50, 125, channels[0].name);

        for(let i = 1; i < (channels.length < 10? channels.length : 10); i++) {
            font.print(50, 125+(23*i), channels[i].name);
        }
    }
}

class StateServerNavLoadInit extends State {
    constructor(context){ super(context);}

    onInit() {}
    
    onUpdate() {
        r.asyncGet(`https://discordapp.com/api/channels/${channels[0].id}/messages`);
        stateManager.setState(new StateServerNavLoadWait(this.context));
    }
    
    onRender() {}
}

class StateServerNavLoadWait extends State {
    constructor(context){ super(context);}

    onInit() {}
    
    onUpdate() {
        if(r.ready(5)) { 
            stateManager.setState(new StateServerNavLoadEnd(this.context));    
        }
    }
    
    onRender() {}
}

class StateServerNavLoadEnd extends State {
    constructor(context){ super(context);}

    onInit() {}
    
    onUpdate() {
        ch_msgs = std.parseExtJSON(r.getAsyncData());
        stateManager.setState(new StateServerNavNavigation(this.context));    
    }
    
    onRender() {}
}

class StateServerNavNavigation extends State {
    constructor(context){ super(context);}

    onInit() {}
    
    onUpdate() {
        if(Pads.check(new_pad, Pads.TRIANGLE) && !Pads.check(old_pad, Pads.TRIANGLE) || kbd_char == VK_BACKSPACE){
            stateManager.setState(new StateServerNavIdle(this.context));    
        }

        if(Pads.check(new_pad, Pads.CROSS) && !Pads.check(old_pad, Pads.CROSS) || kbd_char == VK_RETURN){
            console.log(msg);
            r.asyncPost(`https://discordapp.com/api/channels/${channels[0].id}/messages`, `{"content": "${msg}", "tts": false}`);
            while(!r.ready(5)) {
                console.log("Waiting response...");
                System.sleep(5);
            }

            console.log(r.getAsyncData());
        }

        if (kbd_char != 0 && kbd_char != VK_RETURN && kbd_char != VK_RETURN && kbd_char != VK_LEFT && kbd_char != VK_RIGHT && kbd_char != VK_NEW_DOWN && kbd_char != VK_NEW_UP ){
            msg += String.fromCharCode(kbd_char);
        }
    }
    
    onRender() {
        const messageLimit = ch_msgs.length < 15? ch_msgs.length : 15;
        for(let i = 0; i < messageLimit; i++) {
            consola.print(50, 400-(15*i), ch_msgs[i].author.username + " | " + ch_msgs[i].content);
        }

        Draw.rect(50, 80, 300, 30, Color.new(64, 0, 128, 32));
        font_bold.print(60, 83, msg);
    }
}



function init_drivers() {
    IOP.reset();

    IOP.loadDefaultModule(IOP.pads);
    IOP.loadDefaultModule(IOP.boot_device);
    IOP.loadDefaultModule(IOP.keyboard);
    Keyboard.init();
    IOP.loadDefaultModule(IOP.network);
    Network.init();
}

const logo = new Image("img/logo.png");
logo.width *= 0.3f;
logo.height *= 0.3f;

const square = new Image("img/square.png");
const triangle = new Image("img/triangle.png");
const circle = new Image("img/circle.png");
const cross = new Image("img/cross.png");

class SeqLoading {
    padding;
    color;
    icons;
    drawn;

    constructor(icons) {
        this.icons = icons;
        this.padding = 20;
        this.color = Color.new(128, 128, 128, 128);

        this.reset();
    }

    setScale(s) {
        this.icons.forEach(img => {    img.width *= s; img.height *= s;    });
        this.padding *= s;
    }

    reset() {
        this.icons.forEach(img => {    img.color = this.color; img.color = Color.setA(img.color, 0);    });
        this.drawn = 0;
    }

    draw(posx, posy) {
        for (let i = 0; i < this.icons.length; i++) {
            if (Color.getA(this.icons[this.drawn].color) < Color.getA(this.color)) {
                this.icons[this.drawn].color = Color.setA(this.icons[this.drawn].color, (Color.getA(this.icons[this.drawn].color) + 1));
            } else {
                this.drawn++;
            }

            if (this.drawn == 4) {
                this.reset();
            } 

            this.icons[i].draw(posx, posy);

            posx += this.icons[i].width+this.padding;
        }
    }
};

const buttons_loading = new SeqLoading([triangle, circle, cross, square]);
buttons_loading.setScale(0.25f);
//buttons_loading.color = Color.new(64, 0, 128, 128);
buttons_loading.reset();


const unsel_color = Color.new(255, 255, 255, 64);
const sel_color = Color.new(255, 255, 255);

let consola = new Font("fonts/CONSOLA.TTF");
let font = new Font("fonts/LEMONMILK-Light.otf");
let font_medium = new Font("fonts/LEMONMILK-Medium.otf");
let font_bold = new Font("fonts/LEMONMILK-Bold.otf");
font.color = unsel_color;
font_bold.scale = 0.55f
font_medium.scale = 1.0f;
font.scale = 0.44f;
consola.scale = 0.35f;

let menu_ptr = 0;

let new_pad = Pads.get();
let old_pad = new_pad;

let old_kbd_char = 0;
let kbd_char = 0;

const VK_ACT = 27;
const VK_NEW_UP = 44;
const VK_NEW_DOWN = 43;
const VK_RIGHT = 41;
const VK_LEFT = 42;
const VK_RETURN = 10;
const VK_BACKSPACE = 7;

const ee_info = System.getCPUInfo();

const r = new Request();

var servers = undefined;
var channels = undefined;
var ch_msgs = undefined;

const STATE_INIT = 0;
const STATE_LOAD = 1;
const STATE_SERVERS = 2;
const STATE_FRIENDS = 3;

let app_state = STATE_INIT;

const INIT_START = 0;
const INIT_LOGIN_INPUT = 1;
const INIT_LOGIN_REQUEST = 2;
const INIT_END = 3;

let init_state = INIT_START;

const LOADING_INIT = 0;
const LOADING_WAIT = 1;
const LOADING_END = 2;

let loading_state = LOADING_INIT;

const SERVERS_IDLE = 0;
const SERVERS_LOAD = 1;
const SERVERS_NAVG = 2;
const SERVERS_BACK = 2;

let server_state = SERVERS_IDLE;

const SERVERS_NAV_IDLE = 0;
const SERVERS_NAV_LOAD = 1;
const SERVERS_NAV_NAVG = 2;
const SERVERS_NAV_BACK = 3;

let server_nav_state = SERVERS_NAV_IDLE;

var msg = "";

var stateManager = new StateManager();
stateManager.setState(new StateInitStart(globalThis));

const auth = {
    login: "",
    password: "",
    undelete: false,
    captcha_key: null,
    login_source: null,
    gift_code_sku_id: null
}

Screen.clear(0x80202020);
logo.draw(320-logo.width/2, 224-logo.height/2);
Screen.flip();

while(true) {
    old_pad = new_pad;
    new_pad = Pads.get();

    old_kbd_char = kbd_char;
    kbd_char = Keyboard.get();

    Screen.clear(0x80202020);

    font_bold.print(15, 5, "Discord for Playstation 2");
    
    // TODO: uncoment when the state manager get finished
    // stateManager.onUpdate();
    // stateManager.onRender();

    // TODO: Remove after state manager implementation
    switch(app_state) {
        case STATE_INIT:
            switch(init_state) {
                case INIT_START:
                    init_drivers();
                    if (System.doesFileExist("login.json")) {
                        let logfile = std.parseExtJSON(std.loadFile("login.json"));
                        auth.login = logfile.login;
                        auth.password = logfile.password;

                        init_state = INIT_LOGIN_REQUEST;
                        
                    } else {
                        init_state++;
                    }
                    
                    break;
                case INIT_LOGIN_INPUT:
                    if (kbd_char != 0 && kbd_char != VK_RETURN && kbd_char != VK_RETURN && kbd_char != VK_LEFT && kbd_char != VK_RIGHT && kbd_char != VK_NEW_DOWN && kbd_char != VK_NEW_UP ){
                        msg += String.fromCharCode(kbd_char);
                    }

                    if (kbd_char == VK_RETURN) {
                        if(auth.login == "") {
                            auth.login = msg;
                        } else {
                            auth.password = msg;
                            init_state++;
                        }

                        msg = "";
                    }

                    font_bold.print(60, 83, msg);

                    break;

                case INIT_LOGIN_REQUEST:
                    switch(loading_state) {
                        case LOADING_INIT:
                            r.asyncPost("https://discordapp.com/api/auth/login", JSON.stringify(auth));
                            loading_state++;
                            break;
                        case LOADING_WAIT:
                            buttons_loading.draw(15, 400);
                            if(r.ready(5)) {
                                loading_state++;
                            }
                            break;
                        case LOADING_END:
                            buttons_loading.reset();
                            console.log("Packet size: " + r.getAsyncSize());
                            r.headers = [`Authorization: ${std.parseExtJSON(r.getAsyncData()).token}`];
                            loading_state = LOADING_INIT;
                            init_state++;
                            app_state++;
                            break;
                    }
        
                    break;
            }

            break;
        case STATE_LOAD:
            switch(loading_state) {
                case LOADING_INIT:
                    r.asyncGet("https://discordapp.com/api/users/@me/guilds");
                    loading_state++;
                    break;
                case LOADING_WAIT:
                    buttons_loading.draw(15, 400);
                    if(r.ready(5)) {
                        loading_state++;
                    }
                    break;
                case LOADING_END:
                    buttons_loading.reset();
                    console.log("Packet size: " + r.getAsyncSize());
                    channels = std.parseExtJSON(r.getAsyncData());
                    loading_state = LOADING_INIT;
                    app_state++;
                    break;
            }
            break;
        case STATE_SERVERS:
            switch (server_state) {
                case SERVERS_IDLE:
                    if(Pads.check(new_pad, Pads.UP) && !Pads.check(old_pad, Pads.UP) || old_kbd_char == VK_ACT && kbd_char == VK_NEW_UP) {
                        channels.unshift(channels.pop());
                    }
                
                    if(Pads.check(new_pad, Pads.DOWN) && !Pads.check(old_pad, Pads.DOWN) || old_kbd_char == VK_ACT && kbd_char == VK_NEW_DOWN){
                        channels.push(channels.shift());
                    }

                    if(Pads.check(new_pad, Pads.CROSS) && !Pads.check(old_pad, Pads.CROSS) || kbd_char == VK_RETURN){
                        server_state++; 
                    }

                    font_medium.print(50, 125, channels[0].name);

                    for(let i = 1; i < (channels.length < 10? channels.length : 10); i++) {
                        font.print(50, 125+(23*i), channels[i].name);
                    }

                    break;

                case SERVERS_LOAD:
                    switch(loading_state) {
                        case LOADING_INIT:
                            r.asyncGet(`https://discordapp.com/api/guilds/${channels[0].id}/channels`);
                            loading_state++;
                            break;
                        case LOADING_WAIT:
                            buttons_loading.draw(15, 400);
                            if(r.ready(5)) {
                                loading_state++;
                            }
                            break;
                        case LOADING_END:
                            buttons_loading.reset();
                            channels = std.parseExtJSON(r.getAsyncData());
                            loading_state = LOADING_INIT;
                            server_state++;
                            break;
                    }
                    break;
                case SERVERS_NAVG:
                    switch(server_nav_state) {
                        case SERVERS_NAV_IDLE:
                            if(Pads.check(new_pad, Pads.UP) && !Pads.check(old_pad, Pads.UP) || old_kbd_char == VK_ACT && kbd_char == VK_NEW_UP) {
                                channels.unshift(channels.pop());
                            }
                        
                            if(Pads.check(new_pad, Pads.DOWN) && !Pads.check(old_pad, Pads.DOWN) || old_kbd_char == VK_ACT && kbd_char == VK_NEW_DOWN){
                                channels.push(channels.shift());
                            }
        
                            if(Pads.check(new_pad, Pads.CROSS) && !Pads.check(old_pad, Pads.CROSS) || kbd_char == VK_RETURN){
                                server_nav_state++;
                            }
        
                            if(Pads.check(new_pad, Pads.TRIANGLE) && !Pads.check(old_pad, Pads.TRIANGLE) || kbd_char == VK_BACKSPACE){
                                server_state = SERVERS_IDLE;
                                app_state = STATE_LOAD;
                            }

                            for(let i = 1; i < (channels.length < 10? channels.length : 10); i++) {
                                font.print(50, 125+(23*i), channels[i].name);
                            }

                            break;

                        case SERVERS_NAV_LOAD:
                            switch(loading_state) {
                                case LOADING_INIT:
                                    r.asyncGet(`https://discordapp.com/api/channels/${channels[0].id}/messages`);
                                    loading_state++;
                                    break;
                                case LOADING_WAIT:
                                    buttons_loading.draw(15, 400);
                                    if(r.ready(5)) {
                                        loading_state++;
                                    }
                                    break;
                                case LOADING_END:
                                    buttons_loading.reset();
                                    ch_msgs = std.parseExtJSON(r.getAsyncData());
                                    loading_state = LOADING_INIT;
                                    server_nav_state++;
                                    break;
                            }
                            break;
                        case SERVERS_NAV_NAVG:

                            for(let i = 0; i < (ch_msgs.length < 15? ch_msgs.length : 15); i++) {
                                consola.print(50, 400-(15*i), ch_msgs[i].author.username + " | " + ch_msgs[i].content);
                            }

                            if(Pads.check(new_pad, Pads.TRIANGLE) && !Pads.check(old_pad, Pads.TRIANGLE) || kbd_char == VK_BACKSPACE){
                                server_nav_state++;
                            }

                            if(Pads.check(new_pad, Pads.CROSS) && !Pads.check(old_pad, Pads.CROSS) || kbd_char == VK_RETURN){
                                console.log(msg);
                                r.asyncPost(`https://discordapp.com/api/channels/${channels[0].id}/messages`, `{"content": "${msg}", "tts": false}`);
                                while(!r.ready(5)) {
                                    console.log("Waiting response...");
                                    System.sleep(5);
                                }

                                console.log(r.getAsyncData());
                                
                                
                            }

                            if (kbd_char != 0 && kbd_char != VK_RETURN && kbd_char != VK_RETURN && kbd_char != VK_LEFT && kbd_char != VK_RIGHT && kbd_char != VK_NEW_DOWN && kbd_char != VK_NEW_UP ){
                                msg += String.fromCharCode(kbd_char);
                            }

                            Draw.rect(50, 80, 300, 30, Color.new(64, 0, 128, 32));
                            font_bold.print(60, 83, msg);


                            break;
                        case SERVERS_NAV_BACK:
                            server_nav_state = SERVERS_NAV_IDLE;
                            server_state = SERVERS_LOAD;
                            break;

                    }

                    font_medium.print(50, 125, channels[0].name);



                    break;
            }

            break;
        case STATE_FRIENDS:
            break;
    }

    font.print(15, 420, `Temp: ${System.getTemperature() === undefined? "NaN" : System.getTemperature()} C | RAM Usage: ${Math.floor(System.getMemoryStats().used / 1024)}KB / ${Math.floor(ee_info.RAMSize / 1024)}KB`);

    Screen.flip();
}
