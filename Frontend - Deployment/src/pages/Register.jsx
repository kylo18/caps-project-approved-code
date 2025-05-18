import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import univLogo from "/src/assets/univLogo.png";
import collegeLogo from "/src/assets/college-logo.png";
import RegisterDropDown from "../components/registerDropDown.jsx";
import AppVersion from "../components/appVersion.jsx";
import RegisterDropDownSmall from "../components/registerDropDownSmall.jsx";

export default function Register() {
  const [userCode, setUserCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [roleID, setRoleID] = useState("");
  const [campusID, setCampusID] = useState("");
  const [programID, setProgramID] = useState("");

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [emailError, setEmailError] = useState("");

  const [errors, setErrors] = useState({});
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const [message, setMessage] = useState("");

  const allPrograms = [
    { id: "1", name: "Bachelor of Science in Computer Engineering" },
    { id: "2", name: "Bachelor of Science in Electrical Engineering" },
    { id: "3", name: "Bachelor of Science in Civil Engineering" },
    {
      id: "4",
      name: "Bachelor of Science in Electronics and Communication Engineering",
    },
    {
      id: "5",
      name: "Bachelor of Science in Agricultural Biosystem Engineering",
    },
  ];

  const getFilteredPrograms = () => {
    if (campusID === "2" || campusID === "3") {
      return allPrograms.filter((program) => program.id === "5");
    }
    return allPrograms.filter((program) => program.id !== "5");
  };

  // Add email validation function
  const validateEmail = (value) => {
    if (!value) {
      return "Email address is required";
    }
    if (!value.includes("@")) {
      return "Email must contain @ symbol";
    }
    return "";
  };

  // Add email blur handler
  const handleEmailBlur = (e) => {
    setEmailTouched(true);
    const error = validateEmail(e.target.value);
    setEmailError(error);
  };

  // Update email change handler
  const handleEmailChange = (e) => {
    const newValue = e.target.value;
    setEmail(newValue);
    if (emailTouched) {
      const error = validateEmail(newValue);
      setEmailError(error);
    }
  };

  // Add validation functions for each step
  const validateStep1 = () => {
    const errors = {};
    if (!firstName.trim()) {
      errors.firstName = "First name is required";
    }
    if (!lastName.trim()) {
      errors.lastName = "Last name is required";
    }
    return { isValid: Object.keys(errors).length === 0, errors };
  };

  const validateStep2 = () => {
    const errors = {};
    if (!userCode.trim()) {
      errors.userCode = "User code is required";
    }
    const emailValidation = validateEmail(email);
    if (emailValidation) {
      errors.email = emailValidation;
    }
    return { isValid: Object.keys(errors).length === 0, errors };
  };

  const validateStep3 = () => {
    const errors = {};
    if (!roleID) {
      errors.roleID = "Position is required";
    }
    if (!campusID) {
      errors.campusID = "Campus is required";
    }
    if (!programID) {
      errors.programID = "Program is required";
    }
    return { isValid: Object.keys(errors).length === 0, errors };
  };

  const validateStep4 = () => {
    const errors = {};
    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters long";
    }
    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    return { isValid: Object.keys(errors).length === 0, errors };
  };

  // Add password validation function
  const validatePassword = (value) => {
    if (!value) {
      return "Password is required";
    }
    if (value.length < 8) {
      return "Password must be at least 8 characters long";
    }
    return "";
  };

  // Add password blur handler
  const handlePasswordBlur = (e) => {
    setPasswordTouched(true);
    const error = validatePassword(e.target.value);
    setPasswordError(error);
  };

  // Update password change handler
  const handlePasswordChange = (e) => {
    const newValue = e.target.value;
    setPassword(newValue);
    if (passwordTouched) {
      const error = validatePassword(newValue);
      setPasswordError(error);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    let validationErrors = {};
    let nextStep = currentStep;

    // Step 1 Validation
    validationErrors = validateStep1().errors;
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setCurrentStep(nextStep);
      return;
    }

    // Step 3 Validation
    validationErrors = validateStep3().errors;
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setCurrentStep(nextStep);
      return;
    }

    // Step 4 Validation
    validationErrors = validateStep4();
    if (Object.keys(validationErrors.errors).length > 0) {
      setErrors(validationErrors.errors);
      setCurrentStep(nextStep);
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

      let data;
      try {
        data = await res.json(); // ⚠️ This might fail if response is empty or invalid
      } catch (jsonErr) {
        console.warn("JSON parse failed:", jsonErr);
        data = {}; // fallback if API didn't return JSON
      }

      if (res.ok) {
        setMessage(
          "Registration successful! Your account is pending approval. You will be notified once approved.",
        );
        setErrors({});
        // Add a delay before navigation to allow user to read the message
        setTimeout(() => {
          navigate("/");
        }, 3000);
      } else {
        setErrors((prev) => ({
          ...prev,
          general: data.message || "Registration failed",
        }));
      }
    } catch (error) {
      console.error("Network or other error during registration:", error);
      setErrors((prev) => ({
        ...prev,
        general: "An error occurred. Please try again later.",
      }));
    } finally {
      setIsRegistering(false);
    }
  };

  const handleNextStep = () => {
    let validationResult;
    switch (currentStep) {
      case 1:
        validationResult = validateStep1();
        break;
      case 2:
        validationResult = validateStep2();
        break;
      case 3:
        validationResult = validateStep3();
        break;
      case 4:
        validationResult = validateStep4();
        break;
      default:
        validationResult = { isValid: false, errors: {} };
    }

    if (validationResult.isValid) {
      setErrors({});
      setCurrentStep((prevStep) => prevStep + 1);
    } else {
      setErrors(validationResult.errors);
    }
  };

  const handlePrevStep = () => {
    setErrors({});
    setCurrentStep((prevStep) => prevStep - 1);
  };

  return (
    <>
      {/* This is the Desktop view */}
      <div className="relative hidden min-h-screen w-full bg-[url('/login-bg.png')] bg-cover bg-center bg-no-repeat lg:block">
        {/* Left Section */}
        <div className="flex min-h-screen flex-row">
          <div className="mr-10 flex w-full flex-col items-center justify-center p-6 text-white lg:w-1/2">
            {/* Logos */}
            <div className="absolute top-3 left-3 flex items-center space-x-2">
              <img src={univLogo} alt="Logo 1" className="size-8" />
              <img src={collegeLogo} alt="Logo 2" className="size-8" />
              <h1 className="text-xs lg:text-lg">
                JOSE RIZAL MEMORIAL STATE UNIVERSITY
              </h1>
            </div>

            {/* Title */}
            <div className="mt-20 hidden flex-col items-center justify-center lg:flex">
              <h1 className="text-3xl leading-snug font-bold lg:text-4xl">
                <span className="text-5xl text-orange-500">C</span>OMPREHENSIVE
                <br />
                <span className="text-5xl text-orange-500">A</span>SSESSMENT AND
                <br />
                <span className="text-5xl text-orange-500">P</span>REPARATION
                <br />
                <span className="text-5xl text-orange-500">S</span>YSTEM
              </h1>
              <p className="mt-20 mr-10 hidden max-w-xs text-center text-sm text-gray-500 lg:block">
                A platform designed to help students practice and prepare for
                qualifying exams while assessing their knowledge through
                randomized questions.
              </p>
            </div>

            <div className="font-inter mt-12 flex flex-col items-center justify-center lg:hidden">
              <h1 className="text-center text-[20px] leading-snug font-bold tracking-wide whitespace-nowrap text-white sm:text-[30px]">
                <span>
                  <span className="text-3xl text-orange-500">C</span>
                  OMPREHENSIVE
                </span>
                <span>
                  <span className="text-3xl text-orange-500"> A</span>SSESSMENT
                </span>
                <br />
                <span>AND</span>
                <span>
                  <span className="text-3xl text-orange-500"> P</span>REPARATION
                </span>
                <span>
                  <span className="text-3xl text-orange-500"> S</span>YSTEM
                </span>
              </h1>
            </div>
          </div>

          {/* Right Section */}
          <div className="mt-30 flex w-full items-center justify-center p-6 sm:mt-30 md:mt-30 lg:mt-0 lg:w-1/2">
            <div className="w-full max-w-xs space-y-6 sm:max-w-md">
              <div
                style={{ fontFamily: "Poppins, sans-serif" }}
                className="text-center sm:ml-10 lg:ml-0"
              >
                <h2 className="mr-15 mb-1 text-[20px] font-bold text-gray-900">
                  REGISTER ACCOUNT
                </h2>
                <p className="mt-2 justify-center text-center text-sm text-gray-500 lg:mr-15">
                  <span>
                    Get started by entering your credentials to register{" "}
                  </span>
                  <span>and create your account.</span>
                </p>

                <div className="w-full max-w-sm">
                  <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div
                      className={`transition-opacity duration-300 ease-in-out ${
                        currentStep === 1 ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      {/* Step 1 Content */}
                      {currentStep === 1 && (
                        <div className="mt-4">
                          {" "}
                          <div className="relative mb-[13px]">
                            <div className="relative">
                              <input
                                type="text"
                                id="firstName"
                                className="peer mt-2 w-full rounded-xl border border-gray-300 px-4 py-[8px] text-base text-gray-900 placeholder-transparent transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                                placeholder="User Code"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                              />
                              <label
                                htmlFor="First Name"
                                className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 bg-white px-1 text-base text-gray-500 transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:mt-1 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:mt-0 peer-focus:text-xs peer-focus:text-[#FE6902] peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:text-xs"
                              >
                                First Name
                              </label>
                            </div>

                            {errors.firstName && (
                              <p className="mt-1 ml-3 text-xs text-red-500">
                                {errors.firstName}
                              </p>
                            )}
                          </div>
                          <div className="relative mb-4">
                            <div className="relative">
                              <input
                                type="text"
                                id="lastName"
                                className="peer mt-2 w-full rounded-xl border border-gray-300 px-4 py-[8px] text-base text-gray-900 placeholder-transparent transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                                placeholder="User Code"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                              />
                              <label
                                htmlFor="Last Name"
                                className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 bg-white px-1 text-base text-gray-500 transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:mt-1 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:mt-0 peer-focus:text-xs peer-focus:text-[#FE6902] peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:text-xs"
                              >
                                Last Name
                              </label>
                            </div>

                            {errors.lastName && (
                              <p className="mt-1 ml-3 text-xs text-red-500">
                                {errors.lastName}
                              </p>
                            )}
                          </div>
                          <div className="flex justify-center gap-4">
                            <button
                              type="button"
                              onClick={handleNextStep}
                              disabled={!validateStep1().isValid}
                              className={`mt-3 mb-1 w-[30%] cursor-pointer rounded-xl py-[9px] text-base font-semibold text-white shadow-md transition-all duration-200 ease-in-out active:scale-[0.98] active:shadow-sm ${
                                validateStep1().isValid
                                  ? "bg-gradient-to-r from-[#ed3700] to-[#FE6902] hover:brightness-150"
                                  : "cursor-not-allowed bg-gray-400"
                              }`}
                            >
                              <span className="flex items-center justify-center gap-2 text-[16px]">
                                Next
                                <i className="bx bx-right-arrow-alt text-[18px]"></i>
                              </span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div
                      className={`transition-opacity duration-300 ease-in-out ${
                        currentStep === 2 ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      {/* Step 2 Content */}
                      {currentStep === 2 && (
                        <>
                          <div className="relative mb-3">
                            <div className="relative">
                              <input
                                type="text"
                                id="userCode"
                                className="peer mt-2 w-full rounded-xl border border-gray-300 px-4 py-[8px] text-base text-gray-900 placeholder-transparent transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                                placeholder="User Code"
                                value={userCode}
                                onChange={(e) => setUserCode(e.target.value)}
                              />
                              <label
                                htmlFor="User Code"
                                className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 bg-white px-1 text-base text-gray-500 transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:mt-1 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:mt-0 peer-focus:text-xs peer-focus:text-[#FE6902] peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:text-xs"
                              >
                                User Code (e.g 23-A-XXXXX)
                              </label>
                            </div>

                            {errors.userCode && (
                              <p className="mt-1 ml-3 text-xs text-red-500">
                                {errors.userCode}
                              </p>
                            )}
                          </div>

                          <div className="relative mb-4">
                            <div className="relative">
                              <input
                                type="text"
                                id="email"
                                className={`peer mt-2 w-full rounded-xl border px-4 py-2 text-base text-gray-900 placeholder-transparent transition-all duration-200 focus:outline-none ${
                                  emailTouched && emailError
                                    ? "border-red-500 focus:border-red-500"
                                    : "border-gray-300 hover:border-gray-500 focus:border-[#FE6902]"
                                }`}
                                placeholder="Email"
                                value={email}
                                onChange={handleEmailChange}
                                onBlur={handleEmailBlur}
                              />
                              <label
                                htmlFor="Email"
                                className={`pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 bg-white px-1 text-base transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:mt-1 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:mt-0 peer-focus:text-xs peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:text-xs ${
                                  emailTouched && emailError
                                    ? "text-red-500 peer-focus:text-red-500"
                                    : "text-gray-500 peer-focus:text-[#FE6902]"
                                }`}
                              >
                                Email Address
                              </label>
                            </div>
                            {emailTouched && emailError && (
                              <p className="mt-1 ml-3 text-start text-xs text-red-500">
                                {emailError}
                              </p>
                            )}
                          </div>

                          <div className="flex justify-center gap-3">
                            <button
                              type="button"
                              onClick={handlePrevStep}
                              className="border-color mt-3 mb-1 w-[30%] cursor-pointer rounded-xl border bg-white py-[9px] text-base font-semibold text-black shadow-md transition-all duration-200 ease-in-out hover:bg-gray-100 active:scale-[0.98] active:shadow-sm disabled:opacity-60"
                            >
                              <span className="flex items-center justify-center gap-2 text-[16px]">
                                <i className="bx bx-left-arrow-alt text-[18px]"></i>
                                Back
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={handleNextStep}
                              disabled={!validateStep2().isValid}
                              className={`mt-3 mb-1 w-[30%] cursor-pointer rounded-xl py-[9px] text-base font-semibold text-white shadow-md transition-all duration-200 ease-in-out active:scale-[0.98] active:shadow-sm ${
                                validateStep2().isValid
                                  ? "bg-gradient-to-r from-[#ed3700] to-[#FE6902] hover:brightness-150"
                                  : "cursor-not-allowed bg-gray-400"
                              }`}
                            >
                              <span className="flex items-center justify-center gap-2 text-[16px]">
                                Next
                                <i className="bx bx-right-arrow-alt text-[18px]"></i>
                              </span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    <div
                      className={`transition-opacity duration-300 ease-in-out ${
                        currentStep === 3 ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      {currentStep === 3 && (
                        <div>
                          <div className="mb-4 flex gap-4">
                            <div className="w-full">
                              <RegisterDropDownSmall
                                name="Campus"
                                value={campusID}
                                onChange={(e) => setCampusID(e.target.value)}
                                placeholder="Select Campus"
                                options={[
                                  { value: "1", label: "Dapitan" },
                                  { value: "2", label: "Katipunan" },
                                  { value: "3", label: "Tampilisan" },
                                ]}
                              />
                              {errors.campusID && (
                                <p className="ml-3 text-xs text-red-500">
                                  {errors.campusID}
                                </p>
                              )}
                            </div>

                            <div className="w-full">
                              <RegisterDropDownSmall
                                name="Position"
                                value={roleID}
                                onChange={(e) => setRoleID(e.target.value)}
                                placeholder="Select Position"
                                options={[
                                  { value: "1", label: "Student" },
                                  { value: "2", label: "Instructor" },
                                  { value: "3", label: "Program Chair" },
                                  { value: "4", label: "Dean" },
                                ]}
                              />
                              {errors.roleID && (
                                <p className="ml-3 text-xs text-red-500">
                                  {errors.roleID}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="w-full">
                            <RegisterDropDownSmall
                              name="programID"
                              value={programID}
                              onChange={(e) => setProgramID(e.target.value)}
                              options={getFilteredPrograms().map((program) => ({
                                value: program.id,
                                label: program.name,
                              }))}
                              placeholder="Select Program"
                            />
                            {errors.programID && (
                              <p className="ml-3 text-xs text-red-500">
                                {errors.programID}
                              </p>
                            )}
                          </div>

                          <div className="mt-2 flex justify-center gap-3">
                            <button
                              type="button"
                              onClick={handlePrevStep}
                              className="border-color mt-3 mb-1 w-[30%] cursor-pointer rounded-xl border bg-white py-[9px] text-base font-semibold text-black shadow-md transition-all duration-200 ease-in-out hover:bg-gray-100 active:scale-[0.98] active:shadow-sm disabled:opacity-60"
                            >
                              <span className="flex items-center justify-center gap-2 text-[16px]">
                                <i className="bx bx-left-arrow-alt text-[18px]"></i>
                                Back
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={handleNextStep}
                              disabled={!validateStep3().isValid}
                              className={`mt-3 mb-1 w-[30%] cursor-pointer rounded-xl py-[9px] text-base font-semibold text-white shadow-md transition-all duration-200 ease-in-out active:scale-[0.98] active:shadow-sm ${
                                validateStep3().isValid
                                  ? "bg-gradient-to-r from-[#ed3700] to-[#FE6902] hover:brightness-150"
                                  : "cursor-not-allowed bg-gray-400"
                              }`}
                            >
                              <span className="flex items-center justify-center gap-2 text-[16px]">
                                Next
                                <i className="bx bx-right-arrow-alt text-[18px]"></i>
                              </span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div
                      className={`transition-opacity duration-300 ease-in-out ${
                        currentStep === 4 ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      {currentStep === 4 && (
                        <>
                          {/* Password */}
                          <div className="relative mb-4">
                            <div className="relative">
                              <input
                                type={passwordVisible ? "text" : "password"}
                                className={`peer mt-2 w-full rounded-xl border px-4 py-2 text-base text-gray-900 placeholder-transparent transition-all duration-200 focus:outline-none ${
                                  passwordTouched && passwordError
                                    ? "border-red-500 focus:border-red-500"
                                    : "border-gray-300 hover:border-gray-500 focus:border-[#FE6902]"
                                }`}
                                placeholder=" "
                                value={password}
                                onChange={handlePasswordChange}
                                onBlur={handlePasswordBlur}
                                autoComplete="current-password"
                              />
                              <label
                                htmlFor="password"
                                className={`pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 bg-white px-1 text-base transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:mt-1 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:mt-0 peer-focus:text-xs peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:text-xs ${
                                  passwordTouched && passwordError
                                    ? "text-red-500 peer-focus:text-red-500"
                                    : "text-gray-500 peer-focus:text-[#FE6902]"
                                }`}
                              >
                                Password
                              </label>
                              <button
                                type="button"
                                className="absolute top-[16px] right-3 text-gray-400"
                                onClick={() => setPasswordVisible((v) => !v)}
                                tabIndex={-1}
                              >
                                <i
                                  className={`bx ${passwordVisible ? "bx-show text-orange-500" : "bx-hide"} text-[25px]`}
                                ></i>
                              </button>
                            </div>
                            {passwordTouched && passwordError && (
                              <p className="mt-1 ml-3 text-start text-xs text-red-500">
                                {passwordError}
                              </p>
                            )}
                          </div>

                          <div className="relative mb-4">
                            <div className="relative">
                              <input
                                type={
                                  confirmPasswordVisible ? "text" : "password"
                                }
                                className={`peer mt-2 w-full rounded-xl border px-4 py-2 text-base text-gray-900 placeholder-transparent transition-all duration-200 focus:outline-none ${
                                  passwordTouched &&
                                  password !== confirmPassword
                                    ? "border-red-500 focus:border-red-500"
                                    : "border-gray-300 hover:border-gray-500 focus:border-[#FE6902]"
                                }`}
                                value={confirmPassword}
                                onChange={(e) =>
                                  setConfirmPassword(e.target.value)
                                }
                                placeholder=""
                                autoComplete="current-password"
                              />
                              <label
                                htmlFor="confirmPassword"
                                className={`pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 bg-white px-1 text-base transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:mt-1 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:mt-0 peer-focus:text-xs peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:text-xs ${
                                  passwordTouched &&
                                  password !== confirmPassword
                                    ? "text-red-500 peer-focus:text-red-500"
                                    : "text-gray-500 peer-focus:text-[#FE6902]"
                                }`}
                              >
                                Confirm Password
                              </label>
                              <button
                                type="button"
                                className="absolute top-[16px] right-3 text-gray-400"
                                onClick={() =>
                                  setConfirmPasswordVisible(
                                    !confirmPasswordVisible,
                                  )
                                }
                                tabIndex={-1}
                              >
                                <i
                                  className={`bx ${confirmPasswordVisible ? "bx-show text-orange-500" : "bx-hide"} text-[25px]`}
                                ></i>
                              </button>
                            </div>
                            {passwordTouched &&
                              password !== confirmPassword && (
                                <p className="mt-1 ml-3 text-start text-xs text-red-500">
                                  Passwords do not match
                                </p>
                              )}
                          </div>

                          {/* Error / Message */}
                          {errors.general && (
                            <p className="text-center text-red-500">
                              {errors.general}
                            </p>
                          )}
                          {message && (
                            <div className="text-center">
                              <p className="mb-2 text-green-500">{message}</p>
                              <p className="text-sm text-gray-600">
                                Redirecting to login page...
                              </p>
                            </div>
                          )}

                          {/* Buttons */}
                          <div className="flex justify-center gap-3">
                            <button
                              type="button"
                              onClick={handlePrevStep}
                              className="border-color mt-3 mb-1 w-[30%] cursor-pointer rounded-xl border bg-white py-[9px] text-base font-semibold text-black shadow-md transition-all duration-200 ease-in-out hover:bg-gray-100 active:scale-[0.98] active:shadow-sm disabled:opacity-60"
                            >
                              <span className="flex items-center justify-center gap-2 text-[16px]">
                                <i className="bx bx-left-arrow-alt text-[18px]"></i>
                                Back
                              </span>
                            </button>

                            <button
                              type="submit"
                              disabled={
                                !validateStep4().isValid || isRegistering
                              }
                              className={`mt-3 mb-1 w-[30%] cursor-pointer rounded-xl py-[9px] text-base font-semibold text-white shadow-md transition-all duration-200 ease-in-out active:scale-[0.98] active:shadow-sm ${
                                validateStep4().isValid && !isRegistering
                                  ? "bg-gradient-to-r from-[#19de12] to-[#00a426] hover:brightness-120"
                                  : "cursor-not-allowed bg-gray-400"
                              }`}
                            >
                              {isRegistering ? (
                                <div className="flex items-center justify-center">
                                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                                </div>
                              ) : (
                                "Register"
                              )}
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    <p className="mt-5 justify-center text-center text-[14px] text-gray-600">
                      Already have an account?{" "}
                      <span
                        className="cursor-pointer text-orange-500 hover:underline"
                        onClick={() => navigate("/")}
                      >
                        Log-in
                      </span>
                    </p>

                    <span className="mx-2 text-xs text-gray-400">
                      Developed by{" "}
                      <span className="text-orange-500">Team Caps</span>
                    </span>
                  </form>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 transform items-center space-x-2 text-black lg:left-8">
            <AppVersion />
          </div>
        </div>
      </div>

      {/* This is the mobile view */}
      <div className="lg:hidden">
        <div className="flex flex-col">
          <div className="flex w-full flex-col items-center justify-center bg-gradient-to-br from-[#101010] to-[#3c3c3c]">
            <div className="relative flex h-60 w-full flex-col items-center justify-center">
              <div className="font-inter absolute top-5 right-5">
                <span className="mr-2 text-[12px] text-white">
                  Already have an account?{" "}
                </span>
                <button
                  onClick={() => navigate("/")}
                  className="cursor-pointer rounded-lg bg-white/10 px-4 py-1 text-[14px] font-medium text-white shadow-md backdrop-blur-md transition hover:bg-white/20 hover:backdrop-blur-lg"
                >
                  Log in
                </button>
              </div>
              {/* Logos at top left */}
              <div className="absolute top-5 left-5 z-10 flex items-center gap-3">
                <img
                  src={univLogo}
                  alt="University Logo"
                  className="size-8 object-contain"
                />
                <img
                  src={collegeLogo}
                  alt="College Logo"
                  className="size-8 object-contain"
                />
              </div>
              <div
                style={{ fontFamily: "Poppins, sans-serif" }}
                className="mt-5 mb-1 flex flex-col items-center"
              >
                <h1 className="text-center text-[22px] font-bold tracking-wide whitespace-nowrap text-white sm:text-[30px]">
                  <span>
                    <span className="text-3xl text-orange-500">C</span>
                    OMPREHENSIVE
                  </span>
                  <span>
                    <span className="text-3xl text-orange-500"> A</span>
                    SSESSMENT
                  </span>
                  <br />
                  <span>AND</span>
                  <span>
                    <span className="text-3xl text-orange-500"> P</span>
                    REPARATION
                  </span>
                  <span>
                    <span className="text-3xl text-orange-500"> S</span>YSTEM
                  </span>
                </h1>
              </div>
            </div>
          </div>

          <div
            style={{
              borderTopLeftRadius: "30px 15px",
              borderTopRightRadius: "30px 15px",
            }}
            className="mx-auto -mt-10 flex h-[14px] w-[85%] flex-col items-center justify-center bg-white/10 shadow-lg backdrop-blur-md"
          ></div>

          {/* Login Card */}
          <div
            style={{ fontFamily: "Poppins, sans-serif" }}
            className="flex w-full flex-col items-center justify-center rounded-t-4xl bg-white p-6"
          >
            <h2 className="mb-1 text-[20px] font-bold text-gray-900">
              REGISTER ACCOUNT
            </h2>
            <p className="mb-5 max-w-80 justify-center text-center text-xs text-gray-500 md:max-w-full lg:mr-15">
              Get started by entering your credentials to register and create
              your account.
            </p>

            <form
              className="mt-2 w-full space-y-4 sm:max-w-md md:max-w-xl"
              onSubmit={handleSubmit}
            >
              <div
                className={`transition-opacity duration-300 ease-in-out ${
                  currentStep === 1 ? "opacity-100" : "opacity-0"
                }`}
              >
                {/* Step 1 Content */}
                {currentStep === 1 && (
                  <div className="mt-4">
                    {" "}
                    <div className="relative mb-[13px]">
                      <div className="relative">
                        <input
                          type="text"
                          id="firstName"
                          className="peer mt-2 w-full rounded-xl border border-gray-300 px-4 py-[12px] text-base text-gray-900 placeholder-transparent transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                          placeholder="User Code"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                        />
                        <label
                          htmlFor="First Name"
                          className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 bg-white px-1 text-base text-gray-500 transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:mt-1 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:mt-0 peer-focus:text-xs peer-focus:text-[#FE6902] peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:text-xs"
                        >
                          First Name
                        </label>
                      </div>

                      {errors.firstName && (
                        <p className="mt-1 ml-3 text-xs text-red-500">
                          {errors.firstName}
                        </p>
                      )}
                    </div>
                    <div className="relative mb-4">
                      <div className="relative">
                        <input
                          type="text"
                          id="lastName"
                          className="peer mt-2 w-full rounded-xl border border-gray-300 px-4 py-[12px] text-base text-gray-900 placeholder-transparent transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                          placeholder="User Code"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                        />
                        <label
                          htmlFor="Last Name"
                          className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 bg-white px-1 text-base text-gray-500 transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:mt-1 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:mt-0 peer-focus:text-xs peer-focus:text-[#FE6902] peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:text-xs"
                        >
                          Last Name
                        </label>
                      </div>

                      {errors.lastName && (
                        <p className="mt-1 ml-3 text-xs text-red-500">
                          {errors.lastName}
                        </p>
                      )}
                    </div>
                    <div className="flex justify-center gap-4">
                      <button
                        type="button"
                        onClick={handleNextStep}
                        disabled={!validateStep1().isValid}
                        className={`mt-3 mb-1 w-[30%] cursor-pointer rounded-xl py-3 text-base font-semibold text-white shadow-md transition-all duration-200 ease-in-out active:scale-[0.98] active:shadow-sm ${
                          validateStep1().isValid
                            ? "bg-gradient-to-r from-[#ed3700] to-[#FE6902] hover:brightness-150"
                            : "cursor-not-allowed bg-gray-400"
                        }`}
                      >
                        <span className="flex items-center justify-center gap-2 text-[16px]">
                          Next
                          <i className="bx bx-right-arrow-alt text-[18px]"></i>
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div
                className={`transition-opacity duration-300 ease-in-out ${
                  currentStep === 2 ? "opacity-100" : "opacity-0"
                }`}
              >
                {/* Step 2 Content */}
                {currentStep === 2 && (
                  <>
                    <div className="relative mb-3">
                      <div className="relative">
                        <input
                          type="text"
                          id="userCode"
                          className="peer mt-2 w-full rounded-xl border border-gray-300 px-4 py-[12px] text-base text-gray-900 placeholder-transparent transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                          placeholder="User Code"
                          value={userCode}
                          onChange={(e) => setUserCode(e.target.value)}
                        />
                        <label
                          htmlFor="User Code"
                          className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 bg-white px-1 text-base text-gray-500 transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:mt-1 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:mt-0 peer-focus:text-xs peer-focus:text-[#FE6902] peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:text-xs"
                        >
                          User Code (e.g 23-A-XXXXX)
                        </label>
                      </div>

                      {errors.userCode && (
                        <p className="mt-1 ml-3 text-xs text-red-500">
                          {errors.userCode}
                        </p>
                      )}
                    </div>

                    <div className="relative mb-4">
                      <div className="relative">
                        <input
                          type="text"
                          id="email"
                          className={`peer mt-2 w-full rounded-xl border px-4 py-[12px] text-base text-gray-900 placeholder-transparent transition-all duration-200 focus:outline-none ${
                            emailTouched && emailError
                              ? "border-red-500 focus:border-red-500"
                              : "border-gray-300 hover:border-gray-500 focus:border-[#FE6902]"
                          }`}
                          placeholder="Email"
                          value={email}
                          onChange={handleEmailChange}
                          onBlur={handleEmailBlur}
                        />
                        <label
                          htmlFor="Email"
                          className={`pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 bg-white px-1 text-base transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:mt-1 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:mt-0 peer-focus:text-xs peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:text-xs ${
                            emailTouched && emailError
                              ? "text-red-500 peer-focus:text-red-500"
                              : "text-gray-500 peer-focus:text-[#FE6902]"
                          }`}
                        >
                          Email Address
                        </label>
                      </div>
                      {emailTouched && emailError && (
                        <p className="mt-1 ml-3 text-xs text-red-500">
                          {emailError}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-center gap-3">
                      <button
                        type="button"
                        onClick={handlePrevStep}
                        className="border-color mt-3 mb-1 w-[30%] cursor-pointer rounded-xl border bg-white py-3 text-base font-semibold text-black shadow-md transition-all duration-200 ease-in-out hover:bg-gray-100 active:scale-[0.98] active:shadow-sm disabled:opacity-60"
                      >
                        <span className="flex items-center justify-center gap-2 text-[16px]">
                          <i className="bx bx-left-arrow-alt text-[18px]"></i>
                          Back
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={handleNextStep}
                        disabled={!validateStep2().isValid}
                        className={`mt-3 mb-1 w-[30%] cursor-pointer rounded-xl py-3 text-base font-semibold text-white shadow-md transition-all duration-200 ease-in-out active:scale-[0.98] active:shadow-sm ${
                          validateStep2().isValid
                            ? "bg-gradient-to-r from-[#ed3700] to-[#FE6902] hover:brightness-150"
                            : "cursor-not-allowed bg-gray-400"
                        }`}
                      >
                        <span className="flex items-center justify-center gap-2 text-[16px]">
                          Next
                          <i className="bx bx-right-arrow-alt text-[18px]"></i>
                        </span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div
                className={`transition-opacity duration-300 ease-in-out ${
                  currentStep === 3 ? "opacity-100" : "opacity-0"
                }`}
              >
                {currentStep === 3 && (
                  <div>
                    <div className="mb-4 flex gap-4">
                      <div className="w-full">
                        <RegisterDropDown
                          name="Campus"
                          value={campusID}
                          onChange={(e) => setCampusID(e.target.value)}
                          placeholder="Select Campus"
                          options={[
                            { value: "1", label: "Dapitan" },
                            { value: "2", label: "Katipunan" },
                            { value: "3", label: "Tampilisan" },
                          ]}
                        />
                        {errors.campusID && (
                          <p className="ml-3 text-xs text-red-500">
                            {errors.campusID}
                          </p>
                        )}
                      </div>

                      <div className="w-full">
                        <RegisterDropDown
                          name="Position"
                          value={roleID}
                          onChange={(e) => setRoleID(e.target.value)}
                          placeholder="Select Position"
                          options={[
                            { value: "1", label: "Student" },
                            { value: "2", label: "Instructor" },
                            { value: "3", label: "Program Chair" },
                            { value: "4", label: "Dean" },
                          ]}
                        />
                        {errors.roleID && (
                          <p className="ml-3 text-xs text-red-500">
                            {errors.roleID}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="w-full">
                      <RegisterDropDown
                        name="programID"
                        value={programID}
                        onChange={(e) => setProgramID(e.target.value)}
                        options={getFilteredPrograms().map((program) => ({
                          value: program.id,
                          label: program.name,
                        }))}
                        placeholder="Select Program"
                      />
                      {errors.programID && (
                        <p className="ml-3 text-xs text-red-500">
                          {errors.programID}
                        </p>
                      )}
                    </div>

                    <div className="mt-2 flex justify-center gap-3">
                      <button
                        type="button"
                        onClick={handlePrevStep}
                        className="border-color mt-3 mb-1 w-[30%] cursor-pointer rounded-xl border bg-white py-3 text-base font-semibold text-black shadow-md transition-all duration-200 ease-in-out hover:bg-gray-100 active:scale-[0.98] active:shadow-sm disabled:opacity-60"
                      >
                        <span className="flex items-center justify-center gap-2 text-[16px]">
                          <i className="bx bx-left-arrow-alt text-[18px]"></i>
                          Back
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={handleNextStep}
                        disabled={!validateStep3().isValid}
                        className={`mt-3 mb-1 w-[30%] cursor-pointer rounded-xl py-3 text-base font-semibold text-white shadow-md transition-all duration-200 ease-in-out active:scale-[0.98] active:shadow-sm ${
                          validateStep3().isValid
                            ? "bg-gradient-to-r from-[#ed3700] to-[#FE6902] hover:brightness-150"
                            : "cursor-not-allowed bg-gray-400"
                        }`}
                      >
                        <span className="flex items-center justify-center gap-2 text-[16px]">
                          Next
                          <i className="bx bx-right-arrow-alt text-[18px]"></i>
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div
                className={`transition-opacity duration-300 ease-in-out ${
                  currentStep === 4 ? "opacity-100" : "opacity-0"
                }`}
              >
                {currentStep === 4 && (
                  <>
                    {/* Password */}
                    <div className="relative mb-4">
                      <div className="relative">
                        <input
                          type={passwordVisible ? "text" : "password"}
                          className={`peer mt-2 w-full rounded-xl border px-4 py-[12px] text-base text-gray-900 placeholder-transparent transition-all duration-200 focus:outline-none ${
                            passwordTouched && passwordError
                              ? "border-red-500 focus:border-red-500"
                              : "border-gray-300 hover:border-gray-500 focus:border-[#FE6902]"
                          }`}
                          placeholder=" "
                          value={password}
                          onChange={handlePasswordChange}
                          onBlur={handlePasswordBlur}
                          autoComplete="current-password"
                        />
                        <label
                          htmlFor="password"
                          className={`pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 bg-white px-1 text-base transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:mt-1 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:mt-0 peer-focus:text-xs peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:text-xs ${
                            passwordTouched && passwordError
                              ? "text-red-500 peer-focus:text-red-500"
                              : "text-gray-500 peer-focus:text-[#FE6902]"
                          }`}
                        >
                          Password
                        </label>
                        <button
                          type="button"
                          className="absolute top-[21px] right-3 text-gray-400"
                          onClick={() => setPasswordVisible((v) => !v)}
                          tabIndex={-1}
                        >
                          <i
                            className={`bx ${passwordVisible ? "bx-show text-orange-500" : "bx-hide"} text-[25px]`}
                          ></i>
                        </button>
                      </div>
                      {passwordTouched && passwordError && (
                        <p className="mt-1 ml-3 text-xs text-red-500">
                          {passwordError}
                        </p>
                      )}
                    </div>

                    <div className="relative mb-4">
                      <div className="relative">
                        <input
                          type={confirmPasswordVisible ? "text" : "password"}
                          className={`peer mt-2 w-full rounded-xl border px-4 py-[12px] text-base text-gray-900 placeholder-transparent transition-all duration-200 focus:outline-none ${
                            passwordTouched && password !== confirmPassword
                              ? "border-red-500 focus:border-red-500"
                              : "border-gray-300 hover:border-gray-500 focus:border-[#FE6902]"
                          }`}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder=""
                          autoComplete="current-password"
                        />
                        <label
                          htmlFor="confirmPassword"
                          className={`pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 bg-white px-1 text-base transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:mt-1 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:mt-0 peer-focus:text-xs peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:text-xs ${
                            passwordTouched && password !== confirmPassword
                              ? "text-red-500 peer-focus:text-red-500"
                              : "text-gray-500 peer-focus:text-[#FE6902]"
                          }`}
                        >
                          Confirm Password
                        </label>
                        <button
                          type="button"
                          className="absolute top-[21px] right-3 text-gray-400"
                          onClick={() =>
                            setConfirmPasswordVisible(!confirmPasswordVisible)
                          }
                          tabIndex={-1}
                        >
                          <i
                            className={`bx ${confirmPasswordVisible ? "bx-show text-orange-500" : "bx-hide"} text-[25px]`}
                          ></i>
                        </button>
                      </div>
                      {passwordTouched && password !== confirmPassword && (
                        <p className="mt-1 ml-3 text-xs text-red-500">
                          Passwords do not match
                        </p>
                      )}
                    </div>

                    {/* Error / Message */}
                    {errors.general && (
                      <p className="text-center text-red-500">
                        {errors.general}
                      </p>
                    )}
                    {message && (
                      <div className="text-center">
                        <p className="mb-2 text-green-500">{message}</p>
                        <p className="text-sm text-gray-600">
                          Redirecting to login page...
                        </p>
                      </div>
                    )}

                    {/* Buttons */}
                    <div className="flex justify-center gap-3">
                      <button
                        type="button"
                        onClick={handlePrevStep}
                        className="border-color mt-3 mb-1 w-[30%] cursor-pointer rounded-xl border bg-white py-3 text-base font-semibold text-black shadow-md transition-all duration-200 ease-in-out hover:bg-gray-100 active:scale-[0.98] active:shadow-sm disabled:opacity-60"
                      >
                        <span className="flex items-center justify-center gap-2 text-[16px]">
                          <i className="bx bx-left-arrow-alt text-[18px]"></i>
                          Back
                        </span>
                      </button>

                      <button
                        type="submit"
                        disabled={!validateStep4().isValid || isRegistering}
                        className={`mt-3 mb-1 w-[30%] cursor-pointer rounded-xl py-3 text-base font-semibold text-white shadow-md transition-all duration-200 ease-in-out active:scale-[0.98] active:shadow-sm ${
                          validateStep4().isValid && !isRegistering
                            ? "bg-gradient-to-r from-[#19de12] to-[#00a426] hover:brightness-120"
                            : "cursor-not-allowed bg-gray-400"
                        }`}
                      >
                        {isRegistering ? (
                          <div className="flex items-center justify-center">
                            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                          </div>
                        ) : (
                          "Register"
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="my-2 flex w-full items-center">
                <div className="h-px flex-1 bg-gray-200"></div>
                <span className="mx-2 text-xs text-gray-400">
                  <AppVersion />
                </span>
                <div className="h-px flex-1 bg-gray-200"></div>
              </div>
              <div className="flex items-center justify-center">
                <span className="mx-2 text-xs text-gray-400">
                  Developed by{" "}
                  <span className="text-orange-500">Team Caps</span>
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
