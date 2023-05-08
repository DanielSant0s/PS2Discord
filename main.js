IOP.reset();

IOP.loadDefaultModule(IOP.pads);
IOP.loadDefaultModule(IOP.boot_device);
IOP.loadDefaultModule(IOP.keyboard);
Keyboard.init();
IOP.loadDefaultModule(IOP.network);
Network.init();

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

var ee_info = System.getCPUInfo();

const r = new Request();
r.headers = [`Authorization: ${std.loadFile("token.txt")}`];

r.asyncGet("https://discordapp.com/api/users/@me/guilds");

while(!r.ready(2)) {
    console.log("Waiting... " + r.getAsyncSize() + " bytes transfered");
    System.sleep(2); 
}

let channels = std.parseExtJSON(r.getAsyncData());

console.log(JSON.stringify(channels[0]));

r.asyncGet("https://discordapp.com/api/users/@me/relationships");

while(!r.ready(2)) {
    console.log("Waiting... " + r.getAsyncSize() + " bytes transfered");
    System.sleep(2); 
}

let connections = std.parseExtJSON(r.getAsyncData()).map( item => {  return {name: item.user.username} } );

console.log(JSON.stringify(connections[0]));

while(true) {
    old_pad = new_pad;
    new_pad = Pads.get();

    old_kbd_char = kbd_char;
    kbd_char = Keyboard.get();

    Screen.clear(0x80202020);

    font_bold.print(15, 5, "Discord for Playstation 2");

    if(Pads.check(new_pad, Pads.UP) && !Pads.check(old_pad, Pads.UP) || old_kbd_char == VK_ACT && kbd_char == VK_NEW_UP) {
        channels.unshift(channels.pop());
        console.log(JSON.stringify(channels[0]));

    }

    if(Pads.check(new_pad, Pads.DOWN) && !Pads.check(old_pad, Pads.DOWN) || old_kbd_char == VK_ACT && kbd_char == VK_NEW_DOWN){
        channels.push(channels.shift());
        console.log(JSON.stringify(channels[0]));
    }

    if(old_kbd_char == VK_ACT && kbd_char == VK_RIGHT){
        channels = connections;
    }

    if(Pads.check(new_pad, Pads.CROSS) && !Pads.check(old_pad, Pads.CROSS) || kbd_char == VK_RETURN){
        r.asyncGet(`https://discordapp.com/api/guilds/${channels[0].id}/channels`);

        while(!r.ready(2)) {
            console.log("Waiting... " + r.getAsyncSize() + " bytes transfered");
            System.sleep(2); 
        }
        
        channels = std.parseExtJSON(r.getAsyncData());
        
    }

    if(Pads.check(new_pad, Pads.DOWN) && !Pads.check(old_pad, Pads.DOWN) || old_kbd_char == VK_ACT && kbd_char == VK_NEW_DOWN){
        channels.push(channels.shift());
        console.log(JSON.stringify(channels[0]));
    }

    font_medium.print(50, 125, channels[0].name);

    for(let i = 1; i < (channels.length < 10? channels.length : 10); i++) {
        font.print(50, 125+(23*i), channels[i].name);
    }

    font.print(15, 420, `Temp: ${System.getTemperature() === undefined? "NaN" : System.getTemperature()} C | RAM Usage: ${Math.floor(System.getMemoryStats().used / 1048576)}MB / ${Math.floor(ee_info.RAMSize / 1048576)}MB`);

    Screen.flip();
}
