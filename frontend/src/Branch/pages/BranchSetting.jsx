import React, { useState, useEffect } from "react";
import Styles from '../components/module.css/BranchSetting.module.css'
import { useTheme } from "../../context/ThemeContext.jsx";
import {
  FaPalette,
  FaLock,
  FaSun,
  FaMoon,
  FaCheck,
  FaBuilding,
  FaMapMarkerAlt,
  FaCrosshairs,
  FaExternalLinkAlt,
  FaExclamationCircle,
} from "react-icons/fa";
import { getProfile, updateProfile, changePassword } from "../../api/services/Branch/Profile.js";
import BranchLayout from './../components/BranchLayout';

const TABS = [
  { id: "profile", label: "Branch Profile", icon: <FaBuilding /> },
  { id: "theme", label: "Theme", icon: <FaPalette /> },
  { id: "password", label: "Password", icon: <FaLock /> },
];

function BranchSetting() {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <BranchLayout title="Settings">
      <div className={Styles.wrapper}>
        {/* Tabs */}
        <div className={Styles.tabRail}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${Styles.tabBtn} ${
                activeTab === tab.id ? Styles.tabActive : ""
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className={Styles.tabIcon}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className={Styles.panel}>
          {activeTab === "profile" && <ProfileTab />}
          {activeTab === "theme" && <ThemeTab />}
          {activeTab === "password" && <PasswordTab />}
        </div>
      </div>
    </BranchLayout>
  );
}

function ProfileTab() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    deptname: "",
    deptadv: "",
    phone: "",
    location: "",
    website: "",
    urls: "",
    placename: "",
    latitude: null,
    longitude: null,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [locationCaptured, setLocationCaptured] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile();

        setForm({
          name: data.name || "",
          email: data.email || "",
          deptname: data.deptname || "",
          deptadv: data.deptadv || "",
          phone: data.phone || "",
          location: data.location || "",
          website: data.website || "",
          urls: data.urls || "",
          placename: data.placename || "",
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
        });
      } catch (err) {
        console.error("Failed to load branch profile:", err);
        setError("Could not load branch profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setSaved(false);
    setError("");
  };

  const handleGetCurrentLocation = () => {
    setLocationError("");
    setLocationCaptured(false);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.");
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        console.log("Branch current location:", {
          latitude,
          longitude,
        });

        setForm((prev) => ({
          ...prev,
          latitude,
          longitude,
        }));

        setLocationCaptured(true);
        setSaved(false);
        setLocating(false);
      },
      (geoError) => {
        console.error("Unable to get current location:", geoError);

        let message = "Unable to get your current location.";

        if (geoError.code === geoError.PERMISSION_DENIED) {
          message = "Location permission was denied. Allow location access in your browser and try again.";
        } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
          message = "Your current location could not be determined.";
        } else if (geoError.code === geoError.TIMEOUT) {
          message = "Location request timed out. Please try again.";
        }

        setLocationError(message);
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const payload = {
        name: form.name,
        phone: form.phone,
        location: form.location,
        website: form.website,
        urls: form.urls,
        placename: form.placename,
      };

      if (form.latitude !== null && form.longitude !== null) {
        payload.latitude_input = Number(form.latitude);
        payload.longitude_input = Number(form.longitude);
      }

      const updatedProfile = await updateProfile(payload);

      setForm((prev) => ({
        ...prev,
        name: updatedProfile?.name ?? prev.name,
        phone: updatedProfile?.phone ?? prev.phone,
        location: updatedProfile?.location ?? prev.location,
        website: updatedProfile?.website ?? prev.website,
        urls: updatedProfile?.urls ?? prev.urls,
        placename: updatedProfile?.placename ?? prev.placename,
        latitude: updatedProfile?.latitude ?? prev.latitude,
        longitude: updatedProfile?.longitude ?? prev.longitude,
      }));

      setSaved(true);
      setLocationCaptured(false);
    } catch (err) {
      console.error("Failed to update branch profile:", err);

      const backendError =
        err.response?.data?.detail ||
        err.response?.data?.latitude_input?.[0] ||
        err.response?.data?.longitude_input?.[0] ||
        err.response?.data?.phone?.[0] ||
        err.response?.data?.location?.[0] ||
        err.response?.data?.website?.[0] ||
        err.response?.data?.urls?.[0] ||
        "Could not save changes. Please try again.";

      setError(backendError);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={Styles.stateBlock}>
        <p>Loading branch profile...</p>
      </div>
    );
  }

  return (
    <form className={Styles.form} onSubmit={handleSubmit}>
      <h3 className={Styles.panelTitle}>Branch Profile</h3>
      <p className={Styles.panelSubtitle}>
        Manage your branch information, contact details and MyWard location.
      </p>

      {/* Department */}
      <div className={Styles.formSection}>
        <h4 className={Styles.sectionTitle}>DEPARTMENT</h4>
        <div className={Styles.fieldGrid}>
          <label className={Styles.field}>
            <span>Department</span>
            <input
              type="text"
              name="deptname"
              value={form.deptname}
              disabled
              placeholder="Department Name"
            />
          </label>
        </div>
      </div>

      {/* Branch Information */}
      <div className={Styles.formSection}>
        <h4 className={Styles.sectionTitle}>Branch Information</h4>

        <div className={Styles.fieldGrid}>
          <label className={Styles.field}>
            <span>Account Name</span>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Branch account name"
            />
          </label>

          <label className={Styles.field}>
            <span>Branch / Place Name</span>
            <input
              type="text"
              name="placename"
              value={form.placename}
              disabled
              placeholder="Branch place name"
            />
          </label>

          <label className={Styles.field}>
            <span>Email</span>
            <input
              type="email"
              name="email"
              value={form.email}
              readOnly
              disabled
            />
            <small>
              Email is your branch login ID and cannot be changed here.
            </small>
          </label>
        </div>
      </div>

      {/* Contact Information */}
      <div className={Styles.formSection}>
        <h4 className={Styles.sectionTitle}>Contact Information</h4>

        <div className={Styles.fieldGrid}>
          <label className={Styles.field}>
            <span>Phone</span>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Add phone number"
            />
          </label>

          <label className={Styles.field}>
            <span>Location / Address</span>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="Branch address"
            />
          </label>
        </div>
      </div>

      {/* Branch GPS Location */}
      <div className={Styles.formSection}>
        <h4 className={Styles.sectionTitle}>Branch GPS Location</h4>
        <p className={Styles.panelSubtitle}>
          This saved GPS location is used to determine the MyWard area and the disaster reports available to this branch.
        </p>

        <div className={Styles.fieldGrid}>
          <label className={Styles.field}>
            <span>Latitude</span>
            <input
              type="text"
              value={
                form.latitude !== null
                  ? Number(form.latitude).toFixed(6)
                  : "Not configured"
              }
              readOnly
              disabled
            />
          </label>

          <label className={Styles.field}>
            <span>Longitude</span>
            <input
              type="text"
              value={
                form.longitude !== null
                  ? Number(form.longitude).toFixed(6)
                  : "Not configured"
              }
              readOnly
              disabled
            />
          </label>
        </div>

        <div className={Styles.formFooter}>
          <div>
            {form.latitude !== null && form.longitude !== null ? (
              <>
                <span className={Styles.savedNote}>
                  <FaMapMarkerAlt /> Location configured
                </span>

                <a
                  href={`https://www.google.com/maps?q=${form.latitude},${form.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    marginLeft: "12px",
                    color: "#7C5CFC",
                    textDecoration: "none",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                  }}
                >
                  <FaExternalLinkAlt /> View on map
                </a>
              </>
            ) : (
              <span className={Styles.errorText}>
                <FaExclamationCircle /> Location not configured. Disaster reports require a saved branch location.
              </span>
            )}
          </div>

          <button
            type="button"
            className={Styles.primaryBtn}
            onClick={handleGetCurrentLocation}
            disabled={locating || saving}
          >
            <FaCrosshairs />
            {locating
              ? "Detecting location..."
              : form.latitude !== null
                ? "Update Current Location"
                : "Use Current Location"}
          </button>
        </div>

        {locationCaptured && (
          <p className={Styles.savedNote}>
            <FaCheck /> Current location captured. Click <strong>Save changes</strong> to store it for MyWard disaster reports.
          </p>
        )}

        {locationError && (
          <p className={Styles.errorText}>
            <FaExclamationCircle /> {locationError}
          </p>
        )}
      </div>

      {/* Website Information */}
      <div className={Styles.formSection}>
        <h4 className={Styles.sectionTitle}>Website & Links</h4>

        <div className={Styles.fieldGrid}>
          <label className={Styles.field}>
            <span>Website</span>
            <input
              type="url"
              name="website"
              value={form.website}
              onChange={handleChange}
              placeholder="https://example.com"
            />
          </label>

          <label className={Styles.field}>
            <span>Additional URL</span>
            <input
              type="url"
              name="urls"
              value={form.urls}
              onChange={handleChange}
              placeholder="https://example.com/contact"
            />
          </label>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className={Styles.errorText}>
          <FaExclamationCircle /> {error}
        </p>
      )}

      {/* Footer */}
      <div className={Styles.formFooter}>
        {saved && (
          <span className={Styles.savedNote}>
            <FaCheck /> Saved
          </span>
        )}

        <button
          type="submit"
          className={Styles.primaryBtn}
          disabled={saving || locating}
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function ThemeTab() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={Styles.form}>
      <h3 className={Styles.panelTitle}>Theme</h3>
      <p className={Styles.panelSubtitle}>
        Choose how CivicConnect looks on your device.
      </p>

      <div className={Styles.themeOptions}>
        <button
          type="button"
          className={`${Styles.themeCard} ${
            theme === "light" ? Styles.themeCardActive : ""
          }`}
          onClick={() => theme !== "light" && toggleTheme()}
        >
          <div className={Styles.themePreviewLight}>
            <FaSun />
          </div>
          <span>Light</span>
        </button>

        <button
          type="button"
          className={`${Styles.themeCard} ${
            theme === "dark" ? Styles.themeCardActive : ""
          }`}
          onClick={() => theme !== "dark" && toggleTheme()}
        >
          <div className={Styles.themePreviewDark}>
            <FaMoon />
          </div>
          <span>Dark</span>
        </button>
      </div>
    </div>
  );
}

function PasswordTab() {
  const [form, setForm] = useState({
    current: "",
    next: "",
    confirm: "",
  });

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

    setSuccess(false);

    setErrors({
      ...errors,
      [e.target.name]: "",
    });
  };

  const validate = () => {
    const errs = {};

    if (!form.current) {
      errs.current = "Enter your current password";
    }

    if (!form.next) {
      errs.next = "Enter a new password";
    } else if (form.next.length < 6) {
      errs.next = "Password must be at least 6 characters";
    }

    if (!form.confirm) {
      errs.confirm = "Confirm your new password";
    } else if (form.confirm !== form.next) {
      errs.confirm = "Passwords do not match";
    }

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errs = validate();
    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      return;
    }

    setSubmitting(true);
    setSuccess(false);

    try {
      await changePassword(
        form.current,
        form.next,
        form.confirm
      );

      setSuccess(true);

      setForm({
        current: "",
        next: "",
        confirm: "",
      });

      setErrors({});
    } catch (err) {
      console.error("Password update failed:", err);

      const apiErrors = err.response?.data || {};

      setErrors({
        current:
          apiErrors.current_password?.[0] ||
          apiErrors.detail ||
          "",
        next:
          apiErrors.new_password?.[0] || "",
        confirm:
          apiErrors.confirm_password?.[0] || "",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className={Styles.form} onSubmit={handleSubmit} noValidate>
      <h3 className={Styles.panelTitle}>Change Password</h3>
      <p className={Styles.panelSubtitle}>
        Choose a strong password for your branch account.
      </p>

      <div className={Styles.fieldGridSingle}>
        <label className={Styles.field}>
          <span>Current password</span>
          <input
            type="password"
            name="current"
            value={form.current}
            onChange={handleChange}
            className={errors.current ? Styles.inputError : ""}
          />
          {errors.current && (
            <span className={Styles.errorText}>
              {errors.current}
            </span>
          )}
        </label>

        <label className={Styles.field}>
          <span>New password</span>
          <input
            type="password"
            name="next"
            value={form.next}
            onChange={handleChange}
            className={errors.next ? Styles.inputError : ""}
          />
          {errors.next && (
            <span className={Styles.errorText}>
              {errors.next}
            </span>
          )}
        </label>

        <label className={Styles.field}>
          <span>Confirm new password</span>
          <input
            type="password"
            name="confirm"
            value={form.confirm}
            onChange={handleChange}
            className={errors.confirm ? Styles.inputError : ""}
          />
          {errors.confirm && (
            <span className={Styles.errorText}>
              {errors.confirm}
            </span>
          )}
        </label>
      </div>

      <div className={Styles.formFooter}>
        {success && (
          <span className={Styles.savedNote}>
            <FaCheck /> Password updated
          </span>
        )}

        <button
          type="submit"
          className={Styles.primaryBtn}
          disabled={submitting}
        >
          {submitting ? "Updating..." : "Update password"}
        </button>
      </div>
    </form>
  );
}

export default BranchSetting;
