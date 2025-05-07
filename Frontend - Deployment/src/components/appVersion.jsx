import React, { useEffect, useState } from "react";

const AppVersion = () => {
  const [version, setVersion] = useState("");
  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetch(`${apiUrl}/app-version`)
      .then((response) => response.json())
      .then((data) => setVersion(data.version))
      .catch((error) => {
        console.error("Error fetching app version:", error);
        setVersion("Unavailable");
      });
  }, []);

  return (
    <div className="mt-4 text-center text-sm text-gray-500">
      {version && <p> {version}</p>}
    </div>
  );
};

export default AppVersion;
