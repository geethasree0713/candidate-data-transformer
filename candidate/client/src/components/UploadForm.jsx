import { useState } from "react";
import api from "../services/api";

export default function UploadForm({ setResult, setLoading, setError }) {
  const [resume, setResume] = useState(null);
  const [csv, setCsv] = useState(null);
  const [targetSkills, setTargetSkills] = useState("");

  const upload = async () => {
    if (!resume && !csv) {
      alert("Upload at least one file (Resume or CSV)");
      return;
    }

    const formData = new FormData();
    if (resume) formData.append("resume", resume);
    if (csv) formData.append("csv", csv);
    if (targetSkills.trim()) formData.append("targetSkills", targetSkills.trim());

    try {
      setError(null);
      setLoading(true);

      const response = await api.post("/upload", formData);

      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed. Please try again.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ color: "#2563eb", marginBottom: "15px" }}>
        Upload Candidate Data
      </h2>

      <div style={{ marginBottom: "15px" }}>
        <label style={{ fontWeight: "bold" }}>Resume (PDF)</label>
        <br />
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setResume(e.target.files[0])}
          style={{ marginTop: "5px" }}
        />
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label style={{ fontWeight: "bold" }}>Recruiter CSV</label>
        <br />
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setCsv(e.target.files[0])}
          style={{ marginTop: "5px" }}
        />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label style={{ fontWeight: "bold" }}>
          Target Skills <span style={{ fontWeight: "normal", color: "#6b7280" }}>(optional)</span>
        </label>
        <br />
        <input
          type="text"
          placeholder="e.g. java, react, aws"
          value={targetSkills}
          onChange={(e) => setTargetSkills(e.target.value)}
          style={{
            marginTop: "5px",
            width: "100%",
            padding: "8px",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            boxSizing: "border-box"
          }}
        />
      </div>

      <button
        onClick={upload}
        style={{
          background: "#2563eb",
          color: "white",
          border: "none",
          padding: "10px 15px",
          borderRadius: "6px",
          cursor: "pointer",
          width: "100%",
          fontWeight: "bold"
        }}
      >
        Run Analysis
      </button>
    </div>
  );
}