import JsonViewer from "./JsonViewer";

export default function MatchResult({ data }) {
  if (!data) {
    return <p style={{ color: "#6b7280" }}>Upload files to analyze candidate</p>;
  }

  const profile = data.profile;
  const fitScore = data.fitScore;

  if (!profile) {
    return <p style={{ color: "#dc2626" }}>No profile could be generated from the uploaded files.</p>;
  }

  const locationLabel = profile.location
    ? [profile.location.city, profile.location.region, profile.location.country]
        .filter(Boolean)
        .join(", ")
    : null;

  // skills can come back as plain strings (custom config) or as
  // {name, confidence, sources} objects (default schema) — normalize
  // to a flat string list for display either way.
  const skillNames = (profile.skills || []).map(s =>
    typeof s === "string" ? s : s.name
  ).filter(Boolean);

  return (
    <div>
      {/* NAME */}
      <h1>{profile.full_name || "Unknown Candidate"}</h1>
      {locationLabel && <p style={{ color: "#6b7280" }}>{locationLabel}</p>}
      {profile.headline && <p style={{ color: "#374151" }}>{profile.headline}</p>}

      {/* CONFIDENCE */}
      {profile.overall_confidence !== undefined && (
        <p style={{ fontSize: "13px", color: "#6b7280" }}>
          Overall confidence: {Math.round(profile.overall_confidence * 100)}%
        </p>
      )}

      {/* OPTIONAL FIT SCORE (only shown if targetSkills was supplied) */}
      {fitScore && (
        <>
          <h3>Skill Fit Score</h3>
          <div style={{
            background: "#e5e7eb",
            height: "12px",
            borderRadius: "10px",
            overflow: "hidden"
          }}>
            <div style={{
              width: `${fitScore.score}%`,
              background: "#2563eb",
              height: "100%"
            }} />
          </div>
          <p style={{ fontSize: "20px", fontWeight: "bold" }}>
            {fitScore.score}%
          </p>

          <h4 style={{ marginBottom: "5px" }}>Matched Skills</h4>
          {fitScore.matchedSkills.length === 0 && (
            <p style={{ color: "#6b7280", fontSize: "13px" }}>None</p>
          )}
          {fitScore.matchedSkills.map(skill => (
            <span key={skill} style={chip("#dcfce7", "#16a34a")}>{skill}</span>
          ))}

          <h4 style={{ marginTop: "10px", marginBottom: "5px" }}>Missing Skills</h4>
          {fitScore.missingSkills.length === 0 && (
            <p style={{ color: "#6b7280", fontSize: "13px" }}>None</p>
          )}
          {fitScore.missingSkills.map(skill => (
            <span key={skill} style={chip("#fee2e2", "#dc2626")}>{skill}</span>
          ))}
        </>
      )}

      {/* ALL SKILLS (always shown — from canonical profile) */}
      <h3 style={{ marginTop: "15px" }}>Skills</h3>
      {skillNames.length === 0 && (
        <p style={{ color: "#6b7280", fontSize: "13px" }}>No skills detected</p>
      )}
      {skillNames.map(name => (
        <span key={name} style={chip("#dbeafe", "#1d4ed8")}>{name}</span>
      ))}

      {/* CONTACT */}
      <h3 style={{ marginTop: "15px" }}>Contact</h3>
      <p style={{ fontSize: "13px", color: "#374151" }}>
        Email: {profile.emails?.length ? profile.emails.join(", ") : "Not found"}
      </p>
      <p style={{ fontSize: "13px", color: "#374151" }}>
        Phone: {profile.phones?.length ? profile.phones.join(", ") : "Not found"}
      </p>

      {/* DOWNLOAD BUTTON */}
      <div style={{ marginTop: "20px" }}>
        <button
          onClick={() => downloadJSON(data)}
          style={{
            background: "#2563eb",
            color: "white",
            padding: "10px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer"
          }}
        >
          Download Report
        </button>
      </div>

      {/* JSON VIEW */}
      <JsonViewer data={data} />
    </div>
  );
}

function chip(bg, color) {
  return {
    display: "inline-block",
    margin: "3px",
    padding: "5px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    background: bg,
    color: color
  };
}

function downloadJSON(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "candidate_report.json";
  a.click();
  URL.revokeObjectURL(url);
}