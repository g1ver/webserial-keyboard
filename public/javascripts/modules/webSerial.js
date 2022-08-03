export class WebSerialInterface {
    constructor(debug) {
        this.debugInterface = debug;
    }

    async connect(filters) {
        // setup port
        this.port = await navigator.serial.requestPort({ filters });
        await this.port.open({ baudRate: 9600 });
        this.portInfo = await this.port.getInfo();
        this.connState = true;

        // setup text encoding streams
        this.textEncoder = new TextEncoderStream();
        this.writableStreamClosed = this.textEncoder.readable.pipeTo(
            this.port.writable
        );
        this.writer = this.textEncoder.writable.getWriter();

        // setup text decoding stream
        this.textDecoder = new TextDecoderStream();
        this.readableStreamClosed = this.port.readable.pipeTo(
            this.textDecoder.writable
        );
        this.reader = this.textDecoder.readable
            .pipeThrough(new TransformStream(new LineBreakTransformer()))
            .getReader();
    }

    async disconnect() {
        this.reader.cancel();
        await this.readableStreamClosed.catch(() => {
            /* ignoring */
        });

        this.writer.close();
        await this.writableStreamClosed;

        await this.port.close();
        this.connState = false;
    }

    async sendSerial(textInput, code = 0x0) {
        await this.writer.write(textInput + "\n");
        await this.debugInterface(`[send] ${textInput}`);
        // TODO: byte codes for types of messages
        // TODO: use sendSerial to implement:
        //          sendNote, sendSong, saveSong
    }

    async receiveSerial() {
        while (true) {
            const { value, done } = await this.reader.read();
            if (done) {
                this.reader.releaseLock();
                break;
            }
            await this.debugInterface(`[recv] ${value}`);
        }
    }
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
