import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

type SummaryData = {
  speakers: string[];
  transcript: { speaker: string; text: string }[];
  summary: string;
  actionItems: {
    individual: Record<string, string[]>;
    common: string[];
  };
};

export default function ExecutiveSummaryPage() {
  const { id } = useParams();
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');

  async function fetchSummary() {
    if (!id) return;

    try {
      setLoading(true);
      const res = await axios.get<SummaryData>(`/uploads/${id}/summary.json`);
      setData(res.data);
    } catch (err) {
      console.error('Error fetching executive summary:', err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendEmail() {
    if (!id || !email) return;

    try {
      setSending(true);
      setEmailMessage('');
      const res = await axios.post('/api/send-transcript', { meetingId: id, email });
      if (res.data.ok) {
        setEmailMessage(`Transcript sent successfully to ${email}`);
      } else {
        setEmailMessage('Failed to send transcript.');
      }
    } catch (err) {
      console.error('Error sending transcript email:', err);
      setEmailMessage('Error sending transcript email.');
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 5000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) return <div className="p-6">Loading executive summary...</div>;
  if (!data) return <div className="p-6">No summary available yet.</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-center mb-4">
        Executive Summary - Meeting {id}
      </h1>

      <section className="bg-white p-6 rounded-2xl shadow-md">
        <h2 className="text-xl font-semibold mb-2">Summary</h2>
        <p className="text-gray-700">{data.summary}</p>
      </section>

      <section className="bg-white p-6 rounded-2xl shadow-md">
        <h2 className="text-xl font-semibold mb-2">Common / Executive Action Items</h2>
        {data.actionItems.common.length > 0 ? (
          <ul className="list-disc list-inside text-gray-700">
            {data.actionItems.common.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No common action items found.</p>
        )}
      </section>

      {/* ---------------- Send Email Section ---------------- */}
      <section className="bg-white p-6 rounded-2xl shadow-md">
        <h2 className="text-xl font-semibold mb-2">Send Transcript via Email</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            placeholder="Enter email address"
            className="border border-gray-300 rounded px-3 py-2 flex-1"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow-md"
            onClick={handleSendEmail}
            disabled={sending || !email}
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
        {emailMessage && <p className="mt-2 text-gray-700">{emailMessage}</p>}
      </section>
    </div>
  );
}
