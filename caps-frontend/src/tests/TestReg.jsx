import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Register() {
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
  const [message, setMessage] = useState("");
  const [currentStep, setCurrentStep] = useState(1); // To manage steps
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  // Trigger the userCode check when userCode changes
  useEffect(() => {
    if (userCode.trim() !== "") {
      const delayDebounceFn = setTimeout(() => {
        checkUserCodeExists();
      }, 500);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [userCode]);

  // Trigger the email check when email changes
  useEffect(() => {
    if (email.trim() !== "") {
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

    if (!userCode.trim()) validationErrors.userCode = "User code is required";
    if (!firstName.trim())
      validationErrors.firstName = "First name is required";
    if (!lastName.trim()) validationErrors.lastName = "Last name is required";
    if (!email.trim()) validationErrors.email = "Email is required";
    if (!password) validationErrors.password = "Password is required";
    if (password !== confirmPassword)
      validationErrors.confirmPassword = "Passwords do not match";
    if (!roleID) validationErrors.roleID = "Role ID is required";
    if (!campusID) validationErrors.campusID = "Campus ID is required";
    if (!programID) validationErrors.programID = "Program ID is required";

    if (errors.userCode || errors.email) {
      validationErrors.general = "Fix the errors before submitting.";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

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

      const data = await res.json();

      if (res.ok) {
        setMessage("Registration successful!");
        setErrors({});
        navigate("/");
      } else {
        setErrors((prev) => ({
          ...prev,
          general: data.message || "Registration failed",
        }));
      }
    } catch (error) {
      console.error("Error during registration:", error);
      setErrors((prev) => ({
        ...prev,
        general: "An error occurred. Please try again.",
      }));
    }
  };

  const checkUserCodeExists = async () => {
    // Check if the user code exists in the database
    // Handle any logic for user code validation here
  };

  const checkEmailExists = async () => {
    // Check if the email exists in the database
    // Handle any logic for email validation here
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
    <div className="register-container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        {/* Step 1: Name and Last Name */}
        {currentStep === 1 && (
          <>
            <div>
              <label>First Name:</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              {errors.firstName && <p>{errors.firstName}</p>}
            </div>

            <div>
              <label>Last Name:</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
              {errors.lastName && <p>{errors.lastName}</p>}
            </div>

            <button type="button" onClick={handleNextStep}>
              Next
            </button>
          </>
        )}

        {/* Step 2: User Code and Email */}
        {currentStep === 2 && (
          <>
            <div>
              <label>User Code:</label>
              <input
                type="text"
                value={userCode}
                onChange={(e) => setUserCode(e.target.value)}
              />
              {errors.userCode && <p>{errors.userCode}</p>}
            </div>

            <div>
              <label>Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && <p>{errors.email}</p>}
            </div>

            <button type="button" onClick={handlePrevStep}>
              Previous
            </button>
            <button type="button" onClick={handleNextStep}>
              Next
            </button>
          </>
        )}

        {/* Step 3: Campus, Role, and Course */}
        {currentStep === 3 && (
          <>
            <div>
              <label>Campus:</label>
              <input
                type="text"
                value={campusID}
                onChange={(e) => setCampusID(e.target.value)}
              />
              {errors.campusID && <p>{errors.campusID}</p>}
            </div>

            <div>
              <label>Role:</label>
              <input
                type="text"
                value={roleID}
                onChange={(e) => setRoleID(e.target.value)}
              />
              {errors.roleID && <p>{errors.roleID}</p>}
            </div>

            <div>
              <label>Course:</label>
              <input
                type="text"
                value={programID}
                onChange={(e) => setProgramID(e.target.value)}
              />
              {errors.programID && <p>{errors.programID}</p>}
            </div>

            <button type="button" onClick={handlePrevStep}>
              Previous
            </button>
            <button type="button" onClick={handleNextStep}>
              Next
            </button>
          </>
        )}

        {/* Step 4: Password and Confirm Password */}
        {currentStep === 4 && (
          <>
            <div>
              <label>Password:</label>
              <input
                type={passwordVisible ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {errors.password && <p>{errors.password}</p>}
            </div>

            <div>
              <label>Confirm Password:</label>
              <input
                type={confirmPasswordVisible ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {errors.confirmPassword && <p>{errors.confirmPassword}</p>}
            </div>

            <button type="button" onClick={handlePrevStep}>
              Previous
            </button>
            <button type="submit">Submit</button>
          </>
        )}
      </form>

      {message && <p>{message}</p>}
      {errors.general && <p>{errors.general}</p>}
    </div>
  );
}

export default Register;
