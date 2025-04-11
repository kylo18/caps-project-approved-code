<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - CAPS</title>
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

        /* Login Container */
        .login-container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            text-align: center;
            width: 350px;
        }

        /* Title */
        .login-container h2 {
            color: #FF7300;
            margin-bottom: 20px;
        }

        /* Input Fields */
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

        .input-group input {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
        }

        /* Login Button */
        .login-btn {
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

        .login-btn:hover {
            background: #E66500;
        }

        /* Response Message */
        .response-message {
            margin-top: 15px;
            padding: 10px;
            border-radius: 5px;
            font-size: 14px;
            display: none;
        }

        .success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }

        .error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }

        /* Responsive Design */
        @media (max-width: 400px) {
            .login-container {
                width: 90%;
            }
        }
    </style>
</head>
<body>

    <div class="login-container">
        <h2>Login</h2>
        <form id="loginForm">
            <div class="input-group">
                <label for="userCode">User Code:</label>
                <input type="text" id="userCode" name="userCode" required>
            </div>

            <div class="input-group">
                <label for="password">Password:</label>
                <input type="password" id="password" name="password" required>
            </div>

            <button type="submit" class="login-btn">Login</button>
        </form>

        <!-- Response Message -->
        <div id="responseMessage" class="response-message"></div>
    </div>

    <script>
        document.getElementById('loginForm').addEventListener('submit', async function(event) {
            event.preventDefault(); // Prevent form from submitting traditionally

            let formData = new FormData(this);
            let responseMessage = document.getElementById('responseMessage');
            
            try {
                let response = await fetch("{{ url('/api/login') }}", {
                    method: "POST",
                    body: formData,
                    headers: {
                        "X-Requested-With": "XMLHttpRequest",
                        "Accept": "application/json"
                    }
                });

                let data = await response.json();

                if (response.ok) {
                    responseMessage.textContent = "Login Successful! Redirecting...";
                    responseMessage.className = "response-message success";
                    responseMessage.style.display = "block";

                    setTimeout(() => {
                        window.location.href = "/dashboard"; // Redirect after success
                    }, 2000);
                } else {
                    responseMessage.textContent = data.message || "Invalid credentials.";
                    responseMessage.className = "response-message error";
                    responseMessage.style.display = "block";
                }
            } catch (error) {
                responseMessage.textContent = "Something went wrong. Please try again.";
                responseMessage.className = "response-message error";
                responseMessage.style.display = "block";
            }
        });
    </script>

</body>
</html>
