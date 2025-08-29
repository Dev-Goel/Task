from pyannote.audio import Pipeline
import sys, json

webm_path = sys.argv[1]

pipeline = Pipeline.from_pretrained("pyannote/speaker-diarization")
diarization = pipeline(webm_path)

segments = []
for turn, _, speaker in diarization.itertracks(yield_label=True):
    segments.append({
        "start": turn.start,
        "end": turn.end,
        "speaker": speaker
    })

print(json.dumps(segments))
