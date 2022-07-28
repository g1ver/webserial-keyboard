export class WebSerialInterface {
    constructor() {}

    async connect(filters) {
        // setup port
        this.port = await navigator.serial.requestPort({filters}); 
        await port.open({baudRate: 9600});
        this.usbProductId, this.usbVendorId = await port.getInfo();
        this.connState = true;

        // setup text encoding streams
        this.textEncoder = new TextEncoderStream();
        this.writableStreamClosed = textEncoder.readable.pipeTo(this.port.writable);
        this.writer = this.textEncoder.writable.getWriter();
        
        // setup text decoding stream
        this.textDecoder = new TextDecoderStream();
        this.readableStreamClosed = port.readable.pipeTo(this.textDecoder.writable);
        this.reader = this.textDecoder.readable
            .pipeThrough(new TransformStream(new LineBreakTransformer()))
            .getReader();
        
        await this.receiveSerial();
    }

    async disconnect() {
        this.reader.cancel();
        await this.readableStreamClosed.catch(() => {/* ignoring */})

        this.writer.close();
        await this.writableStreamClosed;

        await this.port.close();
        this.connState = false;
    }

    async sendSerial(textInput, code=0x0) {
        await this.writer.write(textInput);
        // TODO: byte codes for types of messages
    }

    async receiveSerial() {
        while (true) {
            const { value, done } = await reader.read();
            if (done) {
                reader.releaseLock();
                break;
            }
            console.log(value);
        }
    }
}