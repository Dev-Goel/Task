import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { processMeeting } from './processMeeting';
import nodemailer from 'nodemailer';

type WS = import('ws');

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

async function sendEmail({
  to,
  subject,
  text,
  attachmentPath,
}: {
  to: string;
  subject: string;
  text: string;
  attachmentPath: string;
}) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject,
    text,
    attachments: [{ path: attachmentPath }],
  });
}

export function attachWsHandlers(ws: WS) {
  let writeStream: fs.WriteStream | null = null;
  let tmpFilePath: string | null = null;
  let meetingId: string | null = null;

  ws.on('message', async (data, isBinary) => {
    try {
      if (!isBinary) {
        const msg = JSON.parse(data.toString());

        if (msg.type === 'start') {
          meetingId = msg.meetingId || uuidv4();
          const meetingDir = path.join(UPLOAD_DIR, meetingId);
          if (!fs.existsSync(meetingDir)) fs.mkdirSync(meetingDir);

          tmpFilePath = path.join(meetingDir, msg.filename || `meeting-${Date.now()}.webm`);
          writeStream = fs.createWriteStream(tmpFilePath, { flags: 'a' });

          ws.send(JSON.stringify({ type: 'ack', status: 'started' }));
          console.log(`Started recording meeting ${meetingId}`);
        }

        if (msg.type === 'stop') {
          writeStream?.end();
          ws.send(JSON.stringify({ type: 'ack', status: 'stopped' }));
          console.log(`Stopped recording meeting ${meetingId}`);

          if (meetingId && tmpFilePath) {
            const meetingDir = path.join(UPLOAD_DIR, meetingId);

            // Placeholder transcript
            const transcript = {
              meetingId,
              summary: 'Placeholder transcript',
              actionItems: [],
              createdAt: new Date().toISOString(),
            };
            const transcriptPath = path.join(meetingDir, 'transcript.json');
            fs.writeFileSync(transcriptPath, JSON.stringify(transcript, null, 2));

            // Trigger LLM processing
            try {
              await processMeeting(meetingId);

              const summaryPath = path.join(meetingDir, 'summary.json');

              // Send email if requested
              if (msg.sendEmail && msg.email) {
                try {
                  await sendEmail({
                    to: msg.email,
                    subject: `Meeting Transcript - ${meetingId}`,
                    text: `Transcript for meeting ${meetingId} is attached.`,
                    attachmentPath: summaryPath,
                  });
                  console.log(`Transcript email sent to ${msg.email}`);
                } catch (err) {
                  console.error('Failed to send email:', err);
                }
              }

              console.log(`Summary & action items generated for meeting ${meetingId}`);
            } catch (err) {
              console.error('Error processing meeting with LLM:', err);
            }
          }
        }
      } else {
        // Binary audio chunk
        if (writeStream) writeStream.write(data);
      }
    } catch (err) {
      console.error('WS error', err);
      ws.send(JSON.stringify({ type: 'error', message: 'server error' }));
    }
  });

  ws.on('close', () => {
    writeStream?.end();
    console.log('WS connection closed');
  });
}
