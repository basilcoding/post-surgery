// components/RegisterUserForm.jsx
import React, { useState } from "react";
import { Camera, User, Mail, Lock, EyeOff, Eye, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAdminStore } from "../../store/useAdminStore.js";

const SPECIALTIES = ["cardiology", "psychiatry", "general", "other"];

const RegisterUserForm = ({ onSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "doctor",
    specialty: "",
    primaryRequiredSpecialty: "",
  });
  const [profilePic, setProfilePic] = useState(null);
  const [preview, setPreview] = useState(null);

  const { adminRegister, isSigningUp } = useAdminStore();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image");
      return;
    }
    setProfilePic(file);
    setPreview(URL.createObjectURL(file));
  };

  const validateForm = () => {
    if (!formData.fullName.trim())
      return toast.error("Full name is required!");
    if (!formData.email.trim()) return toast.error("Email is required!");
    if (!/\S+@\S+\.\S+/.test(formData.email))
      return toast.error("Invalid email format");
    if (!formData.password.trim()) return toast.error("Password is required!");
    if (formData.password.length < 6)
      return toast.error("Password must be at least 6 characters");

    if (formData.role === "doctor" && !formData.specialty) {
      return toast.error("Specialty is required for doctors");
    }
    if (formData.role === "patient" && !formData.primaryRequiredSpecialty) {
      return toast.error("Required specialty is required for patients");
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm() !== true) return;

    const data = new FormData();
    data.append("email", formData.email);
    data.append("fullName", formData.fullName);
    data.append("password", formData.password);
    data.append("role", formData.role);

    if (formData.role === "doctor") {
      data.append("specialty", formData.specialty);
    }
    if (formData.role === "patient") {
      data.append("primaryRequiredSpecialty", formData.primaryRequiredSpecialty);
    }

    if (profilePic) data.append("profilePic", profilePic);

    const result = await adminRegister(data);
    if (result) {
      setFormData({
        email: "",
        fullName: "",
        password: "",
        role: "doctor",
        specialty: "",
        primaryRequiredSpecialty: "",
      });
      setProfilePic(null);
      setPreview(null);
      if (onSuccess) onSuccess(); // refresh doctor/patient list
    }
  };

  return (
    <div className="space-y-6 border p-6 rounded-2xl shadow">
      <h2 className="text-xl font-semibold mb-4">Register User</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile picture */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <img
              src={preview || "/avatar.png"}
              alt="Preview"
              className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
            />
            <label
              htmlFor="avatar-upload"
              className="absolute bottom-0 right-0 bg-gray-700 p-2 rounded-full cursor-pointer hover:scale-105 transition"
            >
              <Camera className="w-5 h-5 text-white" />
              <input
                type="file"
                id="avatar-upload"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {profilePic ? profilePic.name : "Upload profile picture"}
          </p>
        </div>

        {/* Full Name */}
        <input
          type="text"
          name="fullName"
          className="input input-bordered w-full"
          placeholder="John Doe"
          value={formData.fullName}
          onChange={handleChange}
        />

        {/* Email */}
        <input
          type="email"
          name="email"
          className="input input-bordered w-full"
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange}
        />

        {/* Password */}
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            className="input input-bordered w-full"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="size-5 text-base-content/40" />
            ) : (
              <Eye className="size-5 text-base-content/40" />
            )}
          </button>
        </div>

        {/* Role */}
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="select select-bordered w-full"
        >
          <option value="doctor">Doctor</option>
          <option value="patient">Patient</option>
        </select>

        {/* Conditional Specialty Fields */}
        {formData.role === "doctor" && (
          <select
            name="specialty"
            value={formData.specialty}
            onChange={handleChange}
            className="select select-bordered w-full"
          >
            <option value="">Select Specialty</option>
            {SPECIALTIES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        )}

        {formData.role === "patient" && (
          <select
            name="primaryRequiredSpecialty"
            value={formData.primaryRequiredSpecialty}
            onChange={handleChange}
            className="select select-bordered w-full"
          >
            <option value="">Select Required Specialty</option>
            {SPECIALTIES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        )}

        {/* Submit */}
        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={isSigningUp}
        >
          {isSigningUp ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Registering...
            </>
          ) : (
            "Register User"
          )}
        </button>
      </form>
    </div>
  );
};

export default RegisterUserForm;
