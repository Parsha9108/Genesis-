import React, { useState } from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";
import GenesisLogoCard from "../GenesisLogoCard";

const PasswordReset = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromState = location.state?.email || "";

  // 👁️ Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const initialValues = {
    email: emailFromState,
    password: "",
    confirm_password: "",
  };

  const ResetPasswordValidationSchema = Yup.object({
    email: Yup.string().email("Invalid email").required("Email is required"),
    password: Yup.string()
      .min(10, "Password must be at least 10 characters")
      .required("Password is required"),
    confirm_password: Yup.string()
      .oneOf([Yup.ref("password")], "Passwords must match")
      .required("Please re-enter your password"),
  });

  const onSubmit = async ({ email, password, confirm_password }, { setSubmitting }) => {
    try {
      const res = await axios.patch(`/api/webuser/password-reset/`, {
        email,
        password,
        confirm_password,
      });

      if (res.status === 200 || res.status === 201) {
        toast.success(res.data.message || "Password updated successfully!");
        navigate("/signin");
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to reset password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Genesis split */}
      <div className="w-[30%] flex items-center justify-center bg-blue-700">
        <GenesisLogoCard />
      </div>

      {/* Right side - Password Reset Form */}
      <div className="w-[70%] flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-6">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          {/* Title */}
          <h2 className="text-2xl font-semibold text-center text-gray-800 dark:text-gray-100 mb-2">
            Change Your Password
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 text-sm mb-6">
            Enter a new password below to change your password.
          </p>

          {/* Form */}
          <Formik
            initialValues={initialValues}
            validationSchema={ResetPasswordValidationSchema}
            onSubmit={onSubmit}
          >
            {({ errors, touched, values, isSubmitting, setFieldTouched }) => (
              <Form>
                {/* Email Field */}
                <div className="mb-4">
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Email<span className="text-red-500">*</span>
                  </label>
                  <Field
                    type="email"
                    name="email"
                    id="email"
                    disabled
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 
                      dark:bg-gray-700 dark:text-white dark:border-gray-600 bg-gray-100 cursor-not-allowed 
                      ${errors.email && touched.email ? "border-red-500" : "border-gray-300"}`}
                  />
                  {errors.email && touched.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                  )}
                </div>

                {/* New Password */}
                <div className="mb-4">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    New Password<span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Field
                      type={showPassword ? "text" : "password"}
                      name="password"
                      id="password"
                      onFocus={() => setFieldTouched("password", false)}
                      className={`w-full px-4 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 
                        focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 
                        ${errors.password && touched.password ? "border-red-500" : "border-gray-300"}`}
                    />
                    {/* 👁️ Eye Toggle */}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-500 
                        dark:text-gray-300 hover:text-gray-700 dark:hover:text-white focus:outline-none"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && touched.password && (
                    <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                  )}
                </div>

                {/* Re-enter Password */}
                <div className="mb-4">
                  <label
                    htmlFor="confirm_password"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Re-enter New Password<span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Field
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirm_password"
                      id="confirm_password"
                      onFocus={() => setFieldTouched("confirm_password", false)}
                      className={`w-full px-4 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 
                        focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 
                        ${errors.confirm_password && touched.confirm_password
                          ? "border-red-500"
                          : "border-gray-300"}`}
                    />
                    {/* 👁️ Eye Toggle */}
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-500 
                        dark:text-gray-300 hover:text-gray-700 dark:hover:text-white focus:outline-none"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.confirm_password && touched.confirm_password && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.confirm_password}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full bg-[#6366f1] hover:bg-[#6366f1]/80 text-white font-semibold py-3 rounded-md transition-colors 
                    ${isSubmitting ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  {isSubmitting ? "Resetting..." : "Reset Password"}
                </button>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default PasswordReset;
