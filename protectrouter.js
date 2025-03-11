import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import io from "socket.io-client"; // Add this line

const socket = io("http://localhost:5000"); // Add this line

const ProtectedRoute = ({ children }) => {
  const [isTokenValid, setIsTokenValid] = useState(true); // Add this line
  const token = localStorage.getItem("token");

  console.log("token", token);

  useEffect(() => {
    socket.on("tokenExpired", () => {
      setIsTokenValid(false);
      localStorage.clear(); // Add this line
    });

    return () => {
      socket.off("tokenExpired");
    };
  }, []);

  if (!token || !isTokenValid) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;
