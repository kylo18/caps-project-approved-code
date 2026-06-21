import { useEffect, useState } from "react";
import LoadingOverlay from "./loadingOverlay";
import { restoreSession } from "../utils/authApi";

export default function AuthInit({ children }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    restoreSession().finally(() => setReady(true));
  }, []);

  if (!ready) {
    return <LoadingOverlay show message="Loading..." />;
  }

  return children;
}
