import React, { useEffect, useState } from "react";

const AppVersion = () => {
  const [version, setVersion] = useState("");
  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetch(`${apiUrl}/app-version`)
      .then((response) => response.json())
      .then((data) => setVersion(data.version))
      .catch(() => setVersion("---"));
  }, []);

  return version ? (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: "linear-gradient(135deg, #FF6014, #ff8c4b)",
      borderRadius: 20, padding: "2px 5px",
      boxShadow: "0 2px 8px rgba(255,96,20,0.35)",
    }}>
      <div style={{
        width: 5, height: 5, borderRadius: "50%",
      }}/>
      <span style={{
        fontSize: 10, fontWeight: 700,
        color: "#fff", letterSpacing: "0.5px",
      }}>
        {version}
      </span>
    </div>
  ) : null;
};

export default AppVersion;