// import React, { useState } from "react";
// import { Formik, Form, Field } from "formik";
// import * as Yup from "yup";
// import { useParams, useSearchParams, useNavigate } from "react-router-dom";
// import axios from "axios";
// import { toast } from "react-toastify";
// import { Eye, EyeOff } from "lucide-react";
// import GenesisLogoCard from "../GenesisLogoCard";

// const ResetPassword = () => {
//   const navigate = useNavigate();
//   const { uuid } = useParams();
//   const [searchParams] = useSearchParams();
//   const token = searchParams.get("token");
//   console.log("token",token)
//   // 👁️ Password visibility toggles
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);

//   const initialValues = {
//     password: "",
//     confirm_password: "",
//   };

//   const ResetPasswordValidationSchema = Yup.object({
//     password: Yup.string()
//       .min(6, "Password must be at least 6 characters")
//       .required("Password is required"),
//     confirm_password: Yup.string()
//       .oneOf([Yup.ref("password")], "Passwords must match")
//       .required("Confirm Password is required"),
//   });

//   const onSubmit = async ({ password, confirm_password }, { setSubmitting }) => {
//     try {
//       const res = await axios.patch(`/api/webuser/password-reset/${token}`,
//         { password, confirm_password }
//       );
//       console.log("res",res)
//       if (res.status === 200 || res.status === 201) {
//         toast.success(res.data.message || "Password updated successfully!");
//         navigate("/signin");
//       }
//     } catch (error) {
//       if (error.response?.status === 500) {
//         toast.error(
//           error.response?.data?.error ||
//             "Something went wrong. Please try again."
//         );
//       } else {
//         toast.error("Server error. Please try later.");
//       }
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <div className="flex min-h-screen">
//       {/* Left side - Genesis split */}
//       <div className="w-[30%] flex items-center justify-center bg-blue-700">
//         <GenesisLogoCard />
//       </div>

//       {/* Right side - reset password form */}
//       <div className="w-[70%] flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-6">
//         <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
//           {/* Title */}
//           <h2 className="text-2xl font-semibold text-center text-gray-800 dark:text-gray-100 mb-2">
//             Update Password
//           </h2>
//           <p className="text-center text-gray-600 dark:text-gray-400 text-sm mb-6">
//             Please enter your new password below.
//           </p>

//           {/* Form */}
//           <Formik
//             initialValues={initialValues}
//             validationSchema={ResetPasswordValidationSchema}
//             onSubmit={onSubmit}
//           >
//             {({ errors, touched, isSubmitting, setFieldTouched }) => {
//               const isPasswordValid = touched.password && !errors.password;

//               return (
//                 <Form>
//                   {/* 🔒 New Password Field */}
//                   <div className="mb-4 relative">
//                     <label
//                       htmlFor="password"
//                       className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
//                     >
//                       New Password<span className="text-red-500">*</span>
//                     </label>
//                     <div className="relative">
//                       <Field
//                         type={showPassword ? "text" : "password"}
//                         name="password"
//                         id="password"
//                         onFocus={() => setFieldTouched("password", false)}
//                         className={`w-full px-4 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
//                           errors.password && touched.password
//                             ? "border-red-500"
//                             : "border-gray-300"
//                         }`}
//                       />
//                       {/* 👁️ Eye Toggle */}
//                       <button
//                         type="button"
//                         onClick={() => setShowPassword(!showPassword)}
//                         className="absolute inset-y-0 right-3 flex items-center text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white focus:outline-none"
//                       >
//                         {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//                       </button>
//                     </div>
//                     {errors.password && touched.password && (
//                       <p className="text-red-500 text-xs mt-1">
//                         {errors.password}
//                       </p>
//                     )}
//                   </div>

//                   {/* 🔒 Confirm Password Field */}
//                   <div className="mb-4 relative">
//                     <label
//                       htmlFor="confirm_password"
//                       className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
//                     >
//                       Confirm Password<span className="text-red-500">*</span>
//                     </label>
//                     <div className="relative">
//                       <Field
//                         type={showConfirmPassword ? "text" : "password"}
//                         name="confirm_password"
//                         id="confirm_password"
//                         disabled={!isPasswordValid}
//                         onFocus={() =>
//                           setFieldTouched("confirm_password", false)
//                         }
//                         className={`w-full px-4 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
//                           !isPasswordValid
//                             ? "bg-gray-100 dark:bg-gray-600 cursor-not-allowed"
//                             : ""
//                         } ${
//                           errors.confirm_password && touched.confirm_password
//                             ? "border-red-500"
//                             : "border-gray-300"
//                         }`}
//                       />
//                       {/* 👁️ Eye Toggle */}
//                       <button
//                         type="button"
//                         onClick={() =>
//                           setShowConfirmPassword(!showConfirmPassword)
//                         }
//                         className="absolute inset-y-0 right-3 flex items-center text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white focus:outline-none"
//                       >
//                         {showConfirmPassword ? (
//                           <EyeOff size={18} />
//                         ) : (
//                           <Eye size={18} />
//                         )}
//                       </button>
//                     </div>
//                     {errors.confirm_password && touched.confirm_password && (
//                       <p className="text-red-500 text-xs mt-1">
//                         {errors.confirm_password}
//                       </p>
//                     )}
//                   </div>

//                   {/* ✅ Submit Button */}
//                   <button
//                     type="submit"
//                     disabled={isSubmitting}
//                     className={`w-full bg-[#6366f1] hover:bg-[#6366f1]/80 text-white font-semibold py-3 rounded-md transition-colors ${
//                       isSubmitting ? "opacity-60 cursor-not-allowed" : ""
//                     }`}
//                   >
//                     {isSubmitting ? "Updating..." : "Update Password"}
//                   </button>
//                 </Form>
//               );
//             }}
//           </Formik>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ResetPassword;
import React, { useEffect, useState } from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { Eye, EyeOff, XCircle } from "lucide-react";
import GenesisLogoCard from "../GenesisLogoCard";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  // State to store verification status
  const [tokenValid, setTokenValid] = useState(null); // null = loading, true = valid, false = invalid/expired

  // 👁️ Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Token validation on mount
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const res = await axios.get(
          `/api/webuser/register/verify-reset-passowrd-token/?token=${encodeURIComponent(token)}`
        );

        if (res.status === 200 && res.data.valid) {
          setTokenValid(true);
        } else {
          toast.error(res.data.error);
          setTokenValid(false);
          setTimeout(() => {
            navigate('/forgot-password');
          }, 2000);
        }
      } catch (err) {
        const msg =
          err.response?.data?.error ||
          'Verification failed. Please request a new link.';
        toast.error(msg);
        setTokenValid(false);
        setTimeout(() => {
          navigate('/forgot-password');
        }, 2000);
      }
    };

    if (token) {
      verifyToken();
    } else {
      toast.error('No token provided');
      navigate('/forgot-password');
    }
  }, [token, navigate]);


  const initialValues = {
    password: "",
    confirm_password: "",
  };

  const ResetPasswordValidationSchema = Yup.object({
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
    confirm_password: Yup.string()
      .oneOf([Yup.ref("password")], "Passwords must match")
      .required("Confirm Password is required"),
  });
  const onSubmit = async ({ password, confirm_password }, { setSubmitting }) => {
    try {
      const res = await axios.patch(`/api/webuser/password-reset/?token=${encodeURIComponent(token)}`, {
        password,
        confirm_password
      });
      if (res.status === 200 || res.status === 201) {
        toast.success(res.data.message || "Password updated successfully!");
        navigate("/signin");
      }
    } catch (error) {
      if (error.response?.status === 500) {
        toast.error(
          error.response?.data?.error ||
          "Something went wrong. Please try again."
        );
      } else {
        toast.error("Server error. Please try later.");
      }
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

      {/* Right side - reset password form or error */}
      <div className="w-[70%] flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-6">
        {/* Loading State */}
        {tokenValid === null && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <div className="text-lg text-gray-600 dark:text-gray-300">
              Verifying link...
            </div>
          </div>
        )}

        {/* Token Expired/Invalid State - Shows briefly before redirect */}
        {tokenValid === false && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-sm text-center">
            <div className="flex justify-center mb-4">
              <XCircle size={48} className="text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
              Link Expired
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Reset password verification link expired.Please request a new link
            </p>
          </div>
        )}

        {/* Valid Token - Show Form */}
        {tokenValid === true && (
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            {/* Title */}
            <h2 className="text-2xl font-semibold text-center text-gray-800 dark:text-gray-100 mb-2">
              Update Password
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-400 text-sm mb-6">
              Please enter your new password below.
            </p>
            {/* Form */}
            <Formik
              initialValues={initialValues}
              validationSchema={ResetPasswordValidationSchema}
              onSubmit={onSubmit}
            >
              {({ errors, touched, isSubmitting, setFieldTouched }) => {
                const isPasswordValid = touched.password && !errors.password;

                return (
                  <Form>
                    {/* 🔒 New Password Field */}
                    <div className="mb-4 relative">
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
                          className={`w-full px-4 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${errors.password && touched.password
                              ? "border-red-500"
                              : "border-gray-300"
                            }`}
                        />
                        {/* 👁️ Eye Toggle */}
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-3 flex items-center text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white focus:outline-none"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {errors.password && touched.password && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.password}
                        </p>
                      )}
                    </div>

                    {/* 🔒 Confirm Password Field */}
                    <div className="mb-4 relative">
                      <label
                        htmlFor="confirm_password"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Confirm Password<span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Field
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirm_password"
                          id="confirm_password"
                          disabled={!isPasswordValid}
                          onFocus={() =>
                            setFieldTouched("confirm_password", false)
                          }
                          className={`w-full px-4 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${!isPasswordValid
                              ? "bg-gray-100 dark:bg-gray-600 cursor-not-allowed"
                              : ""
                            } ${errors.confirm_password && touched.confirm_password
                              ? "border-red-500"
                              : "border-gray-300"
                            }`}
                        />
                        {/* 👁️ Eye Toggle */}
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute inset-y-0 right-3 flex items-center text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white focus:outline-none"
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                      {errors.confirm_password && touched.confirm_password && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.confirm_password}
                        </p>
                      )}
                    </div>

                    {/* ✅ Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-full bg-[#6366f1] hover:bg-[#6366f1]/80 text-white font-semibold py-3 rounded-md transition-colors ${isSubmitting ? "opacity-60 cursor-not-allowed" : ""
                        }`}
                    >
                      {isSubmitting ? "Updating..." : "Update Password"}
                    </button>
                  </Form>
                );
              }}
            </Formik>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
