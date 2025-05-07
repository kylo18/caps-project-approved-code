import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import univLogo from "/src/assets/univLogo.png";
import collegeLogo from "/src/assets/college-logo.png";
import RegisterDropDown from "../components/registerDropDown.jsx";
import LoadingOverlay from "../components/loadingOverlay.jsx";
import AppVersion from "../components/appVersion.jsx";

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
    <div className="flex min-h-screen w-full flex-col bg-[url('/login-bg-xs.png')] bg-cover bg-center bg-no-repeat sm:bg-[url('/login-bg-sm.png')] md:bg-[url('/login-bg-md.png')] lg:flex-row lg:bg-[url('/login-bg.png')]">
      {/* Left Section */}
      <div className="mr-10 flex w-full flex-col items-center justify-center p-6 text-white lg:w-1/2">
        {/* Logos */}
        <div className="absolute top-3 left-3 flex items-center space-x-2">
          <img src={univLogo} alt="Logo 1" className="size-8" />
          <img src={collegeLogo} alt="Logo 2" className="size-8" />
          <h1 className="text-xs lg:text-lg">
            JOSE RIZAL MEMORIAL STATE UNIVERSITY
          </h1>
        </div>

        <div className="absolute hidden items-center space-x-2 lg:bottom-3 lg:left-3 lg:block">
          <AppVersion />{" "}
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
            qualifying exams while assessing their knowledge through randomized
            questions.
          </p>
        </div>

        <div className="font-inter mt-12 flex flex-col items-center justify-center lg:hidden">
          <h1 className="text-center text-[20px] leading-snug font-bold tracking-wide whitespace-nowrap text-white sm:text-[30px]">
            <span>
              <span className="text-3xl text-orange-500">C</span>OMPREHENSIVE
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
          <div className="sm:ml-10 lg:ml-0">
            <h2 className="text-center text-xl font-bold lg:mr-15">
              REGISTER ACCOUNT
            </h2>
            <p className="mt-2 justify-center text-center text-sm text-gray-500 lg:mr-15">
              <span>
                Get started by entering your credentials to register and create
                your account.
              </span>
              <br />
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
                    <>
                      {" "}
                      <label className="mb-1 block text-sm font-medium text-gray-800">
                        First Name
                      </label>
                      <div className="relative mb-4">
                        <i className="bx bx-user absolute top-3 left-4 text-[18px] text-gray-500"></i>
                        <input
                          type="text"
                          placeholder="Enter"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="open-sans w-full rounded-full border border-gray-300 px-11 py-2 transition-all duration-200 hover:border-gray-500 focus:border-transparent focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 focus:outline-none"
                        />
                        {errors.firstName && (
                          <p className="mt-1 ml-3 text-xs text-red-500">
                            {errors.firstName}
                          </p>
                        )}
                      </div>
                      <label className="mb-1 block text-sm font-medium text-gray-800">
                        Last Name
                      </label>
                      <div className="relative mb-4">
                        <i className="bx bx-user absolute top-3 left-4 text-[18px] text-gray-500"></i>
                        <input
                          type="text"
                          placeholder="Enter"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="open-sans w-full rounded-full border border-gray-300 px-11 py-2 transition-all duration-200 hover:border-gray-500 focus:border-transparent focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 focus:outline-none"
                        />
                        {errors.lastName && (
                          <p className="mt-1 ml-3 text-xs text-red-500">
                            {errors.lastName}
                          </p>
                        )}
                      </div>
                      <div className="mt-7 flex justify-center gap-4">
                        <button
                          type="submit"
                          onClick={handleNextStep}
                          className="flex items-center gap-1 rounded-full bg-orange-500 px-6 py-2 text-white hover:bg-orange-600"
                        >
                          <span className="text-[16px]">Next</span>
                          <i className="bx bx-right-arrow-alt text-[20px]"></i>
                        </button>
                      </div>
                    </>
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
                      <label className="mb-1 block text-sm font-medium text-gray-800">
                        User Code
                      </label>
                      <div className="relative mb-4">
                        <i className="bx bx-id-card absolute top-3 left-4 text-[18px] text-gray-500"></i>
                        <input
                          type="text"
                          placeholder="Enter"
                          value={userCode}
                          onChange={(e) => setUserCode(e.target.value)}
                          className="open-sans w-full rounded-full border border-gray-300 px-11 py-2 transition-all duration-200 hover:border-gray-500 focus:border-transparent focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 focus:outline-none"
                        />
                        {errors.userCode && (
                          <p className="mt-1 ml-3 text-xs text-red-500">
                            {errors.userCode}
                          </p>
                        )}
                      </div>
                      <label className="mb-1 block text-sm font-medium text-gray-800">
                        Email Address
                      </label>
                      <div className="relative mb-4">
                        <i className="bx bx-envelope absolute top-3 left-4 text-[18px] text-gray-500"></i>
                        <input
                          type="text"
                          placeholder="e.g steve@gmail.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="open-sans w-full rounded-full border border-gray-300 px-11 py-2 transition-all duration-200 hover:border-gray-500 focus:border-transparent focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 focus:outline-none"
                        />
                        {errors.email && (
                          <p className="mt-1 ml-3 text-xs text-red-500">
                            {errors.email}
                          </p>
                        )}
                      </div>

                      <div className="mt-7 flex justify-center gap-3">
                        <button
                          type="button"
                          onClick={handlePrevStep}
                          className="flex items-center gap-1 rounded-full border bg-white px-6 py-2 text-gray-700 hover:bg-gray-200"
                        >
                          <i className="bx bx-left-arrow-alt text-[20px]"></i>
                          <span className="text-[16px]">Back</span>
                        </button>

                        <button
                          type="submit"
                          onClick={handleNextStep}
                          className="flex items-center gap-1 rounded-full bg-orange-500 px-6 py-2 text-white hover:bg-orange-600"
                        >
                          <span className="text-[16px]">Next</span>
                          <i className="bx bx-right-arrow-alt text-[20px]"></i>
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
                    <>
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

                      <div className="mt-7 flex justify-center gap-3">
                        <button
                          type="button"
                          onClick={handlePrevStep}
                          className="flex items-center gap-1 rounded-full border bg-white px-6 py-2 text-gray-700 hover:bg-gray-200"
                        >
                          <i className="bx bx-left-arrow-alt text-[20px]"></i>
                          <span className="text-[16px]">Back</span>
                        </button>

                        <button
                          type="submit"
                          onClick={handleNextStep}
                          className="flex items-center gap-1 rounded-full bg-orange-500 px-6 py-2 text-white hover:bg-orange-600"
                        >
                          <span className="text-[16px]">Next</span>
                          <i className="bx bx-right-arrow-alt text-[20px]"></i>
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div
                  className={`transition-opacity duration-300 ease-in-out ${
                    currentStep === 4 ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {currentStep === 4 && (
                    <>
                      <label className="mb-1 block text-sm font-medium text-gray-800">
                        Password
                      </label>
                      {/* Password */}
                      <div className="mb-4">
                        <div className="relative mb-4">
                          <i className="bx bx-key absolute top-3 left-4 text-[18px] text-gray-500"></i>
                          <input
                            type={passwordVisible ? "text" : "password"}
                            value={password}
                            placeholder="Enter"
                            onChange={(e) => setPassword(e.target.value)}
                            className="open-sans w-full rounded-full border border-gray-300 px-11 py-2 transition-all duration-200 hover:border-gray-500 focus:border-transparent focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 focus:outline-none"
                          />
                          <div
                            className="absolute top-[10px] right-5 cursor-pointer"
                            onClick={() => setPasswordVisible(!passwordVisible)}
                          >
                            <i
                              className={`bx ${passwordVisible ? "bx-show" : "bx-hide"} text-[23px] text-orange-500`}
                            ></i>
                          </div>
                          {errors.password && (
                            <p className="mt-1 ml-3 text-xs text-red-500">
                              {errors.password}
                            </p>
                          )}
                        </div>
                      </div>
                      <label className="mb-1 block text-sm font-medium text-gray-800">
                        Confirm Password
                      </label>
                      <div className="mb-4">
                        <div className="relative mb-4">
                          <i className="bx bx-key absolute top-3 left-4 text-[18px] text-gray-500"></i>
                          <input
                            type={confirmPasswordVisible ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Enter"
                            className="open-sans w-full rounded-full border border-gray-300 px-11 py-2 transition-all duration-200 hover:border-gray-500 focus:border-transparent focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 focus:outline-none"
                          />
                          <div
                            className="absolute top-[10px] right-5 cursor-pointer"
                            onClick={() =>
                              setConfirmPasswordVisible(!confirmPasswordVisible)
                            }
                          >
                            <i
                              className={`bx ${confirmPasswordVisible ? "bx-show" : "bx-hide"} text-[23px] text-orange-500`}
                            ></i>
                          </div>
                          {errors.confirmPassword && (
                            <p className="ml-3 text-xs text-red-500">
                              {errors.confirmPassword}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Error / Message */}
                      {errors.general && (
                        <p className="text-center text-sm text-red-500">
                          {errors.general}
                        </p>
                      )}

                      {/* Buttons */}
                      <div className="mt-7 flex justify-center gap-3">
                        <button
                          type="button"
                          onClick={handlePrevStep}
                          className="flex cursor-pointer items-center gap-1 rounded-full border bg-white px-6 py-2 text-gray-700 hover:bg-gray-200"
                        >
                          <i className="bx bx-left-arrow-alt text-[20px]"></i>
                          <span className="text-[16px]">Back</span>
                        </button>
                        <button
                          type="submit"
                          className="flex cursor-pointer items-center gap-1 rounded-full border bg-green-500 px-6 py-2 text-white transition hover:bg-green-600"
                        >
                          <span className="text-[16px]">Register</span>
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

                <div className="justify-center px-4 text-center text-sm text-gray-600">
                  <span className="text-orange-500">
                    Developed by Team CAPS
                  </span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {isRegistering && <LoadingOverlay show={isRegistering} />}
    </div>
  );
}
