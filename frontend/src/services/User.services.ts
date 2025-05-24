import axios from 'axios';

const AUTH_API_URL = 'http://localhost:4000/auth'; // Replace with your actual API URL
const USER_API_URL = 'http://localhost:4000/users'; // Replace with your actual API URL

interface RegisterUserInput {
    email: string;
    password: string;
    name: string;
}

interface RegisterResponse {
    message: string;
    userId?: number;
}

interface LoginInput {
    email: string;
    password: string;
}


interface LoginSuccessResponse {
    user: {
        id: number;
        email: string;
    };
    token: string;
}

interface ForgotPasswordInput {
    email: string;
}

interface ForgotPasswordResponse {
    message: string;
    expiresAt: string; // ISO string date
}

// Register
export async function registerUser({ email, password, name }: RegisterUserInput): Promise<RegisterResponse> {
    try {
        const response = await axios.post<RegisterResponse>(`${AUTH_API_URL}/register`, {
            email,
            password,
            name
        });

        return response.data;

    } catch (error: any) {
        const message = error.response?.data?.message || 'Registration failed';
        throw new Error(message);
    }
}

// Login
export async function loginUser({ email, password }: LoginInput): Promise<LoginSuccessResponse> {
    try {
        const response = await axios.post<LoginSuccessResponse>(`${AUTH_API_URL}/login`, {
            email,
            password
        });

        return response.data;

    } catch (error: any) {
        const message = error.response?.data?.message || 'Login failed';
        throw new Error(message);
    }
}

// Forgot Password
export async function forgetPassword({ email }: ForgotPasswordInput): Promise<ForgotPasswordResponse> {
    try {
        const response = await axios.post<ForgotPasswordResponse>(`${AUTH_API_URL}/forgot-password`, {
            email
        });
        return response.data;
    } catch (error: any) {
        const message = error.response?.data?.message || 'Password reset failed';
        throw new Error(message);
    }
}

// Change Password
export async function changePassword({ email, oldPassword, newPassword }: any): Promise<any> {
    try {
        const response = await axios.post<any>(`${AUTH_API_URL}/reset-password`, {
            email,
            password: oldPassword,
            newPassword
        });
        return response.data;
    } catch (error: any) {
        const message = error.response?.data?.message || 'Password reset failed';
        throw new Error(message);
    }
}

// Request password change - logged User
// this API will send OTP
export async function requestChangePassword(email: string) {
    try {
        const response = await axios.post<any>(`${USER_API_URL}/req-change-password`, email);
        return response.data;
    } catch (error: any) {
        const message = error.response?.data?.message || 'Password change reqest failed';
        throw new Error(message);
    }
}

// this will verify the OTP
export async function doVerifyOTP(email: string, otp: string) {
    try {
        const response = await axios.post<any>(`${USER_API_URL}/req-change-password`,
            { email, otp }
        );
        return response.data;
    } catch (error: any) {
        const message = error.response?.data?.message || 'Verifing OTP failed';
        throw new Error(message);
    }
}

// this API will change the password, 
export async function authChangePassword(email: string, newPassword: string) {
    try {
        const response = await axios.post<any>(`${USER_API_URL}/req-change-password`,
            { email, newPassword }
        );
        return response.data;
    } catch (error: any) {
        const message = error.response?.data?.message || 'Password reset failed';
        throw new Error(message);
    }
}