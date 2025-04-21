import { useEffect } from "react";

const WarnOnExit = (choices) => {
  useEffect(() => {
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

