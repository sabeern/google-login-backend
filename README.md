# Google Login Backend

This is the backend application for the Google Calendar Reminder System. It allows users to log in via Google and submit their phone number for event-based voice call alerts.

## 🚀 Getting Started

### 1. Clone the Repository

  - git clone https://github.com/sabeern/google-login-backend.git
  - cd google-login-backend
  - npm install

### 2. Setting Up the .env File

variables:

	DB_URL=your_database_url_here
	PORT=3000                             # Port number for your server
	USER_SCHEMA=users                    # MongoDB collection name for users
	JWT_SECRET_ACCESS=your_access_token_secret
	JWT_REFRESH_SECRET=your_refresh_token_secret
	GOOGLE_CLIENT_ID=your_google_client_id_here
	GOOGLE_CLIENT_SECRET=your_google_client_secret_here
	GOOGLE_URL=https://www.googleapis.com/oauth2/v1/userinfo
	TIME_VARIATION=0                     # Adjust if needed for time zone variations
	TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
	TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
	TWILIO_FROM_NUMBER=your_twilio_phone_number_here
	TWILIO_URL=http://demo.twilio.com/docs/voice.xml

### 3. Running the Project

  - npm run dev
