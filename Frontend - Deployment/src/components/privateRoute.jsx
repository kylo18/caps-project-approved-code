import React from "react";
import { Route, Navigate } from "react-router-dom";

const PrivateRoute = ({ element: Element, ...rest }) => {
  const token = localStorage.getItem("token");

  return (
    <Route
      {...rest}
      element={
        token ? (
          <Element /> // If logged in, render the requested component
        ) : (
          <Navigate to="/" /> // Redirect to login if not logged in
        )
      }
    />
  );
};

export default PrivateRoute;
