process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/blood-finder-test';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.CORS_ORIGINS = 'http://localhost:3000';
process.env.JWT_ACCESS_SECRET = 'a-very-long-test-access-secret-that-is-over-32-characters';
process.env.JWT_REFRESH_SECRET = 'a-very-long-test-refresh-secret-that-is-over-32-characters';
process.env.CSRF_SECRET = 'a-very-long-test-csrf-secret-that-is-over-32-characters';
process.env.OTP_PEPPER = 'a-very-long-test-otp-pepper-that-is-over-32-characters';
