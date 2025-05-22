import axios from "axios";

const API_URL = "http://localhost:5000/api/auth";

export const signup = async (userData) => {
  return axios.post(`${API_URL}/register`, userData);
};

export const login = async (userData) => {
  return axios.post(`${API_URL}/login`, userData);
};

export const verifyOtp = async (otpData) => {
  return axios.post(`${API_URL}/verify-otp`, otpData);
};
