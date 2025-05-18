import axios from 'axios';

const API_URL = 'http://localhost:4000/auth'; // Replace with your actual API URL

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
        const response = await axios.post<RegisterResponse>(`${API_URL}/register`, {
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
        const response = await axios.post<LoginSuccessResponse>(`${API_URL}/login`, {
            email,
            password
        });

        return response.data;

    } catch (error: any) {
        const message = error.response?.data?.message || 'Login failed';
        throw new Error(message);
    }
}

export async function forgetPassword({ email }: ForgotPasswordInput): Promise<ForgotPasswordResponse> {
    try {
        const response = await axios.post<ForgotPasswordResponse>(`${API_URL}/forgot-password`, {
            email
        });
        return response.data;
    } catch (error: any) {
        const message = error.response?.data?.message || 'Password reset failed';
        throw new Error(message);
    }
}

export async function changePassword({ email, oldPassword, newPassword }: any): Promise<any> {
    try {
        const response = await axios.post<any>(`${API_URL}/reset-password`, {
            email,
            password:oldPassword,
            newPassword
        });
        return response.data;
    } catch (error: any) {
        const message = error.response?.data?.message || 'Password reset failed';
        throw new Error(message);
    }
}