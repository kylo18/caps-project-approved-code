/**
 * WarningModal — warning/confirmation modal.
 *
 * Props:
 *  isOpen        {boolean}   – controls visibility
 *  onClose       {function}  – called when backdrop or X is clicked
 *  title         {string}    – modal heading
 *  subtitle      {string}    – small text below heading (e.g. "You have an unfinished attempt.")
 *  description   {ReactNode} – body text / JSX shown in the modal body
 *  confirmLabel  {string}    – label for the primary (orange) button  [default: "Confirm"]
 *  confirmIcon   {ReactNode} – optional icon before the confirmLabel
 *  onConfirm     {function}  – called when the primary button is clicked
 *  cancelLabel   {string}    – label for the secondary button           [default: "Cancel"]
 *  cancelIcon    {ReactNode} – optional icon before the cancelLabel
 *  onCancel      {function}  – called when the secondary button is clicked (falls back to onClose)
 *  headerIcon    {string}    – boxicons class suffix for the header icon     [default: "bx-alert-circle"]
 */
const WarningModal = ({
  isOpen,
  onClose,
  title = "Warning",
  subtitle,
  description,
  confirmLabel = "Confirm",
  confirmIcon,
  onConfirm,
  cancelLabel = "Cancel",
  cancelIcon,
  onCancel,
  isConfirmLoading = false,
  isCancelLoading = false,
  headerIcon = "bx-alert-circle",
}) => {
  if (!isOpen) return null;

  const handleCancel = onCancel ?? onClose;

  return (
    <div
      className="lightbox-bg fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="animate-fade-in-up w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex justify-between gap-3 px-5 py-5"
          style={{ background: "#fff8f5" }}
        >
          <div className="flex items-start gap-4">
            <div className="mt-1.5 flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white shadow">
              <i className={`bx ${headerIcon} text-xl`} />
            </div>
            <div>
              <h3 className="outfit-700 text-[17px] font-bold text-gray-900">
                {title}
              </h3>
              {subtitle && (
                <p className="outfit-400 text-[13px] text-amber-700">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Close (X) */}
          <button
            onClick={onClose}
            className="flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <i className="bx bx-x text-xl" />
          </button>
        </div>

        {/* Body */}
        {description && (
          <div className="px-6 py-5">
            <div className="outfit-400 text-center text-[12px] text-gray-600 md:text-[14px]">
              {description}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="outfit-400 flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
          {/* Primary action */}
          {onConfirm && (
            <button
              onClick={onConfirm}
              disabled={isConfirmLoading}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-orange-600 active:scale-95 disabled:pointer-events-none disabled:opacity-70"
            >
              {!isConfirmLoading && confirmIcon}
              {isConfirmLoading ? "Loading..." : confirmLabel}
            </button>
          )}

          {/* Secondary action */}
          <button
            onClick={handleCancel}
            disabled={isCancelLoading || isConfirmLoading}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-5 py-2.5 text-[14px] font-medium text-gray-700 transition hover:bg-gray-100 active:scale-95 disabled:pointer-events-none disabled:opacity-70"
          >
            {!isCancelLoading && cancelIcon}
            {isCancelLoading ? "Loading..." : cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WarningModal;
