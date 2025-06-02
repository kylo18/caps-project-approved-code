import React, { useEffect, useState } from "react";

// Displays App Version
const AppVersion = () => {
  const [version, setVersion] = useState("");
  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetch(`${apiUrl}/app-version`)
      .then((response) => response.json())
      .then((data) => setVersion(data.version))
      .catch((error) => {
        setVersion("Version not found");
      });
  }, []);

  return (
    <div className="text-center text-sm">{version && <p>{version}</p>}</div>
  );
};

export default AppVersion;
