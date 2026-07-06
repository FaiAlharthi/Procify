function Button({ children, variant = 'primary', type = 'button', className = '', ...props }) {
  return (
    <button className={`btn btn-${variant} ${className}`.trim()} type={type} {...props}>
      {children}
    </button>
  );
}

export default Button;
