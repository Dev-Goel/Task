import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

type TranscriptItem = { speaker: string; text: string };
type SummaryData = {
  speakers: string[];
  transcript: TranscriptItem[];
  summary: string;
  actionItems: {
    individual: Record<string, string[]>;
    common: string[];
  };
};

export default function MeetingDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchSummary() {
    if (!id) return;

    try {
      setLoading(true);
      const res = await axios.get<SummaryData>(`/uploads/${id}/summary.json`);
      setData(res.data);
    } catch (err) {
      console.error('Error fetching summary:', err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 5000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) return <div className="p-6">Loading meeting details...</div>;
  if (!data) return <div className="p-6">No summary available yet.</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Meeting {id}</h1>

      <section className="bg-white p-6 rounded-2xl shadow-md">
        <h2 className="text-xl font-semibold mb-2">Summary</h2>
        <p className="text-gray-700">{data.summary}</p>
      </section>

      <section className="bg-white p-6 rounded-2xl shadow-md">
        <h2 className="text-xl font-semibold mb-2">Speakers & Transcript</h2>
        {data.transcript.map((item, idx) => (
          <div key={idx} className="mb-1">
            <span className="font-bold">{item.speaker}:</span> {item.text}
          </div>
        ))}
      </section>

      <section className="bg-white p-6 rounded-2xl shadow-md">
        <h2 className="text-xl font-semibold mb-2">Action Items</h2>

        <h3 className="font-bold mt-2">Individual</h3>
        {Object.entries(data.actionItems.individual).map(([speaker, items]) => (
          <div key={speaker} className="mb-2">
            <p className="font-semibold">{speaker}</p>
            <ul className="list-disc list-inside text-gray-700">
              {items.map((i, idx) => (
                <li key={idx}>{i}</li>
              ))}
            </ul>
          </div>
        ))}

      </section>
    </div>
  );
}
