import React from 'react'

const InputField = ({ label, type, icon, value, onChange, placeholder, error, onBlur}) => {
  return (
    <div className="mb-4">
      <div className="flex flex-col space-y-1">
        <label className="block text-sm">{label}</label>
        <div className="flex items-center border border-gray-400 rounded-[2px] overflow-hidden group focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-300">
          <div className="p-2 flex items-center justify-center size-10 border-gray-400 group-focus-within:border-blue-500">
            <i className={`bx ${icon} text-[24px] text-orange-500`}></i>
          </div>
          <input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            className="flex-1 p-1 text-sm border-none focus:outline-none"
            onBlur={onBlur}
            required
          />
        </div>
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>
    </div>
  );
};

export default InputField;
