import { useParams } from "react-router-dom";
import MeetingRecorder from "../components/MeetingRecorder";

export default function MeetingDetail() {
  const { id } = useParams();

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Meeting #{id}</h1>
      <MeetingRecorder meetingId={id!} />
    </div>
  );
}
