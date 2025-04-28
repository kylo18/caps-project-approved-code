import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import univLogo from "/src/assets/univLogo.png";
import collegeLogo from "/src/assets/college-logo.png";
import RegisterDropDown from "../components/registerDropDown.jsx";
import LoadingOverlay from "../components/loadingOverlay.jsx";

function Register() {
  const [userCode, setUserCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [roleID, setRoleID] = useState('');
  const [campusID, setCampusID] = useState('');
  const [programID, setProgramID] = useState('');

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
    { id: "4", name: "Bachelor of Science in Electronics and Communication Engineering" },
    { id: "5", name: "Bachelor of Science in Agricultural Biosystem Engineering" },
  ];

  const getFilteredPrograms = () => {
    if (campusID === "2" || campusID === "3") {
      return allPrograms.filter(program => program.id === "5");
    }
    return allPrograms.filter(program => program.id !== "5");
  };
  


  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    let validationErrors = {};
    let nextStep = currentStep; 
  
    // Step 1 Validation
    
    if (!firstName.trim()) {
      validationErrors.firstName = 'First name is required';
      if (nextStep > 1) nextStep = 1; 
    }
    if (!lastName.trim()) {
      validationErrors.lastName = 'Last name is required';
      if (nextStep > 1) nextStep = 1;
    }
  
    // Step 2 Validation
    if (!userCode.trim()) {
      validationErrors.userCode = 'User code is required';
      if (nextStep > 2) nextStep = 2;
    } else if (!/^\d{2}-[A-Za-z]-\d{5}$/.test(userCode.trim())) {
      validationErrors.userCode = 'Invalid user code';
      if (nextStep > 2) nextStep = 2;
    }

    if (!email.trim()) {
      validationErrors.email = 'Email is required';
      if (nextStep > 2) nextStep = 2;
    } else if (!/^[\w.+-]+@gmail\.com$/.test(email.trim())) {
      validationErrors.email = 'Invalid email address';
      if (nextStep > 2) nextStep = 2;
    }
    
     // Step 3 Validation
     if (!roleID) {
      validationErrors.roleID = 'Position is required';
      if (nextStep > 3) nextStep = 3; 
    }
    if (!campusID) {
      validationErrors.campusID = 'Campus is required';
      if (nextStep > 3) nextStep = 3; 
    }
    if (!programID) {
      validationErrors.programID = 'Program is required';
      if (nextStep > 3) nextStep = 3; 
    }
  
    // Step 4 Validation
    if (!password) {
      validationErrors.password = 'Password is required';
      if (nextStep < 4) nextStep = 4;
    } else if (password.length < 8) {
      validationErrors.password = 'Password must be at least 8 characters long';
      if (nextStep < 4) nextStep = 4;
    }
    
    if (password !== confirmPassword) {
      validationErrors.confirmPassword = 'Passwords do not match';
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        setErrors(prev => ({
          ...prev,
          general: data.message || 'Registration failed',
        }));
      }
    
    } catch (error) {
      console.error('Network or other error during registration:', error);
      setErrors(prev => ({
        ...prev,
        general: 'An error occurred. Please try again.',
      }));
    } finally {
      setIsRegistering(false);
    }
  }    
  
  const handleNextStep = () => {
    setErrors({});
    setCurrentStep((prevStep) => prevStep + 1);
  };

  const handlePrevStep = () => {
    setErrors({});
    setCurrentStep((prevStep) => prevStep - 1);
  };

  return (
    <div
      className="sm:bg-[url('/src/assets/login-bg-md.png')] lg:bg-[url('/login-bg.png')] bg-[url('/src/assets/login-bg-xs.png')] lg:flex-row  flex-col h-full w-full min-h-screen flex items-center justify-center bg-cover bg-center"
    >
      {/* Logos */}
      <div className="absolute top-3 left-3 flex items-center gap-2">
        <img src={univLogo} alt="Logo 1" className="size-8" />
        <img src={collegeLogo} alt="Logo 2" className="size-8" />
        <p className="text-white text-center text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl">
          JOSE RIZAL MEMORIAL STATE UNIVERSITY
        </p>
      </div>

      {/* Left Side (Title + Description at Bottom) */}
      <div className="flex flex-col items-center justify-start h-full px-4 sm:px-6 md:px-8 lg:px-12 py-6 pt-12">
        <div className="lg:hidden text-center -mt-45 sm:-mt-50 md:-mt-54 min-w-[833px]:-mt-70">
          <h1 className="text-white font-bold text-[22px] sm:text-[30px] leading-snug tracking-wide">
            COMPREHENSIVE ASSESSMENT
            <br />
            AND PREPARATION SYSTEM
          </h1>
        </div>


        {/* Stacked Title for lg and above */}
        <div className="hidden lg:flex flex-col items-start mt-20 lg:mt-0">
          <h1 className="xl:mr-40 text-4xl mt-25 font-bold text-white tracking-wide leading-snug">
            <span>
              <span className="text-orange-500 text-5xl ">C</span>OMPREHENSIVE
            </span>
            <br />
            <span>
              <span className="text-orange-500 text-5xl ">A</span>SSESSMENT &
            </span>
            <br />
            <span>
              <span className="text-orange-500 text-5xl">P</span>REPARATION
            </span>
            <br />
            <span>
              <span className="text-orange-500 text-5xl">S</span>YSTEM
            </span>
          </h1>
        </div>

        {/* Description */}
        <p className="text-center xl:mr-40 text-gray-400 text-sm md:text-base max-w-md mt-25 hidden lg:block">
          A platform designed to help students practice and prepare for qualifying exams while assessing their knowledge through randomized questions.
        </p>
      </div>

      {/* Right Side (Register Form) */}
      <div className="w-[85%] flex flex-col items-center justify-center lg:px-4 lg:w-full lg:max-w-md lg:mr-30">
        <h2 className="text-xl font-bold">REGISTER</h2>
        <p className="text-gray-500 text-sm mt-2 justify-center text-center w-2/3 mb-2">
          Get started by entering your credentials to register and create your account.
        </p>
        <div className="w-full max-w-sm">
          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div
              className={`transition-opacity duration-300 ease-in-out ${
                currentStep === 1 ? "opacity-100" : "opacity-0"
              }`}
            >
              {/* Step 1 Content */}
              {currentStep === 1 && (
                <>
                  <div className="relative mb-4">
                    <i className="bx bx-user absolute left-5 top-3 text-gray-500 text-[18px]"></i>
                    <input
                      type="text"
                      placeholder="First Name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="open-sans px-11 w-full py-2 rounded-full
                        border border-gray-300 hover:border-gray-500
                        focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 focus:border-transparent
                        transition-all duration-200"
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-xs ml-3 mt-1">{errors.firstName}</p>
                    )}
                  </div>
                  

                  <div className="relative mb-4">
                    <i className="bx bx-user absolute left-5 top-3 text-gray-500 text-[18px]"></i>
                    <input
                      type="text"
                      placeholder="Last Name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="open-sans px-11 w-full py-2 rounded-full
                        border border-gray-300 hover:border-gray-500
                        focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 focus:border-transparent
                        transition-all duration-200"
                    />
                    {errors.lastName && <p className="text-red-500 text-xs ml-3 mt-1">{errors.lastName}</p>}
                  </div>

                  <div className="flex justify-center gap-4 mt-7">
                    <button
                      type="submit"
                      onClick={handleNextStep}
                      className="bg-orange-500 text-white px-6 py-2 rounded-full  hover:bg-orange-600 flex items-center gap-1"
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
                  <div className="relative mb-4">
                    <i className="bx bx-id-card absolute left-5 top-3 text-gray-500 text-[18px]"></i>
                    <input
                      type="text"
                      placeholder="User Code (23-A-XXXXX)"
                      value={userCode}
                      onChange={(e) => setUserCode(e.target.value)}
                      className="open-sans px-11 w-full py-2 rounded-full
                        border border-gray-300 hover:border-gray-500
                        focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 focus:border-transparent
                        transition-all duration-200"
                    />
                    {errors.userCode && <p className="text-red-500 text-xs ml-3 mt-1">{errors.userCode}</p>}
                  </div>


                  <div className="relative mb-4">
                    <i className="bx bx-envelope absolute left-5 top-3 text-gray-500 text-[18px]"></i>
                    <input
                      type="text"
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="open-sans px-11 w-full py-2 rounded-full
                        border border-gray-300 hover:border-gray-500
                        focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 focus:border-transparent
                        transition-all duration-200"
                    />
                    {errors.email && <p className="text-red-500 text-xs ml-3 mt-1">{errors.email}</p>}
                  </div>

                  <div className="flex justify-center gap-3 mt-7">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="bg-white text-gray-700 hover:bg-gray-200 px-6 py-2 rounded-full border flex items-center gap-1"
                    >
                      <i className="bx bx-left-arrow-alt text-[20px]"></i>
                      <span className="text-[16px]">Back</span>
                    </button>

                    <button
                      type="submit"
                      onClick={handleNextStep}
                      className="bg-orange-500 text-white px-6 py-2 rounded-full hover:bg-orange-600 flex items-center gap-1"
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
                  <div className="flex gap-4 mb-4">
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
                      {errors.campusID && <p className="text-red-500 text-xs ml-3">{errors.campusID}</p>}
                    </div>
                    
                    <div className="w-full">
                      <RegisterDropDown
                        name="Role"
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
                      {errors.roleID && <p className="text-red-500 text-xs ml-3">{errors.roleID}</p>}
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
                    {errors.programID && <p className="text-red-500 text-xs ml-3">{errors.programID}</p>}
                  </div>

                  <div className="flex justify-center gap-3 mt-7">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="bg-white text-gray-700 hover:bg-gray-200 px-6 py-2 rounded-full border flex items-center gap-1"
                    >
                      <i className="bx bx-left-arrow-alt text-[20px]"></i>
                      <span className="text-[16px]">Back</span>
                    </button>

                    <button
                      type="submit"
                      onClick={handleNextStep}
                      className="bg-orange-500 text-white px-6 py-2 rounded-full hover:bg-orange-600 flex items-center gap-1"
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
                  {/* Password */}
                  <div className="mb-4">
                    <div className="relative mb-4">
                      <i className="bx bx-key absolute left-5 top-3 text-gray-500 text-[18px]"></i>
                      <input
                        type={passwordVisible ? "text" : "password"}
                        value={password}
                        placeholder="Password"
                        onChange={(e) => setPassword(e.target.value)}
                        className="open-sans px-11 w-full py-2 rounded-full
                          border border-gray-300 hover:border-gray-500
                          focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 focus:border-transparent
                          transition-all duration-200"
                      />
                      <div
                        className="absolute right-5 top-[10px] cursor-pointer"
                        onClick={() => setPasswordVisible(!passwordVisible)}
                      >
                        <i className={`bx ${passwordVisible ? "bx-show" : "bx-hide"} text-[23px] text-orange-500`}></i>
                      </div>
                      {errors.password && <p className="text-red-500 text-xs ml-3 mt-1">{errors.password}</p>}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="relative mb-4">
                      <i className="bx bx-key absolute left-5 top-3 text-gray-500 text-[18px]"></i>
                      <input
                        type={confirmPasswordVisible ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm Password"
                        className="open-sans px-11 w-full py-2 rounded-full
                          border border-gray-300 hover:border-gray-500
                          focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 focus:border-transparent
                          transition-all duration-200"
                      />
                      <div
                        className="absolute right-5 top-[10px] cursor-pointer"
                        onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}

                      >
                         <i className={`bx ${confirmPasswordVisible ? "bx-show" : "bx-hide"} text-[23px] text-orange-500`}></i>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-red-500 text-xs ml-3">{errors.confirmPassword}</p>
                      )}
                    </div>
                  </div>

                  {/* Error / Message */}
                  {errors.general && <p className="text-red-500 text-center text-sm">{errors.general}</p>}

                  {/* Buttons */}
                  <div className="flex justify-center gap-3 mt-7">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="cursor-pointer bg-white text-gray-700 hover:bg-gray-200 px-6 py-2 rounded-full border flex items-center gap-1"
                    >
                      <i className="bx bx-left-arrow-alt text-[20px]"></i>
                      <span className="text-[16px]">Back</span>
                    </button>
                    <button
                      type="submit"
                      className="cursor-pointer bg-green-600 text-white hover:bg-green-800 transition px-6 py-2 rounded-full border flex items-center gap-1"
                    >
                      <span className="text-[16px]">Register</span>
                    </button>
                  </div>
                </>
              )}
            </div>

              <p className="mt-5 text-[14px] text-gray-600 justify-center text-center">
                Already have an account?{" "}
                <span className="text-orange-500 cursor-pointer hover:underline" onClick={() => navigate("/")}>
                  Log-in
                </span>
              </p>
            </form>
          </div>
          {isRegistering && <LoadingOverlay show={isRegistering} />}
      </div>
    </div>
  );
}

export default Register;