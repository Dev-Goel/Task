import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { execSync } from "child_process";
require('dotenv').config();

const openai = new OpenAI({
  apiKey: "",
});

function convertWebmToWav(webmPath: string, wavPath: string) {
  try {
    execSync(`ffmpeg -y -err_detect ignore_err -i "${webmPath}" -ar 16000 -ac 1 "${wavPath}"`);
  } catch (err) {
    console.error('FFmpeg conversion failed:', err);
    throw err;
  }
}

function getAudioDuration(wavPath: string) {
  try {
    const result = execSync(`ffprobe -i "${wavPath}" -show_entries format=duration -v quiet -of csv="p=0"`).toString();
    return parseFloat(result) || 0;
  } catch {
    return 0;
  }
}

function getSpeakerSegments(wavPath: string) {
  try {
    const output = execSync(`python3 src/diarize.py "${wavPath}"`).toString();
    return JSON.parse(output); // expects valid JSON [{start, end, speaker}]
  } catch (err: any) {
    console.error('Diarization failed or invalid JSON output:', err.stdout?.toString() || err.message);
    return []; // fallback to empty segments
  }
}

export async function processMeeting(meetingId: string) {
  const meetingDir = path.join(process.cwd(), 'uploads', meetingId);
  const audioPath = path.join(meetingDir, `meeting-${meetingId}.webm`);
  const wavPath = path.join(meetingDir, `meeting-${meetingId}.wav`);

  convertWebmToWav(audioPath, wavPath);

  const duration = getAudioDuration(wavPath);
  let segments: any[] = [];
  if (duration < 1) {
    console.warn('Audio too short or invalid, skipping diarization.');
  } else {
    segments = getSpeakerSegments(wavPath);
    if (!segments.length) console.warn('No speaker segments found, skipping diarization.');
  }

  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(audioPath),
    model: 'whisper-1',
  });
  const transcriptText = transcription.text;

  const speakerTranscript = segments.length
    ? segments.map((seg, idx) => ({
        speaker: seg.speaker,
        text: transcriptText.split('\n')[idx] || '',
      }))
    : [{ speaker: 'Speaker 1', text: transcriptText }]; // fallback

  const prompt = `
You are a meeting summarizer.
- Use the speaker labels provided
- Generate concise meeting summary
- Extract action items per speaker
- Transcript may contain English, Hindi, Gujarati
- Output ONLY valid JSON with this structure:
{
  "speakers": ["Speaker 1", "Speaker 2"],
  "transcript": [{"speaker":"Speaker 1","text":"..."}, ...],
  "summary": "...",
  "actionItems": {
    "individual": {"Speaker 1": [...], "Speaker 2": [...]},
    "common": [...]
  }
}
Transcript:
${JSON.stringify(speakerTranscript)}
`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
  });

  const resultText = completion.choices[0].message?.content || '';

  let summaryJson: any = {};
  try {
    const jsonMatch = resultText.match(/\{[\s\S]*\}$/);
    if (!jsonMatch) throw new Error('No JSON found in LLM response');
    summaryJson = JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('Error parsing LLM response as JSON:', err, '\nResponse text:', resultText);
    summaryJson = { error: 'Failed to parse LLM output', raw: resultText };
  }

  fs.writeFileSync(
    path.join(meetingDir, 'summary.json'),
    JSON.stringify(summaryJson, null, 2)
  );

  console.log('Summary & action items saved at', path.join(meetingDir, 'summary.json'));
}
