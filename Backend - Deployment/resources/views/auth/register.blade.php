<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register - CAPS</title>
    <style>
        /* General Styles */
        body {
            font-family: Arial, sans-serif;
            background-color: #f8f8f8;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }

        /* Registration Container */
        .register-container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            text-align: center;
            width: 400px;
        }

        /* Title */
        .register-container h2 {
            color: #FF7300;
            margin-bottom: 20px;
        }

        /* Input Groups */
        .input-group {
            margin-bottom: 15px;
            text-align: left;
        }

        .input-group label {
            display: block;
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
        }

        .input-group input,
        .input-group select {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
        }

        /* Register Button */
        .register-btn {
            background: #FF7300;
            color: white;
            border: none;
            padding: 10px;
            width: 100%;
            border-radius: 5px;
            font-size: 18px;
            cursor: pointer;
            transition: 0.3s;
        }

        .register-btn:hover {
            background: #E66500;
        }

        /* Response Message Box */
        .message-box {
            margin-top: 15px;
            padding: 10px;
            border-radius: 5px;
            display: none;
        }

        .success {
            background-color: #D4EDDA;
            color: #155724;
            border: 1px solid #C3E6CB;
        }

        .error {
            background-color: #F8D7DA;
            color: #721C24;
            border: 1px solid #F5C6CB;
        }

        /* Responsive Design */
        @media (max-width: 450px) {
            .register-container {
                width: 90%;
            }
        }
    </style>
</head>
<body>

    <div class="register-container">
        <h2>Register</h2>
        <form id="registerForm">
            <div class="input-group">
                <label for="userCode">User Code:</label>
                <input type="text" id="registerUserCode" name="userCode" required>
            </div>

            <div class="input-group">
                <label for="firstName">First Name:</label>
                <input type="text" id="firstName" name="firstName" required>
            </div>

            <div class="input-group">
                <label for="lastName">Last Name:</label>
                <input type="text" id="lastName" name="lastName" required>
            </div>

            <div class="input-group">
                <label for="email">Email:</label>
                <input type="email" id="email" name="email" required>
            </div>

            <div class="input-group">
                <label for="password">Password:</label>
                <input type="password" id="password" name="password" required>
            </div>

            <div class="input-group">
                <label for="roleID">Role:</label>
                <select id="roleID" name="roleID">
                    <option value="1">Student</option>
                    <option value="2">Instructor</option>
                    <option value="3">Program Chair</option>
                    <option value="4">Dean</option>
                </select>
            </div>

            <div class="input-group">
                <label for="campusID">Campus:</label>
                <select id="campusID" name="campusID">
                    <option value="1">Main Campus</option>
                    <option value="2">Katipunan Campus</option>
                    <option value="3">Tampilisan Campus</option>
                </select>
            </div>

            <button type="submit" class="register-btn">Register</button>
        </form>

        <!-- Message Box -->
        <div id="responseMessage" class="message-box"></div>
    </div>

    <script>
        document.getElementById("registerForm").addEventListener("submit", async function(event) {
            event.preventDefault();
            
            let formData = new FormData(this);
            let responseMessage = document.getElementById("responseMessage");

            try {
                let response = await fetch("{{ url('/api/register') }}", {
                    method: "POST",
                    body: formData
                });

                let data = await response.json();
                responseMessage.style.display = "block";

                if (response.ok) {
                    responseMessage.className = "message-box success";
                    responseMessage.textContent = data.message || "Registration successful!";
                    this.reset(); // Clear form fields
                } else {
                    responseMessage.className = "message-box error";
                    responseMessage.textContent = data.message || "Registration failed. Please try again.";
                }

            } catch (error) {
                responseMessage.style.display = "block";
                responseMessage.className = "message-box error";
                responseMessage.textContent = "An error occurred. Please try again.";
            }
        });
    </script>

</body>
</html>
