import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import univLogo from "../assets/univLogo.png";
import collegeLogo from "/src/assets/college-logo.png";
import LoadingOverlay from "../components/loadingOverlay";
import RegisterDropDown from "../components/registerDropDown";
import AppVersion from "../components/appVersion";

export default function LoginPage() {
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

  const [errors, setErrors] = useState({});
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;

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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    let validationErrors = {};
    let nextStep = currentStep;

    // Step 1 Validation

    if (!firstName.trim()) {
      validationErrors.firstName = "First name is required";
      if (nextStep > 1) nextStep = 1;
    }
    if (!lastName.trim()) {
      validationErrors.lastName = "Last name is required";
      if (nextStep > 1) nextStep = 1;
    }

    // Step 3 Validation
    if (!roleID) {
      validationErrors.roleID = "Position is required";
      if (nextStep > 3) nextStep = 3;
    }
    if (!campusID) {
      validationErrors.campusID = "Campus is required";
      if (nextStep > 3) nextStep = 3;
    }
    if (!programID) {
      validationErrors.programID = "Program is required";
      if (nextStep > 3) nextStep = 3;
    }

    // Step 4 Validation
    if (!password) {
      validationErrors.password = "Password is required";
      if (nextStep < 4) nextStep = 4;
    } else if (password.length < 8) {
      validationErrors.password = "Password must be at least 8 characters long";
      if (nextStep < 4) nextStep = 4;
    }

    if (password !== confirmPassword) {
      validationErrors.confirmPassword = "Passwords do not match";
      if (nextStep > 4) nextStep = 4;
    }
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
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
        setErrors({});
        navigate("/");
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
        general: "An error occurred. Please try again.",
      }));
    } finally {
      setIsRegistering(false);
    }
  };

  const handleNextStep = () => {
    setErrors({});
    setCurrentStep((prevStep) => prevStep + 1);
  };

  const handlePrevStep = () => {
    setErrors({});
    setCurrentStep((prevStep) => prevStep - 1);
  };

  return (
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
          Get started by entering your credentials to register and create your
          account.
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
                  <p className="text-center text-sm text-red-500">
                    {errors.general}
                  </p>
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
              Developed by <span className="text-orange-500">Team Caps</span>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
