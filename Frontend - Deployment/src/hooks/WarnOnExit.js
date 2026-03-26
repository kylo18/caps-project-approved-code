import { useEffect } from "react";

// Renders the warn on exit.
const WarnOnExit = (choices) => {
  useEffect(() => {
    // Handles before unload.
    const handleBeforeUnload = (e) => {
      const noChoicesAdded = choices.every(
        (choice) => !choice.choiceText.trim() && !choice.image
      );

      if (noChoicesAdded) {
        e.preventDefault();
        e.returnValue = ''; 
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [choices]);
};

export default WarnOnExit;

