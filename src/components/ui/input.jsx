import React from "react";

const Input = React.forwardRef(({ className = "", type = "text", ...props }, ref) => {
  const baseStyles = "flex h-10 w-full min-w-0 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 outline-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-purple-500 focus-visible:ring-[3px] focus-visible:ring-purple-500/20";
  return (
    <input
      type={type}
      ref={ref}
      className={`${baseStyles} ${className}`}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };