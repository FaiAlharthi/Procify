import { useState } from 'react';

function EyeIcon({ off }) {
  return off ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.9 4.2A9.1 9.1 0 0 1 12 4c6.5 0 10 7 10 7a13.2 13.2 0 0 1-2.2 3M6.6 6.6A13.3 13.3 0 0 0 2 11s3.5 7 10 7a9 9 0 0 0 3.4-.6" />
      <path d="M3 3l18 18" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function InputField({ label, type = 'text', placeholder, value, onChange, id, ...props }) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (show ? 'text' : 'password') : type;

  return (
    <div className="field">
      {label && (
        <label className="field-label" htmlFor={id}>{label}</label>
      )}
      <div className="field-control">
        <input
          id={id}
          className={`field-input ${isPassword ? 'has-eye' : ''}`}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            className="field-eye"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            <EyeIcon off={show} />
          </button>
        )}
      </div>
    </div>
  );
}

export default InputField;
