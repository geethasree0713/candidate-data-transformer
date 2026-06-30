export default function Loading() {
  return (
    <div style={{
      padding: "20px",
      textAlign: "center"
    }}>
      <div style={{
        width: "40px",
        height: "40px",
        margin: "auto",
        border: "4px solid #e5e7eb",
        borderTop: "4px solid #2563eb",
        borderRadius: "50%",
        animation: "spin 1s linear infinite"
      }} />

      <p style={{ marginTop: "10px", color: "#6b7280" }}>
        AI is analyzing candidate...
      </p>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}