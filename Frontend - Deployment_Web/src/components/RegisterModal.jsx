import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import collegeLogo from "/src/assets/college-logo.png";
import RegisterDropDownSmall from "./registerDropDownSmall";
import Toast from "./Toast";
import useToast from "../hooks/useToast";

const STEPS = ["User", "Account", "Role", "Secure"];

// Removed StepSelect as we now use RegisterDropDownSmall with its own styling

// Simple text input
function StepInput({
  label,
  type = "text",
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  children,
}) {
  return (
    <div>
      <label className="outfit-500 mb-1.5 block text-sm text-gray-700">
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder || ""}
          className={`outfit-400 w-full rounded-lg border bg-gray-50 px-4 py-2.5 pr-10 text-sm text-gray-900 transition outline-none placeholder:text-gray-400 hover:border-gray-300 focus:bg-white focus:ring-2 ${
            error
              ? "border-red-400 focus:border-red-400 focus:ring-red-100"
              : "border-gray-200 focus:border-orange-400 focus:ring-orange-100"
          }`}
        />
        {children}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function RegisterModal({ isOpen, onClose, onSwitchToLogin }) {
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [userCode, setUserCode] = useState("");
  const [email, setEmail] = useState("");
  const [roleID, setRoleID] = useState("");
  const [campusID, setCampusID] = useState("");
  const [programID, setProgramID] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [errors, setErrors] = useState({});
  const [isRegistering, setIsRegistering] = useState(false);
  const [message, setMessage] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef(null);
  const { toast, showToast } = useToast();

  const allPrograms = [
    { id: "1", value: "1", label: "BS Computer Engineering" },
    { id: "2", value: "2", label: "BS Electrical Engineering" },
    { id: "3", value: "3", label: "BS Civil Engineering" },
    { id: "4", value: "4", label: "BS Electronics Engineering" },
    { id: "5", value: "5", label: "BS Agricultural Biosystem Engineering" },
  ];

  const getFilteredPrograms = () => {
    if (campusID === "2" || campusID === "3") {
      return allPrograms.filter((p) => p.id === "5");
    }
    return allPrograms.filter((p) => p.id !== "5");
  };

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Lock scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setFirstName("");
      setLastName("");
      setUserCode("");
      setEmail("");
      setRoleID("");
      setCampusID("");
      setProgramID("");
      setPassword("");
      setConfirmPassword("");
      setErrors({});
      setMessage("");
    }
  }, [isOpen]);

  // Tooltip outside click
  useEffect(() => {
    const handler = (e) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target))
        setShowTooltip(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Validations
  const validateStep1 = () => {
    const e = {};
    if (!firstName.trim()) e.firstName = "First name is required";
    if (!lastName.trim()) e.lastName = "Last name is required";
    return { isValid: Object.keys(e).length === 0, errors: e };
  };

  const validateEmail = (v) => {
    if (!v) return "Email address is required";
    if (!v.includes("@")) return "Email must contain @ symbol";
    return "";
  };

  const validateStep2 = () => {
    const e = {};
    if (!userCode.trim()) e.userCode = "User code is required";
    const emailErr = validateEmail(email);
    if (emailErr) e.email = emailErr;
    return { isValid: Object.keys(e).length === 0, errors: e };
  };

  const validateStep3 = () => {
    const e = {};
    if (!roleID) e.roleID = "Position is required";
    if (!campusID) e.campusID = "Campus is required";
    if (!programID) e.programID = "Program is required";
    return { isValid: Object.keys(e).length === 0, errors: e };
  };

  const validateStep4 = () => {
    const e = {};
    if (!password) e.password = "Password is required";
    else if (password.length < 8) e.password = "At least 8 characters required";
    if (password !== confirmPassword)
      e.confirmPassword = "Passwords do not match";
    return { isValid: Object.keys(e).length === 0, errors: e };
  };

  const handleNextStep = () => {
    const validators = [
      null,
      validateStep1,
      validateStep2,
      validateStep3,
      validateStep4,
    ];
    const result = validators[currentStep]();
    if (result.isValid) {
      setErrors({});
      setCurrentStep((s) => s + 1);
    } else {
      setErrors(result.errors);
    }
  };

  const handlePrevStep = () => {
    setErrors({});
    setCurrentStep((s) => s - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = validateStep4();
    if (!result.isValid) {
      setErrors(result.errors);
      return;
    }

    setIsRegistering(true);
    try {
      const res = await fetch(`${apiUrl}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userCode,
          firstName,
          lastName,
          email,
          password,
          roleID,
          campusID,
          programID,
        }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch {}

      if (res.ok) {
        setMessage(
          "Registration successful! Your account is pending approval.",
        );
        setErrors({});
        setTimeout(() => {
          onClose();
          onSwitchToLogin?.();
        }, 3000);
      } else {
        const msg = data.message || "Registration failed";
        setErrors((prev) => ({ ...prev, general: msg }));
        showToast(msg, "error");
      }
    } catch {
      const msg = "An error occurred. Please try again later.";
      setErrors((prev) => ({ ...prev, general: msg }));
      showToast(msg, "error");
    } finally {
      setIsRegistering(false);
    }
  };
  
  const handleGoogleLogin = () => {
    const frontendUrl = window.location.origin;
    window.location.href = `${apiUrl}/auth/google/redirect?frontend_url=${encodeURIComponent(frontendUrl)}`;
  };

  if (!isOpen) return null;

  return (
    <>
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[460px] rounded-2xl bg-white p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        <div className="mb-5 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center">
            <img
              src={collegeLogo}
              alt="CAPS logo"
              className="size-12 object-contain"
            />
          </div>
        </div>

        {/* Heading */}
        <div className="mb-6 text-center">
          <h2 className="outfit-700 text-[22px] text-gray-900">
            Create an account
          </h2>
          <p className="outfit-400 mt-1 text-sm text-gray-500">
            Please enter your details to register.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Step 1: Name */}
          {currentStep === 1 && (
            <>
              <StepInput
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                error={errors.firstName}
                placeholder="e.g. Juan"
              />
              <StepInput
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                error={errors.lastName}
                placeholder="e.g. Dela Cruz"
              />
            </>
          )}

          {/* Step 2: Account info */}
          {currentStep === 2 && (
            <>
              <div>
                <div className="mb-1.5 flex items-center gap-2">
                  <label className="outfit-500 mb-1.5 block text-sm text-gray-700">
                    ID Code
                  </label>
                  <div className="relative" ref={tooltipRef}>
                    <button
                      type="button"
                      onClick={() => setShowTooltip((v) => !v)}
                      className="text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      <i className="bx bx-help-circle text-[16px]"></i>
                    </button>
                    {showTooltip && (
                      <div className="outfit-400 absolute top-6 left-0 z-50 w-52 rounded-lg bg-gray-800 px-3 py-2 text-xs text-white shadow-lg">
                        Format: XX-X-XXXXX (e.g., 23-A-12345)
                      </div>
                    )}
                  </div>
                </div>
                <input
                  type="text"
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value)}
                  placeholder="e.g. 23-A-12345"
                  className={`outfit-400 w-full rounded-lg border bg-gray-50 px-4 py-2.5 text-sm text-gray-900 transition outline-none placeholder:text-gray-400 hover:border-gray-300 focus:bg-white focus:ring-2 ${
                    errors.userCode
                      ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                      : "border-gray-200 focus:border-orange-400 focus:ring-orange-100"
                  }`}
                />
                {errors.userCode && (
                  <p className="mt-1 text-xs text-red-500">{errors.userCode}</p>
                )}
              </div>
              <StepInput
                label="Email Address"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                placeholder="you@example.com"
              />
            </>
          )}

          {/* Step 3: Role, campus, program */}
          {currentStep === 3 && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="outfit-500 mb-1.5 block text-sm text-gray-700">
                  Campus
                </label>
                <div
                  className={
                    errors.campusID ? "rounded-xl ring-2 ring-red-400" : ""
                  }
                >
                  <RegisterDropDownSmall
                    name="Campus"
                    value={campusID}
                    onChange={(e) => {
                      setCampusID(e.target.value);
                      setProgramID("");
                    }}
                    placeholder="Select Campus"
                    options={[
                      { value: "1", label: "Dapitan" },
                      { value: "2", label: "Katipunan" },
                      { value: "3", label: "Tampilisan" },
                    ]}
                  />
                </div>
                {errors.campusID && (
                  <p className="mt-1 text-xs text-red-500">{errors.campusID}</p>
                )}
              </div>

              <div>
                <label className="outfit-500 mb-1.5 block text-sm text-gray-700">
                  Position
                </label>
                <div
                  className={
                    errors.roleID ? "rounded-xl ring-2 ring-red-400" : ""
                  }
                >
                  <RegisterDropDownSmall
                    name="Position"
                    value={roleID}
                    onChange={(e) => setRoleID(e.target.value)}
                    placeholder="Select Position"
                    options={[
                      { value: "1", label: "Student" },
                      { value: "2", label: "Instructor" },
                      { value: "3", label: "Program Chair" },
                      { value: "5", label: "Associate Dean" },
                      { value: "4", label: "Dean" },
                    ]}
                  />
                </div>
                {errors.roleID && (
                  <p className="mt-1 text-xs text-red-500">{errors.roleID}</p>
                )}
              </div>

              <div>
                <label className="outfit-500 mb-1.5 block text-sm text-gray-700">
                  Program
                </label>
                <div
                  className={
                    errors.programID ? "rounded-xl ring-2 ring-red-400" : ""
                  }
                >
                  <RegisterDropDownSmall
                    name="Program"
                    value={programID}
                    onChange={(e) => setProgramID(e.target.value)}
                    placeholder="Select Program"
                    options={getFilteredPrograms()}
                  />
                </div>
                {errors.programID && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.programID}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Password */}
          {currentStep === 4 && (
            <>
              <StepInput
                label="Password"
                type={passwordVisible ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                placeholder="Min. 8 characters"
              >
                <button
                  type="button"
                  onClick={() => setPasswordVisible((v) => !v)}
                  tabIndex={-1}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <i
                    className={`bx ${passwordVisible ? "bx-eye-alt text-orange-500" : "bx-eye-slash"} text-[20px]`}
                  ></i>
                </button>
              </StepInput>
              <StepInput
                label="Confirm Password"
                type={confirmPasswordVisible ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={errors.confirmPassword}
                placeholder="Re-enter password"
              >
                <button
                  type="button"
                  onClick={() => setConfirmPasswordVisible((v) => !v)}
                  tabIndex={-1}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <i
                    className={`bx ${confirmPasswordVisible ? "bx-eye-alt text-orange-500" : "bx-eye-slash"} text-[20px]`}
                  ></i>
                </button>
              </StepInput>

              {errors.general && (
                <p className="text-center text-xs text-red-500">
                  {errors.general}
                </p>
              )}
              {message && (
                <div className="rounded-lg bg-green-50 p-3 text-center">
                  <p className="text-sm font-medium text-green-600">
                    {message}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Redirecting to login...
                  </p>
                </div>
              )}
            </>
          )}

          {/* Navigation buttons */}
          <div className="mt-2 flex gap-3">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="outfit-400 flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 active:scale-[0.98]"
              >
                <i className="bx bx-left-arrow-alt text-[16px]"></i>
                Back
              </button>
            )}

            {currentStep < STEPS.length ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="outfit-400 flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-orange-500 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 active:scale-[0.98]"
              >
                Next
                <i className="bx bx-right-arrow-alt text-[16px]"></i>
              </button>
            ) : (
              <button
                type="submit"
                disabled={isRegistering || !!message}
                className="outfit-400 flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-green-500 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-600 active:scale-[0.98] disabled:opacity-60"
              >
                {isRegistering ? (
                  <span className="loader-white"></span>
                ) : (
                  "Create Account"
                )}
              </button>
            )}
          </div>

          {/*
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400">OR</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          
          <button
            //onClick={() => alert("Google Sign-In is coming soon.")}
            onClick={handleGoogleLogin}
            type="button"
            className="outfit-400 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 py-2.5 text-sm text-gray-700 transition hover:bg-gray-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 488 512"
            >
              <path
                fill="#4285F4"
                d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C326.6 103.1 289.1 87 248 87c-93.5 0-170.5 73.4-170.5 169S154.5 425 248 425c85.9 0 148.7-56.5 155.8-132H248v-85.8h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
              />
            </svg>
            Register with Google
          </button> */}

          {/* Login link */}
          <p className="outgit-400 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <span
              onClick={() => {
                onClose();
                //onSwitchToLogin?.();
              }}
              className="cursor-pointer font-medium text-orange-500 hover:underline"
            >
              Log in
            </span>
          </p>
        </form>
      </div>
    </div>

      <Toast message={toast.message} type={toast.type} show={toast.show} />
    </>
  );
}
