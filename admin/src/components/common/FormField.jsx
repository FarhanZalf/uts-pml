export default function FormField({
  label,
  error,
  helper,
  required = false,
  htmlFor,
  children,
  className = '',
  style = {},
}) {
  return (
    <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px', ...style }} className={className}>
      {label && (
        <label
          htmlFor={htmlFor}
          style={{
            fontSize: '13px',
            fontWeight: '600',
            color: '#334155',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {label}
          {required && <span style={{ color: '#EF4444' }}>*</span>}
        </label>
      )}

      {children}

      {error ? (
        <span style={{ fontSize: '12px', color: '#DC2626', marginTop: '2px' }}>
          {Array.isArray(error) ? error[0] : error}
        </span>
      ) : helper ? (
        <span style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
          {helper}
        </span>
      ) : null}
    </div>
  );
}
