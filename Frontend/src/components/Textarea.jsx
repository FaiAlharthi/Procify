function Textarea({ value, onChange, placeholder, rows = 3, id, name, ...props }) {
  return (
    <textarea
      id={id}
      name={name}
      className="textarea"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      {...props}
    />
  );
}

export default Textarea;
