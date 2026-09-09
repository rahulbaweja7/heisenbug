import { useEffect, useRef } from "react";
import "./Modal.css";

type Props = {
  title: string;
  message?: string;
  input?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  error?: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function Modal({
  title,
  message,
  input,
  error,
  confirmLabel,
  cancelLabel = "Cancel",
  danger,
  onConfirm,
  onCancel,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div id="modal-title" className="modal-title">
          {title}
        </div>
        {message && <p className="modal-message">{message}</p>}
        {input && (
          <input
            ref={inputRef}
            className="modal-input"
            value={input.value}
            placeholder={input.placeholder}
            onChange={(e) => input.onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onConfirm();
            }}
          />
        )}
        {error && <div className="modal-error">{error}</div>}
        <div className="modal-actions">
          <button className="modal-cancel" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={danger ? "modal-confirm danger" : "modal-confirm"}
            onClick={onConfirm}
            autoFocus={!input}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
