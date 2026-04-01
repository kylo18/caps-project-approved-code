// Render the faq accordion component.
const FaqAccordion = ({ faqs, activeId, onToggle }) => {
  return (
    <div className="space-y-3">
      {faqs.map((faq) => {
        // Only the FAQ whose id matches activeId is expanded.
        const isOpen = faq.id === activeId;

        return (
          <div
            key={faq.id}
            className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-[var(--color-bg-secondary)]"
          >
            <button
              type="button"
              // Clicking the question lets the parent decide whether to open
              // this item or collapse it if it is already active.
              onClick={() => onToggle(faq.id)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <span className="text-[14px] font-semibold text-gray-800 dark:text-white">
                {faq.question}
              </span>
              <i
                className={`bx ${isOpen ? "bx-chevron-up" : "bx-chevron-down"} text-xl text-gray-500 dark:text-gray-300`}
              ></i>
            </button>

            {/* Render the answer body only for the currently expanded question. */}
            {isOpen && (
              <div className="border-t border-gray-100 px-4 py-3 text-[13px] leading-6 text-gray-600 dark:border-white/10 dark:text-gray-300">
                {faq.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FaqAccordion;
