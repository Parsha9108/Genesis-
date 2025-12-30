import { Formik, Form, Field } from "formik";
import SignValidationSchema from "./SignInValidationSchema";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import ReCaptcha from "react-google-recaptcha";
import { useAuth } from "../../../Contexts/AuthContext";
import { useDispatch } from "react-redux"; // Added this
import { setPermissions } from "../../../redux/userModulePermission"; // Added this
import { useRef, useState } from "react";
import { useDocumentTitle } from "../../../Hooks/useDocumentTitle";
import GenesisLogoCard from "../GenesisLogoCard";

const SignIn = () => {
  useDocumentTitle("Sign In");
  const { setAuthenticated } = useAuth();
  const dispatch = useDispatch(); // Added this
  const recaptchaRef = useRef(null);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const initialValues = {
    email: "",
    password: "",
  };

  const onSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const res = await axios.post("/api/webuser/signin/", values, {
        withCredentials: true,
      });
      console.log("Login response:", res);
      if (res.status === 200) {
        toast.success(res.data.message || "Login successful!");
        setAuthenticated(true);
        navigate("/");
      }

      // Added this to fecth the permissions 
      try {
        const permResponse = await axios.get(
          "/api/webuser/modules/permissions/all",
          {
            withCredentials: true,
          }
        );
        console.log("Permissions fetched:", permResponse.data);

        // Dispatch permissions to Redux
        if (permResponse.data.permissions) {
          dispatch(setPermissions(permResponse.data.permissions));
        } else {
          dispatch(setPermissions(permResponse.data));
        }

        console.log("Permissions updated in Redux store");
      } catch (permError) {
        console.error("Failed to fetch permissions:", permError);
        toast.warning("Could not load permissions");
      }

    }
    catch (error) {
      const errorMessage = error.response?.data?.error;
      console.log(errorMessage)
      if (error.response?.status === 404) {
        toast.warning(errorMessage);
      } else if (error.response?.status === 401) {
        toast.error(errorMessage);
      } else if (error.response?.status === 403) {
        const errorData = error.response.data;
        // Show specific error message from backend
        toast.error(errorData.message);
        // Optional: Show error details
      }
      else {
        toast.error("Server error. Please try again later.");
      }
      resetForm();
    } finally {
      setSubmitting(false);
      recaptchaRef.current?.reset();
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Genesis split panel */}
      <div className="w-[30%] flex items-center justify-center bg-blue-700">
        <GenesisLogoCard />
      </div>

      {/* Right side - Form */}
      <div className="w-[70%] flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-6">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-center text-gray-800 dark:text-gray-100 mb-2">
            Sign In
          </h2>

          <Formik
            initialValues={initialValues}
            validationSchema={SignValidationSchema}
            onSubmit={onSubmit}
          >
            {({ errors, touched, isSubmitting, setFieldTouched }) => {
              const isEmailValid = touched.email && !errors.email;

              return (
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
                      onFocus={() => setFieldTouched("email", false)}
                      className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${errors.email && touched.email
                        ? "border-red-500"
                        : "border-gray-300"
                        }`}
                    />
                    {errors.email && touched.email && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Password Field with Eye Toggle */}
                  <div className="mb-4 relative">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Password<span className="text-red-500">*</span>
                    </label>

                    <div className="relative">
                      <Field
                        type={showPassword ? "text" : "password"}
                        name="password"
                        id="password"
                        // Remove disabled entirely
                        onFocus={() => setFieldTouched("password", false)}
                        className={`w-full px-4 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 
                          ${!isEmailValid ? "bg-gray-100 cursor-not-allowed opacity-50" : ""} 
                          ${errors.password && touched.password ? "border-red-500" : "border-gray-300"}`}
                        readOnly={!isEmailValid}  // Optional: prevents typing but allows tab focus
                      />

                      {/* Eye Icon */}
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

                  {/* Forgot Password */}
                  <div className="mb-4">
                    <Link
                      to="/forgot-password"
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Forgot Password?
                    </Link>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full bg-[#6366f1] hover:bg-[#6366f1]/80 text-white font-semibold py-3 rounded-md transition-colors ${isSubmitting ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                  >
                    {isSubmitting ? "Signing in..." : "Sign In"}
                  </button>
                </Form>
              );
            }}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
