import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import univLogo from "/src/assets/univLogo.png";
import collegeLogo from "/src/assets/college-logo.png";
import InputField from "../components/inputfield.jsx";
import TitleCard from "../components/titlecard.jsx";
import CustomDropdown from "../components/customDropdown.jsx";

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
  const [message, setMessage] = useState('');

  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  // Trigger the userCode check when userCode changes
  useEffect(() => {
    if (userCode.trim() !== '') {
      const delayDebounceFn = setTimeout(() => {
        checkUserCodeExists();
      }, 500);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [userCode]);

  // Trigger the email check when email changes
  useEffect(() => {
    if (email.trim() !== '') {
      const delayDebounceFn = setTimeout(() => {
        checkEmailExists();
      }, 500);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [email]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    let validationErrors = {};

    if (!userCode.trim()) validationErrors.userCode = 'User code is required';
    if (!firstName.trim()) validationErrors.firstName = 'First name is required';
    if (!lastName.trim()) validationErrors.lastName = 'Last name is required';
    if (!email.trim()) validationErrors.email = 'Email is required';
    if (!password) validationErrors.password = 'Password is required';
    if (password !== confirmPassword) validationErrors.confirmPassword = 'Passwords do not match';
    if (!roleID) validationErrors.roleID = 'Role ID is required';
    if (!campusID) validationErrors.campusID = 'Campus ID is required';
    if (!programID) validationErrors.programID = 'Program ID is required'; 

    if (errors.userCode || errors.email) {
      validationErrors.general = "Fix the errors before submitting.";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

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

      const data = await res.json();

      if (res.ok) {
        setMessage('Registration successful!');
        setErrors({});
        navigate("/");
      } else {
        setErrors(prev => ({
          ...prev,
          general: data.message || 'Registration failed',
        }));
      }

    } catch (error) {
      console.error('Error during registration:', error);
      setErrors(prev => ({
        ...prev,
        general: 'An error occurred. Please try again.',
      }));
    }
  };

  return (
    <div className="bg-fixed bg-[url(/src/assets/bg.jpg)] h-full w-full bg-center flex flex-col items-center justify-center min-h-screen py-[60px]">
      <TitleCard univLogo={univLogo} collegeLogo={collegeLogo} />

      <div className="border-solid border-[1px] border-[rgb(168,168,168)] bg-white shadow-lg md:rounded-md p-9 w-full max-w-sm md:max-w-md">
        <div>
          <h2 className="-mt-2 text-[16px] font-[400] text-center font-inter mb-4">Register Account</h2>
          <div className="w-full max-w-[380px] h-[1px] bg-[rgb(168,168,168)] mt-5 sm:w-[100%] md:w-[100%] lg:w-[100%]"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-5">

          <InputField
            label="First Name"
            type="text"
            icon="bxs-user"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Enter"
          />
          {errors.firstName && <p className="text-red-500 text-xs">{errors.firstName}</p>}

          <InputField
            label="Last Name"
            type="text"
            icon="bxs-user"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Enter"
          />
          {errors.lastName && <p className="text-red-500 text-xs">{errors.lastName}</p>}

          <InputField
            label="User Code"
            type="text"
            icon="bxs-id-card"
            value={userCode}
            onChange={(e) => setUserCode(e.target.value)}
            placeholder="Enter"
          />
          {errors.userCode && <p className="text-red-500 text-xs">{errors.userCode}</p>}

          <InputField
            label="Email"
            type="text"
            icon="bx-envelope"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter"
          />
          {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}

          

          <div className="flex gap-4 mb-4">
            <div className="w-1/2">
              <label className="block mb-1">Campus</label>
              <select
                value={campusID}
                onChange={(e) => setCampusID(e.target.value)}
                className="w-full p-2 border border-[rgb(168,168,168)] rounded-[3px] focus:border-blue-500 focus:ring-2 focus:ring-blue-300 focus:outline-none"
              >
                <option value="" disabled>Select</option>
                <option value="1" >Dapitan</option>
                <option value="2">Katipunan</option>
                <option value="3">Tampilisan</option>
              </select>
              {errors.campusID && <p className="text-red-500 text-xs">{errors.campusID}</p>}
            </div>

            <div className="w-1/2">
              <label className="block mb-1">Role</label>
              <select
                value={roleID}
                onChange={(e) => setRoleID(e.target.value)}
                className="w-full p-2 border border-[rgb(168,168,168)] rounded-[3px] focus:border-blue-500 focus:ring-2 focus:ring-blue-300 focus:outline-none"
              >
                <option value="" disabled>Select</option>
                <option value="1">Student</option>
                <option value="2">Instructor</option>
                <option value="3">Program Chair</option>
                <option value="4">Dean</option>
              </select>
              {errors.roleID && <p className="text-red-500 text-xs">{errors.roleID}</p>}
            </div>
          </div>

          {/*<div>
            <CustomDropdown
              label="Program"
              name="program"
              value={programID}
              onChange={(e) => setProgramID(e.target.value)}
              placeholder="Select program..."
              options={[
                { value: "1", label: "Bachelor of Science in Computer Engineering" },
                { value: "2", label: "Bachelor of Science in Electrical Engineering" },
                { value: "3", label: "Bachelor of Science in Civil Engineering" },
                { value: "4", label: "Bachelor of Science in Electronics and Communication Engineering" },
                { value: "5", label: "Bachelor of Science in Agricultural Biosystem Engineering" },
              ]}
            />
          </div>*/}

          <div className="w-full">
            <label className="block mb-1">Program</label>
            <select
              value={programID}
              onChange={(e) => setProgramID(e.target.value)}
              className="w-full p-2 border border-[rgb(168,168,168)] rounded-[3px] focus:border-blue-500 focus:ring-2 focus:ring-blue-300 focus:outline-none"
            >
              <option value="" disabled>Select</option>
              <option value="1">Bachelor of Science in Computer Engineering</option>
              <option value="2">Bachelor of Science in Electrical Engineering</option>
              <option value="3">Bachelor of Science in Civil Engineering</option>
              <option value="4">Bachelor of Science in Electronics and Communication Engineering</option>
              <option value="5">Bachelor of Science in Agricultural Biosystem Engineering</option>
            </select>
            {errors.programID && <p className="text-red-500 text-xs">{errors.programID}</p>}
          </div>

          {/* Password */}
          <div className="mb-4">
            <div className="flex flex-col space-y-1">
              <label className="block">Password</label>
              <div className="relative flex items-center border border-[rgb(168,168,168)] rounded-[3px] overflow-hidden group focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-300">
                <div className="p-2 flex items-center justify-center size-10  border-[rgb(168,168,168)]">
                  <i className="bx bxs-key text-[24px] text-orange-500"></i>
                </div>
                <input
                  type={passwordVisible ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 p-2 outline-none border-none"
                  placeholder="Enter"
                />
                <div className="p-2 right-2 top-2 flex items-center cursor-pointer" onClick={() => setPasswordVisible(!passwordVisible)}>
                  <i className={`bx ${passwordVisible ? "bx-show" : "bx-hide"} text-[24px] text-orange-500`}></i>
                </div>
              </div>
              {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
            </div>
          </div>

          {/* Confirm Password */}
          <div className="mb-4">
            <div className="flex flex-col space-y-1">
              <label className="block">Confirm Password</label>
              <div className="relative flex items-center border border-[rgb(168,168,168)] rounded-[3px] overflow-hidden group focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-300">
                <div className="p-2 flex items-center justify-center size-10 border-[rgb(168,168,168)]">
                  <i className="bx bxs-key text-[24px] text-orange-500"></i>
                </div>
                <input
                  type={confirmPasswordVisible ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="flex-1 p-2 outline-none border-none"
                  placeholder="Confirm Password"
                />
                <div className="p-2 right-2 top-2 flex items-center cursor-pointer" onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}>
                  <i className={`bx ${confirmPasswordVisible ? "bx-show" : "bx-hide"} text-[24px] text-orange-500`}></i>
                </div>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs">{errors.confirmPassword}</p>}
            </div>
          </div>

          {/* Error / Message */}
          {errors.general && <p className="text-red-500 text-center">{errors.general}</p>}
          {message && <p className="text-green-500 text-center">{message}</p>}

          <div className="flex items-center justify-center mt-5">
            <button
              type="submit"
              className="mt-3 w-30 px-4 py-2 rounded-md text-white transition bg-green-600 hover:bg-green-800"
            >
              Register
            </button>
          </div>
          
          <p className="mt-2 text-center text-sm">
            Already have an account?{" "}
            <span className="text-blue-500 cursor-pointer hover:underline" onClick={() => navigate("/")}>
              Log-in
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;