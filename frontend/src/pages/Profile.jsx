import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, getCsrfToken } from "../utils/api";
import { API_ENDPOINTS, getMediaUrl } from "../constants/api";
import OwnerSidebar from "../components/OwnerSidebar";
import TenantSidebar from "../components/TenantSidebar";
import { User, Upload, Trash2, Camera, AlertTriangle, X } from "lucide-react";

function Profile({ user, onUpdateUser, refreshUser }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
  });
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [csrfToken, setCsrfToken] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    getCsrfToken().then(setCsrfToken);
    if (refreshUser) refreshUser();
  }, [refreshUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfilePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ type: "error", text: "Image size must be less than 2MB" });
        return;
      }
      setProfilePhotoFile(file);
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    const data = new FormData();
    data.append("full_name", formData.full_name);
    if (profilePhotoFile) data.append("profile_photo", profilePhotoFile);

    try {
      const response = await apiRequest(
        API_ENDPOINTS.UPDATE_PROFILE,
        { method: "POST", body: data },
        csrfToken,
      );
      const result = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: "Profile updated successfully!" });
        onUpdateUser(result.user);
        setProfilePhotoFile(null);
        setProfilePreview(null);
      } else {
        setMessage({
          type: "error",
          text: result.error || "Failed to update profile.",
        });
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 5000);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      const response = await apiRequest(
        API_ENDPOINTS.DELETE_ACCOUNT,
        { method: "DELETE" },
        csrfToken,
      );

      if (response.ok) {
        // Success - logout and redirect
        onUpdateUser(null);
        navigate("/");
      } else {
        const result = await response.json();
        setMessage({
          type: "error",
          text: result.error || "Failed to delete account.",
        });
        setShowDeleteModal(false);
      }
    } catch (error) {
      console.error("Delete account error:", error);
      setMessage({ type: "error", text: "A network error occurred." });
      setShowDeleteModal(false);
    } finally {
      setLoading(false);
    }
  };

  const isOwner = user?.role === "Owner" || user?.role === "owner";
  const SidebarComponent = isOwner ? OwnerSidebar : TenantSidebar;

  const avatarSrc =
    profilePreview ||
    (user?.profile_photo
      ? getMediaUrl(user.profile_photo)
      : `https://ui-avatars.com/api/?name=${user?.full_name || "User"}&background=f3f4f6&color=9ca3af&size=120`);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-inter">
      <SidebarComponent user={user} />

      <div className="flex-1 flex flex-col overflow-auto">
        <div className="p-8 max-w-4xl mx-auto w-full">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              {isOwner ? "Owner Profile" : "My Profile"}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Manage your account information and settings
            </p>
          </div>

          {/* Alert */}
          {message.text && (
            <div
              className={`px-4 py-3 rounded-lg text-sm mb-6 font-medium border flex items-center gap-2 ${
                message.type === "success"
                  ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                  : "bg-red-50 border-red-200 text-red-600"
              }`}
            >
              <span>{message.type === "success" ? "✓" : "✕"}</span>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Photo Card */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-5">
                Profile Photo
              </h3>
              <div className="flex items-center gap-6">
                <div className="relative flex-shrink-0">
                  <img
                    src={avatarSrc}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-100"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-7 h-7 bg-gray-900 rounded-full flex items-center justify-center text-white hover:bg-indigo-600 transition-colors shadow-md"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/jpeg, image/png, image/gif"
                    onChange={handleProfilePhotoChange}
                  />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {user?.full_name || "User"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-3 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-600 text-xs font-bold rounded-lg hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center gap-1.5"
                  >
                    <Upload className="w-3 h-3" /> Upload Photo
                  </button>
                  <p className="text-[10px] text-gray-400 mt-1.5">
                    JPG, PNG or GIF. Max 2MB
                  </p>
                </div>
              </div>
            </div>

            {/* Personal Details Card */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-5">
                Personal Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all text-gray-800 font-medium"
                  />
                </div>

                {/* Email — disabled */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-2.5 text-sm border border-gray-100 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed outline-none"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-5 mt-5 border-t border-gray-50">
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-2.5 text-sm font-bold text-white rounded-lg transition-all flex items-center gap-2 shadow-sm ${
                    loading
                      ? "bg-indigo-300 cursor-not-allowed"
                      : "bg-gray-900 hover:bg-indigo-600 hover:shadow-md"
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </div>

            {/* Account Info strip */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <User className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-700">
                    Account Role
                  </p>
                  <p className="text-xs text-gray-400">{user?.role}</p>
                </div>
              </div>
              {user?.is_identity_verified && (
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[10px] font-bold">
                  ✓ Identity Verified
                </span>
              )}
            </div>
          </form>

          {/* Danger Zone */}
          <div className="mt-6 bg-white rounded-xl border border-red-100 shadow-sm p-6">
            <h3 className="text-sm font-bold text-red-600 mb-1">
              Delete Account
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Once you delete your account, there is no going back. Please be
              certain.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-lg hover:bg-red-600 hover:text-white transition-all flex items-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Account
            </button>
          </div>

          {/* Delete Confirmation Modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Delete Account?
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Are you absolutely sure you want to delete your account?
                    This action is **permanent** and will remove all your data,
                    rooms, and bookings from our system.
                  </p>
                </div>

                <div className="bg-gray-50 p-6 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    No, Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg shadow-red-600/20"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Yes, Delete My Account"
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
