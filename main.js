// TODO: move auth data to UserData class
class UserData {
    /**
     * @property
     * @returns Array of Guild of the logged user
     */
    guilds = [];

    selectedGuild = null;
    selectedCategory = null;
    selectedChannel = null;
}

/**
 * class Guild
 * @summary Based on https://discord.com/developers/docs/resources/guild#guild-resource
 */
class Guild {
    id = null;
    name = null;
    icon = null;

    imageIcon = null;

    categories = [];
    channels = [];
    
    constructor(id){
        this.id = id;
    }
}

/**
 * class ChannelCategory
 * @summary Based on https://discord.com/developers/docs/resources/channel#channel-object
 */
class ChannelCategory {
    id = null;
    type = null;
    name = null;
    position = null;
    
    constructor(id){
        this.id = id;
    }
}

/**
 * class Channel
 * @summary Based on https://discord.com/developers/docs/resources/channel#channel-object
 */
class Channel {
    id = null;
    type = null;
    name = null;
    position = null;
    parent_id = null;
    guild_id = null;

    /** 
     * @property messages
     * @returns array of Message
     */
    messages = [];

    constructor(id){
        this.id = id;
    }
}

/**
 * class Message
 * @summary Based on https://discord.com/developers/docs/resources/channel#message-object
 */
class Message {
    id = null;
    channel_id = null;
    timestamp = null;
    position = null;
    content = '';
    author = null;

    constructor(id){
        this.id = id;
    }
}


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

    onInit() {
        init_drivers();
    }
    
    onUpdate() {
        if (tryToLogInByToken() || tryToLogInByLogin()) {
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
        if(r.ready()) { 
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
        
        stateManager.setState(new StateLoadGuildsInit(this.context));    
    }

    onRender() {}
}

class StateLoadGuildsInit extends State {

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
        if(r.ready()) { 
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
        const rawGuilds = std.parseExtJSON(r.getAsyncData());
        userData.guilds = rawGuilds
            .sort((gA, gB) => gA.position - gB.position)
            .map(g => {
                const _g = new Guild(g.id);
                _g.name = g.name;
                _g.icon = g.icon;
                return _g;
            });
        stateManager.setState(new StateLoadGuildIcons(this.context));    
    }

    onRender() {}
}

class StateLoadGuildIcons extends State {
    constructor(context){ super(context);}

    onInit() {
        buttons_loading.reset();
    }
    
    onUpdate() {
        if(r.ready(2, 2)) {
            console.log("StateLoadGuildIcons.onUpdate");
            for (let index = 0; index < userData.guilds.length; index++) {
                const imageSize = 32;
                const guild = userData.guilds[index];
                const fname = `cache/${guild.icon}.png`;
                const url = `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=${imageSize}`;

                if(System.doesFileExist(fname)) {
                    guild.imageIcon = new Image(fname, VRAM); 
                    continue;
                }
                    
                console.log("Downloading icon -> ", guild.icon, "from: ", url);
                r.asyncDownload(url, fname);
                return;
            }

            stateManager.setState(new StateServerIdle(this.context));
        }
    }

    onRender() {
        buttons_loading.draw(15, 400);
    }
}

class StateServerIdle extends State {
    constructor(context){ super(context);}

    onInit() {}
    
    onUpdate() {
        if(Pads.check(new_pad, Pads.UP) && !Pads.check(old_pad, Pads.UP) || old_kbd_char == VK_ACT && kbd_char == VK_NEW_UP) {
            userData.guilds.unshift(userData.guilds.pop());
        }
    
        if(Pads.check(new_pad, Pads.DOWN) && !Pads.check(old_pad, Pads.DOWN) || old_kbd_char == VK_ACT && kbd_char == VK_NEW_DOWN){
            userData.guilds.push(userData.guilds.shift());
        }

        if(Pads.check(new_pad, Pads.CROSS) && !Pads.check(old_pad, Pads.CROSS) || kbd_char == VK_RETURN){
            userData.selectedGuild = userData.guilds[0];
            stateManager.setState(new StateServerLoadInit(this.context));    
        }
    }
    
    onRender() {
        const stringLimit = 28;
        const imageIcon = userData.guilds[0].imageIcon;
        const iconPadding = 5; 

        // Draw guild icon
        if(imageIcon){
            imageIcon.width = 32;
            imageIcon.height = 32;
            imageIcon.draw(50, 100);
        }

        //Draw guild name
        font_medium.print(50 + imageIcon.width + iconPadding, 100, 
            limitString(userData.guilds[0].name, stringLimit));

        //Draw separator
        Draw.rect(50, 140, 462, 10, font.color);

        // Draw guild list
        for(let i = 1; i < (userData.guilds.length < 10? userData.guilds.length : 10); i++) {
            const tempGuild = userData.guilds[i];
            const X = 50;
            const Y = 125 + ( 25 * i)
            const W = 16;
            const H = 16;
            const tempPadding = 5;

            if(tempGuild.imageIcon){
                tempGuild.imageIcon.width = W;
                tempGuild.imageIcon.height = H;
                tempGuild.imageIcon.draw(X, Y + 10);
            }

            font.print(X + W + tempPadding, Y, limitString(tempGuild.name, stringLimit));
        }   

        // Draw current state structions scrren;
        font.print(135, 380, `CROSS - SELECT | UP/DOWN - NAVIGATE | LEFT/RIGHT - FRIENDS`);
    }
}

class StateServerLoadInit extends State {
    constructor(context){ super(context);}

    onInit() {}
    
    onUpdate() {
        r.asyncGet(`https://discordapp.com/api/guilds/${userData.selectedGuild.id}/channels`);
        stateManager.setState(new StateServerLoadWait(this.context));
    }
    
    onRender() {}
}

class StateServerLoadWait extends State {
    constructor(context){ super(context);}

    onInit() {}
    
    onUpdate() {
        if(r.ready()) { 
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
        const rawChannels = std.parseExtJSON(r.getAsyncData());
        
        // Change it to add or remove allowed channels 
        const allowedChannelsTypes = [CHANNELS_TYPES.GUILD_TEXT];
        
        // Extract Category channels
        userData.selectedGuild.categories = rawChannels
            .filter(cat => cat.type == CHANNELS_TYPES.GUILD_CATEGORY)
            .map(cat => {
                const _cat = new ChannelCategory(cat.id);
                _cat.type = cat.type;
                _cat.name = cat.name;
                _cat.position = cat.position;

                return _cat;
            });        

        // Populate channels by category
        userData.selectedGuild.channels = rawChannels
            .filter(ch => allowedChannelsTypes.includes(ch.type))
            .map(ch => {
                const _ch = new Channel(ch.id);
                _ch.type = ch.type;
                _ch.name = ch.name;
                _ch.position = ch.position;
                _ch.parent_id = ch.parent_id;
                _ch.guild_id = ch.guild_id;

                return _ch;
            });

        stateManager.setState(new StateServerNavIdle(this.context));    
    }
    
    onRender() {}
}

class StateServerNavIdle extends State {
    constructor(context){ super(context);}

    onInit() {}
    
    onUpdate() {
        if(Pads.check(new_pad, Pads.UP) && !Pads.check(old_pad, Pads.UP) || old_kbd_char == VK_ACT && kbd_char == VK_NEW_UP) {
            userData.selectedGuild.channels.unshift(userData.selectedGuild.channels.pop());
        }

        if(Pads.check(new_pad, Pads.DOWN) && !Pads.check(old_pad, Pads.DOWN) || old_kbd_char == VK_ACT && kbd_char == VK_NEW_DOWN){
            userData.selectedGuild.channels.push(userData.selectedGuild.channels.shift());
        }

        if(Pads.check(new_pad, Pads.CROSS) && !Pads.check(old_pad, Pads.CROSS) || kbd_char == VK_RETURN){
            userData.selectedChannel = userData.selectedGuild.channels[0];
            if(userData.selectedChannel.parent_id) {
                userData.selectedCategory = userData.selectedGuild.categories
                    .find(c => c.id == userData.selectedChannel.parent_id);
            }
            stateManager.setState(new StateServerNavLoadInit(this.context));    
        }
        
        if(Pads.check(new_pad, Pads.TRIANGLE) && !Pads.check(old_pad, Pads.TRIANGLE) || kbd_char == VK_BACKSPACE){
            stateManager.setState(new StateServerIdle(this.context));    
        }
    }
    
    onRender() {
        const channels = userData.selectedGuild.channels;
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
        r.asyncGet(`https://discordapp.com/api/channels/${userData.selectedChannel.id}/messages`);
        stateManager.setState(new StateServerNavLoadWait(this.context));
    }
    
    onRender() {}
}

class StateServerNavLoadWait extends State {
    constructor(context){ super(context);}

    onInit() {}
    
    onUpdate() {
        if(r.ready()) { 
            stateManager.setState(new StateServerNavLoadEnd(this.context));    
        }
    }
    
    onRender() {}
}

class StateServerNavLoadEnd extends State {
    constructor(context){ super(context);}

    onInit() {}
    
    onUpdate() {
        const rawMessages = std.parseExtJSON(r.getAsyncData());

        userData.selectedChannel.messages = rawMessages
            .sort((ma, mb) => ma.position - mb.position)
            .map(m => {
                const _m = new Message(m.id);
                _m.channel_id = m.channel_id;
                _m.timestamp = m.timestamp;
                _m.position = m.position;
                _m.content = m.content;
                _m.author = m.author;

                return _m;
            });
        
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
            r.asyncPost(`https://discordapp.com/api/channels/${userData.selectedChannel.id}/messages`, `{"content": "${msg}", "tts": false}`);
            while(!r.ready()) {
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
        const ch_msgs = userData.selectedChannel.messages;
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

/**
 * Helper to truncate string
 * @returns string
 */
function limitString(str, maxLength){  
    const ellipsis = '...'; 
    let tempStr = str;
    if (str.length > maxLength) {
        tempStr = str.slice(0, maxLength - ellipsis.length) + ellipsis;
    }
    return tempStr;
}

/**
 * Try to set credential by user session token
 * @returns boolean
 */
function tryToLogInByToken(){
    if(System.doesFileExist("login.json")){
        let logfile = std.parseExtJSON(std.loadFile("login.json"));
        if(logfile.token){
            r.headers = [`Authorization: ${logfile.token}`];
            return true;
        }
    }
    return false;
}

/**
 * Try to set credential by user name and password
 * @returns boolean
*/
function tryToLogInByLogin(){
    if(System.doesFileExist("login.json")){
        let logfile = std.parseExtJSON(std.loadFile("login.json"));
        auth.login = logfile.login;
        auth.password = logfile.password;
        return true;
    }
    return false;
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

/** 
 * Channels Types Definitions
 * Based on https://discord.com/developers/docs/resources/channel#channel-object-channel-types 
 * */
const CHANNELS_TYPES = {
    GUILD_TEXT: 0,
    DM: 1,
    GUILD_VOICE: 2,
    GROUP_DM: 3,
    GUILD_CATEGORY: 4,
    GUILD_ANNOUNCEMENT: 5,
    ANNOUNCEMENT_THREAD: 10, 
    PUBLIC_THREAD: 11,
    PRIVATE_THREAD: 12,
    GUILD_STAGE_VOICE: 13,
    GUILD_DIRECTORY: 14,
    GUILD_FORUM: 15
}

const ee_info = System.getCPUInfo();

const r = new Request();

var userData = new UserData();

var msg = "";

Screen.clear(0x80202020);
logo.draw(320-logo.width/2, 224-logo.height/2);
Screen.flip();

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

while(true) {
    old_pad = new_pad;
    new_pad = Pads.get();

    old_kbd_char = kbd_char;
    kbd_char = Keyboard.get();

    Screen.clear(0x80202020);

    font_bold.print(15, 5, "Discord for Playstation 2");
    
    stateManager.onUpdate();
    stateManager.onRender();

    font.print(15, 420, `Temp: ${System.getTemperature() === undefined? "NaN" : System.getTemperature()} C | RAM Usage: ${Math.floor(System.getMemoryStats().used / 1024)}KB / ${Math.floor(ee_info.RAMSize / 1024)}KB`);

    Screen.flip();
}
