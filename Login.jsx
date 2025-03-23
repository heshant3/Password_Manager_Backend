"use client";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, verifyOtp } from "../../Api/Api"; // Add verifyOtp import
import styles from "./Login.module.css";
import { Toaster, toast } from "sonner";

const LoginPage = () => {
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(""); // Add OTP state
  const [isOtpSent, setIsOtpSent] = useState(false); // Add OTP sent state
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await login({ email, password });
      if (response.status === 200) {
        setIsOtpSent(true);
        toast.success("OTP sent to your email");
      }
    } catch (error) {
      toast.error("Login failed: Please enter correct credentials");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      const response = await verifyOtp({ email, otpCode: otp });
      if (response.status === 200) {
        const { userId, token } = response.data;
        localStorage.setItem("userId", userId);
        localStorage.setItem("token", token);
        navigate("/");
      }
    } catch (error) {
      toast.error("OTP verification failed");
    }
  };

  return (
    <main className={styles.loginPage}>
      <Toaster position="bottom-right" visibleToasts={1} />
      <div className={styles.contentWrapper}>
        <section className={styles.welcomeColumn}>
          <div className={styles.welcomeContainer}>
            <div className={styles.welcomeContent}>
              <h1 className={styles.welcomeTitle}>
                Secure Password <br />
                Management
              </h1>
              <p className={styles.welcomeDescription}>
                Access your secure password vault
              </p>
            </div>
          </div>
        </section>
        <section className={styles.formColumn}>
          <div className={styles.formContainer}>
            <div className={styles.formContent}>
              <h2 className={styles.formTitle}>Login</h2>
              <form onSubmit={isOtpSent ? handleVerifyOtp : handleSubmit}>
                <div className={styles.inputWrapper}>
                  <label className={styles.inputLabel}>Email</label>
                  <div className={styles.inputField}>
                    <input
                      type="email"
                      className={styles.input}
                      aria-label="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isOtpSent}
                    />
                  </div>
                </div>
                <div className={styles.inputWrapper}>
                  <label className={styles.inputLabel}>Password</label>
                  <div className={styles.inputField}>
                    <input
                      type="password"
                      className={styles.input}
                      aria-label="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isOtpSent}
                    />
                  </div>
                </div>
                {isOtpSent && (
                  <div className={styles.inputWrapper}>
                    <label className={styles.inputLabel}>OTP</label>
                    <div className={styles.inputField}>
                      <input
                        type="text"
                        className={styles.input}
                        aria-label="OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                      />
                    </div>
                  </div>
                )}
                <div className={styles.formActions}>
                  <label className={styles.checkboxWrapper}>
                    <div className={styles.checkboxContainer}>
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className={styles.checkbox}
                        disabled={isOtpSent}
                      />
                      <span className={styles.checkboxLabel}>Remember me</span>
                    </div>
                  </label>
                  <Link to="/forgetpassword" className={styles.forgotPassword}>
                    Forgot Password?
                  </Link>
                </div>
                <button type="submit" className={styles.loginButton}>
                  {isOtpSent ? "Verify OTP" : "Login"}
                </button>
              </form>
              <p className={styles.signupText}>
                Don't have an account? <Link to="/signup">Sign up</Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default LoginPage;
