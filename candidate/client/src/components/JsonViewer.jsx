import { useState } from "react";

export default function JsonViewer({ data }) {
  const [view, setView] = useState("pretty");

  if (!data) return null;

  return (
    <div style={{ marginTop: "20px" }}>

      <button
        onClick={() =>
          setView(view === "pretty" ? "raw" : "pretty")
        }
        style={{
          background: "#111827",
          color: "white",
          padding: "6px 10px",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer"
        }}
      >
        Toggle JSON View
      </button>

      {view === "pretty" ? (
        <pre style={{
          background: "#f3f4f6",
          padding: "10px",
          marginTop: "10px",
          borderRadius: "6px",
          overflow: "auto"
        }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      ) : (
        <textarea
          value={JSON.stringify(data)}
          readOnly
          style={{
            width: "100%",
            height: "200px",
            marginTop: "10px"
          }}
        />
      )}
    </div>
  );
}