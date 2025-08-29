import { useState, useRef } from 'react';

export default function MeetingRecorder({ meetingId }: { meetingId: string }) {
  const [status, setStatus] = useState<'idle' | 'recording' | 'paused' | 'stopped'>('idle');
  const [sendEmail, setSendEmail] = useState(false);
  const [email, setEmail] = useState('');
  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  async function start() {
    const ws = new WebSocket(`ws://localhost:4000/ws/meetings`);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      ws.send(JSON.stringify({
        type: 'start',
        meetingId,
        filename: `meeting-${meetingId}.webm`
      }));
      setStatus('recording');
    };

    ws.onclose = () => console.log('WebSocket closed');
    ws.onerror = (err) => console.error('WebSocket error', err);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

    recorder.ondataavailable = async (e) => {
      if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
        const buffer = await e.data.arrayBuffer();
        ws.send(buffer);
      }
    };

    recorder.start(2000); // send audio every 2 seconds
    mediaRecorderRef.current = recorder;
  }

  function pause() {
    mediaRecorderRef.current?.pause();
    setStatus('paused');
  }

  function resume() {
    mediaRecorderRef.current?.resume();
    setStatus('recording');
  }

  function stop() {
    mediaRecorderRef.current?.stop();

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'stop',
        sendEmail,
        email
      }));
    }

    socketRef.current?.close();
    setStatus('stopped');
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex gap-2">
        {status === 'idle' && <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={start}>Start</button>}
        {status === 'recording' && <button className="bg-yellow-500 text-white px-4 py-2 rounded" onClick={pause}>Pause</button>}
        {status === 'paused' && <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={resume}>Resume</button>}
        {status !== 'stopped' && status !== 'idle' && <button className="bg-red-500 text-white px-4 py-2 rounded" onClick={stop}>Stop</button>}
      </div>

      {status === 'stopped' && (
        <div className="flex gap-2 items-center mt-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
            />
            Send transcript via email
          </label>

          {sendEmail && (
            <input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-gray-300 px-2 py-1 rounded"
            />
          )}
        </div>
      )}
    </div>
  );
}
