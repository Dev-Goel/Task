import express from 'express';
import http from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import { attachWsHandlers } from './wsHandler';
import dotenv from 'dotenv';
import path from 'path';
import cors from 'cors';
import { sendEmail } from './sendEmail'; 

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors({ origin: '*' }));
app.use(express.json()); 

app.get('/health', (req, res) => res.json({ ok: true }));

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(UPLOAD_DIR));

app.post('/api/send-transcript', async (req, res) => {
  try {
    const { meetingId, email } = req.body;
    if (!meetingId || !email) return res.status(400).json({ error: 'Missing fields' });

    const summaryPath = path.join(UPLOAD_DIR, meetingId, 'summary.json');
    if (!require('fs').existsSync(summaryPath)) return res.status(404).json({ error: 'Transcript not found' });

    await sendEmail({
      to: email,
      subject: `Meeting Transcript - ${meetingId}`,
      text: `Transcript for meeting ${meetingId} is attached.`,
      attachmentPath: summaryPath,
    });

    return res.json({ ok: true, message: `Transcript sent to ${email}` });
  } catch (err) {
    console.error('Error sending transcript email:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
});

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws: WebSocket) => {
  console.log('WS connected');
  attachWsHandlers(ws as any);
});

server.on('upgrade', (request, socket, head) => {
  const url = request.url || '';
  if (url.startsWith('/ws/meetings')) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      attachWsHandlers(ws);
    });
  } else {
    socket.destroy();
  }
});

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
