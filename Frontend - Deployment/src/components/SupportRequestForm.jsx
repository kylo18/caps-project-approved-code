// Render the support request form component.
const SupportRequestForm = ({
  formData,
  onChange,
  onSubmit,
  isSubmitting,
  error,
  buttonLabel = "Submit Request",
  subjectPlaceholder = "Briefly describe the issue",
  messagePlaceholder = "Tell us what happened and where you got stuck.",
}) => {
  return (
    // This component only renders the fields; parent components handle validation and submission.
    <form className="space-y-3" onSubmit={onSubmit}>
      <div>
        <label className="mb-1 block text-[13px] font-medium text-gray-700 dark:text-gray-200">
          Subject
        </label>
        <input
          type="text"
          name="subject"
          value={formData.subject}
          onChange={onChange}
          placeholder={subjectPlaceholder}
          maxLength={100}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-[14px] text-gray-900 transition outline-none focus:border-orange-500 dark:border-white/10 dark:bg-[var(--color-bg-tertiary)] dark:text-white"
        />
        <div className="mt-1 text-right text-[12px] text-gray-500 dark:text-gray-400">
          {formData.subject.length}/100
        </div>
      </div>

      <div>
        <label className="mb-1 block text-[13px] font-medium text-gray-700 dark:text-gray-200">
          Message
        </label>
        <textarea
          name="message"
          value={formData.message}
          onChange={onChange}
          rows={4}
          placeholder={messagePlaceholder}
          maxLength={1000}
          className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-[14px] text-gray-900 transition outline-none focus:border-orange-500 dark:border-white/10 dark:bg-[var(--color-bg-tertiary)] dark:text-white"
        />
        <div className="mt-1 text-right text-[12px] text-gray-500 dark:text-gray-400">
          {formData.message.length}/1000
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-500 dark:bg-red-950/40">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-orange-500 px-4 py-3 text-[14px] font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-500"
      >
        {/* Button text reflects the current submit state from the parent modal. */}
        {isSubmitting ? "Submitting..." : buttonLabel}
      </button>
    </form>
  );
};

export default SupportRequestForm;
