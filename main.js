

function init_drivers() {
    IOP.reset();

    IOP.loadDefaultModule(IOP.pads);
    IOP.loadDefaultModule(IOP.boot_device);
    IOP.loadDefaultModule(IOP.keyboard);
    Keyboard.init();
    IOP.loadDefaultModule(IOP.network);
    Network.init();
}

const unsel_color = Color.new(255, 255, 255, 64);
const sel_color = Color.new(255, 255, 255);

let font = new Font("fonts/LEMONMILK-Light.otf");
let font_medium = new Font("fonts/LEMONMILK-Medium.otf");
let font_bold = new Font("fonts/LEMONMILK-Bold.otf");
font.color = unsel_color;
font_bold.scale = 0.55f
font_medium.scale = 1.0f;
font.scale = 0.44f;

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
r.headers = [`Authorization: ${std.loadFile("token.txt")}`];

var channels = undefined;

const STATE_INIT = 0;
const STATE_LOAD = 1;
const STATE_SERVERS = 2;
const STATE_FRIENDS = 3;

let app_state = STATE_INIT;

const LOADING_INIT = 0;
const LOADING_WAIT = 1;
const LOADING_END = 2;

let loading_state = LOADING_INIT;

const SERVERS_IDLE = 0;
const SERVERS_LOAD = 1;
const SERVERS_NAVG = 2;
const SERVERS_BACK = 2;

let server_state = SERVERS_IDLE;

while(true) {
    old_pad = new_pad;
    new_pad = Pads.get();

    old_kbd_char = kbd_char;
    kbd_char = Keyboard.get();

    Screen.clear(0x80202020);

    font_bold.print(15, 5, "Discord for Playstation 2");

    switch(app_state) {
        case STATE_INIT:
            init_drivers();
            app_state++;
            break;
        case STATE_LOAD:
            switch(loading_state) {
                case LOADING_INIT:
                    r.asyncGet("https://discordapp.com/api/users/@me/guilds");
                    loading_state++;
                    break;
                case LOADING_WAIT:
                    if(r.ready(5)) {
                        loading_state++;
                    }
                    break;
                case LOADING_END:
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
                            if(r.ready(2)) {
                                loading_state++;
                            }
                            break;
                        case LOADING_END:
                            channels = std.parseExtJSON(r.getAsyncData());
                            loading_state = LOADING_INIT;
                            server_state++;
                            break;
                    }
                    break;
                case SERVERS_NAVG:
                    if(Pads.check(new_pad, Pads.UP) && !Pads.check(old_pad, Pads.UP) || old_kbd_char == VK_ACT && kbd_char == VK_NEW_UP) {
                        channels.unshift(channels.pop());
                    }
                
                    if(Pads.check(new_pad, Pads.DOWN) && !Pads.check(old_pad, Pads.DOWN) || old_kbd_char == VK_ACT && kbd_char == VK_NEW_DOWN){
                        channels.push(channels.shift());
                    }

                    if(Pads.check(new_pad, Pads.CROSS) && !Pads.check(old_pad, Pads.CROSS) || kbd_char == VK_RETURN){
                    }

                    if(Pads.check(new_pad, Pads.TRIANGLE) && !Pads.check(old_pad, Pads.TRIANGLE) || kbd_char == VK_BACKSPACE){
                        server_state = SERVERS_IDLE;
                        app_state = STATE_LOAD;
                    }

                    font_medium.print(50, 125, channels[0].name);

                    for(let i = 1; i < (channels.length < 10? channels.length : 10); i++) {
                        font.print(50, 125+(23*i), channels[i].name);
                    }

                    break;
            }

            break;
        case STATE_FRIENDS:
            break;
    }

    font.print(15, 420, `Temp: ${System.getTemperature() === undefined? "NaN" : System.getTemperature()} C | RAM Usage: ${Math.floor(System.getMemoryStats().used / 1048576)}MB / ${Math.floor(ee_info.RAMSize / 1048576)}MB`);

    Screen.flip();
}
