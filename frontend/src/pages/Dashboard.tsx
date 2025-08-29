import { Link } from "react-router-dom";

export default function Dashboard() {
  const meetings = [
    {
      id: "1",
      title: "Team Sync",
      date: "2025-08-28",
    },
    {
      id: "2",
      title: "Budget Discussion",
      date: "2025-08-27",
    },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-10 text-center">
        Your Meetings
      </h1>

      <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {meetings.map((m) => (
          <li
            key={m.id}
            className="bg-white border border-gray-200 rounded-3xl shadow-lg hover:shadow-2xl transition p-6 flex flex-col justify-between"
          >
            {/* Meeting Info */}
            <div className="mb-6">
              <p className="text-2xl font-bold text-gray-800 mb-2">{m.title}</p>
              <span className="text-sm text-gray-500 mb-2">{m.date}</span>
            </div>

            {/* Action Links with separators */}
            <div className="mt-auto flex justify-center items-center gap-2 text-sm font-semibold">
              <Link
                to={`/meeting/${m.id}`}
                className="text-green-600 hover:text-green-800"
              >
                Start Meeting
              </Link>
              <span className="text-gray-400"> | </span>
              <Link
                to={`/meeting/${m.id}/summary`}
                className="text-purple-600 hover:text-purple-800"
              >
                Executive Summary
              </Link>
              <span className="text-gray-400"> | </span>
              <Link
                to={`/meeting/${m.id}/detail`}
                className="text-blue-600 hover:text-blue-800"
              >
                Detailed View
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
