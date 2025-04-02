import { useState } from "react";
import { useNavigate } from "react-router-dom";
import univLogo from "/src/assets/univLogo.png";
import collegeLogo from "/src/assets/college-logo.png";
import TitleCard from "../components/titlecard";
import InputField from "../components/inputfield";

function Login() {
  const [idCode, setIdCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const apiUrl = import.meta.env.VITE_API_BASE_URL;


  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
  
    if (!idCode.trim() || !password.trim()) {
      setError("Please enter both ID Code and Password.");
      return;
    }
  
    try {
      const response = await fetch(`${apiUrl}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          userCode: idCode,
          password: password
        })
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        setError(data.message || "Login failed.");
        return;
      }
  
      console.log("Login successful!", data);
  
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
  
      // Redirect based on role_id
      const roleId = Number(data.user.roleID);
      switch (roleId) {
        case 1:
          navigate("/student");
          break;
        case 2:
          navigate("/Instructor");
          break;
        case 3:
          navigate("/Program Chair");
          break;
        case 4:
          navigate("/Dean");
          break;
        default:
          setError("Invalid user role.");
          break;
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Something went wrong. Please try again.");
    }
  };
  
  return (
    <div className="bg-fixed bg-[url(/src/assets/bg.jpg)] h-full w-full bg-center flex flex-col items-center justify-center min-h-screen py-[60px] overflow-hidden">
      <TitleCard univLogo={univLogo} collegeLogo={collegeLogo}/>
      
      <div className="font-inter border-solid border-[1px] border-[rgb(168,168,168)] bg-white shadow-lg md:rounded-[5px] p-9 w-full max-w-md">
      <div>
          <h2 className="-mt-2 text-[16px] font-[400] text-center font-inter mb-4">Register Account</h2>
          <div className="w-full max-w-[380px] h-[1px] bg-[rgb(168,168,168)] mt-5 sm:w-[100%] md:w-[100%] lg:w-[100%]"></div>
        </div>

        
        <form onSubmit={handleLogin} className="mt-7 space-y-4 ">
          <InputField
            label="User Code"
            type="text"
            icon="bxs-user"
            value={idCode}
            onChange={(e) => setIdCode(e.target.value)}
            placeholder="Enter"
          />
          

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
            </div>
          </div>

          <div className="flex items-center">
            <span className="text-[14px] text-[rgb(78,78,78)] cursor-pointer" onClick={() => navigate("")}>
              Forgot Password
            </span>
          </div>
          

          <div className="flex items-center justify-center mt-5">
            <button
              type="submit"
              className="mt-3 w-30 px-4 py-2 rounded-md text-white 
                bg-green-600 hover:bg-green-800"
            >
              Log-in
            </button>
          </div>
        </form>

        <p className="mt-4 text-center text-sm">
          Don't have an account?{" "}
          <span className="text-blue-500 cursor-pointer hover:underline" onClick={() => navigate("/register")}>
            Register
          </span>
          <span className="text-blue-500 cursor-pointer hover:underline" onClick={() => navigate("/testLogin")}>
            Test Login
          </span>
        </p>
      </div>
    </div>
  );
}
export default Login;