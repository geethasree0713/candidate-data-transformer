import { useState } from "react";
import UploadForm from "../components/UploadForm";
import MatchResult from "../components/MatchResult";
import Header from "../components/Header";
import Loading from "../components/Loading";

export default function Home() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  return (
    <div>
      <Header />

      <div style={{ display: "flex", gap: "20px", padding: "20px" }}>
        <div style={{ flex: 1, background: "white", padding: "20px", borderRadius: "8px" }}>
          <UploadForm setResult={setResult} setLoading={setLoading} setError={setError} />
        </div>

        <div style={{ flex: 2, background: "white", padding: "20px", borderRadius: "8px" }}>
          {loading && <Loading />}
          {!loading && error && (
            <p style={{ color: "#dc2626", fontWeight: "bold" }}>{error}</p>
          )}
          {!loading && !error && <MatchResult data={result} />}
        </div>
      </div>
    </div>
  );
}