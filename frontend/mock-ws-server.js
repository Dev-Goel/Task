import { WebSocketServer } from 'ws';
import fs from 'fs';


const wss = new WebSocketServer({ port: 4000, path: '/ws/meetings/1' });


wss.on('connection', (ws) => {
    console.log('Client connected');
    const fileStream = fs.createWriteStream('meeting-audio.webm');


    ws.on('message', (msg) => {
        fileStream.write(Buffer.from(msg));
    });


    ws.on('close', () => {
        console.log('Connection closed, file saved');
        fileStream.end();
    });
});