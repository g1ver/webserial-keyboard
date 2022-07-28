import { WebSerialInterface } from "./modules/webSerial.js";

let port;
let reader;
let readableStreamClosed;
let writer;
let writableStreamClosed;
let textDecoder;
let textEncoder;
let state = false;

let notes_played = [];
let freq_played = [];

addNoteButtons();

document.getElementById('conn-btn')
    .addEventListener('click', async () => {
        if (!state) {
            await connect();
        } else {
            await disconnect();
        }
    });

document.getElementById('play-recorded-btn')
    .addEventListener('click', async () => {
        playRecorded();
    })

document.getElementById('clear-recorded-btn')
    .addEventListener('click', async () => {
        clearRecorded();
    });

async function connect() {    
    const filters = [
        {usbVendorId: 0x2341, usbProductId: 0x0043}
    ]

    port = await navigator.serial.requestPort({filters});
    
    await port.open({baudRate: 9600});
    let {usbProductId, usbVendorId } = await port.getInfo();
    deviceInfoUI(usbVendorId, usbProductId);
    state = true;
    updateConnButton();
    
    textEncoder = new TextEncoderStream();
    writableStreamClosed = textEncoder.readable.pipeTo(port.writable);
    writer = textEncoder.writable.getWriter();

    textDecoder = new TextDecoderStream();
    readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
    reader = textDecoder.readable
        .pipeThrough(new TransformStream(new LineBreakTransformer()))
        .getReader();
    
    await readSerial();
}

async function disconnect() {
    reader.cancel();
    await readableStreamClosed.catch(() => { /* Ignore */ });

    writer.close();
    await writableStreamClosed;

    await port.close();
    state = false;
    disconnectUI();
    updateConnButton();
    clearRecorded();
}

async function sendSerial(text_input, code="0x0") {
    // await writer.write(code + '\n');
    await writer.write(text_input + '\n');
}

async function readSerial() {
    while (true) {
        const { value, done } = await reader.read();
        if (done) {
            reader.releaseLock();
            break;
        }
        console.log(value);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function playRecorded() {
    for (const freq of freq_played) {
        await sendSerial(freq);
        await sleep(100);
        await sendSerial('END');
        await sleep(100 * 1.3);
    }
}

async function clearRecorded() {
    freq_played = [];
    notes_played = [];
    const notes_display = document.getElementById('recorded-notes');
    notes_display.innerText = "";
}

/**
 * UI functionality
 */
function updateRecorded(note, freq) {
    notes_played.push(note);
    freq_played.push(freq);
    const recorded_div = document.getElementById('recorded-notes');
    recorded_div.className = "text-light";
    recorded_div.innerText = "";
    notes_played.forEach((note, index) => {
        let addin = "";
        if (index != 0)
            addin = ", ";
            
        const txt = document.createTextNode(addin + note);
        recorded_div.appendChild(txt);
    });
}

function addNoteButtons() {
    const notes = new Map([
        ['C', [33, 65, 131, 262, 523, 1047, 2093, 4186]],
        ['Db', [35, 69, 139, 277, 554, 1109, 2217, 4435]],
        ['D', [37, 73, 147, 294, 587, 1175, 2349, 4699]],
        ['Eb', [39, 78, 156, 311, 622, 1245, 2489, 4978]],
        ['E', [41, 82, 165, 330, 659, 1319, 2637]],
        ['F', [44, 87, 175, 349, 698, 1397, 2794]],
        ['Gb', [46, 93, 185, 370, 740, 1480, 2960]],
        ['G', [49, 98, 196, 392, 784, 1568, 3136]],
        ['Ab', [52, 104, 208, 415, 831, 1661, 3322]],
        ['A', [55, 110, 220, 440, 880, 1760, 3520]],
        ['Bb', [58, 117, 233, 466, 932, 1865, 3729]],
        ['B', [62, 123, 247, 494, 988, 1976, 3951]],
    ]);
    const note_div = document.getElementById('musical-notes');

    notes.forEach((val, key) => {
        val.forEach((freq, index) => {
            const button = document.createElement('button');
            const button_name = key + (index + 1);
            button.innerText = button_name;
            button.id = button_name + '-btn';
            button.className = 'btn btn-primary note-btn m-1';
            button.type = 'button';
            button.disabled = true;
            note_div.appendChild(button);
            button.addEventListener('mousedown', async () => {
                await sendSerial(freq);
                updateRecorded(button.innerText, freq);
            })
            button.addEventListener('mouseup', async () => {
                await sendSerial('END');
            })
        });
        note_div.appendChild(document.createElement('br'));
    });
}

function updateConnButton() {
    const button = document.getElementById('conn-btn');
    const note_buttons = Array.from(document.getElementsByClassName('note-btn'));
    const play_button = document.getElementById("play-recorded-btn");
    const clear_button = document.getElementById("clear-recorded-btn");
    if (state) {
        button.innerHTML = 'Disconnect';
        button.className = 'btn btn-warning my-1'
        note_buttons.forEach(btn => btn.disabled = false)
        play_button.disabled = false;
        clear_button.disabled = false;
    } else {
        button.innerHTML = 'Connect';
        button.className = 'btn btn-success my-1'
        note_buttons.forEach(btn => btn.disabled = true)
        play_button.disabled = true;
        clear_button.disabled = true;
    }
    
}

function disconnectUI() {
    const device_info = document.getElementById('device-info');

    if (device_info) {
        device_info.remove();
    }
}

function deviceInfoUI(usbProductId, usbVendorId) {
    const header = document.getElementById('header');
    const t = document.createElement('p')
    t.id = 'device-info';
    t.className = "m-2 text-light font-monospace fw-light d-inline text-muted";
    t.innerHTML = `[Device] 0x${usbProductId.toString(16)}:0x${usbVendorId.toString(16)}`
    header.appendChild(t);
}


/**
 * Text Transformer
 */
 class LineBreakTransformer {
    constructor() {
      this.chunks = "";
    }
  
    transform(chunk, controller) {
      this.chunks += chunk;
      const lines = this.chunks.split("\r\n");
      this.chunks = lines.pop();
      lines.forEach((line) => controller.enqueue(line));
    }
  
    flush(controller) {
      controller.enqueue(this.chunks);
    }
  }