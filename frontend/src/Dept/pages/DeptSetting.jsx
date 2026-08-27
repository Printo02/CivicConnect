import React, { useState, useEffect } from "react";
import Styles from "../components/module.css/DeptSetting.module.css";
import { useTheme } from "../../context/ThemeContext.jsx";
import {
  FaUser,
  FaPalette,
  FaLock,
  FaSun,
  FaMoon,
  FaCheck,
  FaBuilding,
} from "react-icons/fa";

import {
  getProfile,
  updateProfile,
  changePassword,
} from "../../api/services/Dept/ProfileService.js";

import DeptLayout from "./../components/DeptLayout";

const TABS = [
  { id: "profile", label: "Department Profile", icon: <FaBuilding /> },
  { id: "theme", label: "Theme", icon: <FaPalette /> },
  { id: "password", label: "Password", icon: <FaLock /> },
];

function DeptSetting() {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <DeptLayout title="Settings">
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
    </DeptLayout>
  );
}


/* =========================================================
   PROFILE TAB
========================================================= */

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
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

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
        });

      } catch (err) {
        console.error("Failed to load department profile:", err);
        setError("Could not load department profile.");
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setSaved(false);
    setError("");

    try {
      await updateProfile({
        name: form.name,
        deptname: form.deptname,
        deptadv: form.deptadv,
        phone: form.phone,
        location: form.location,
        website: form.website,
        urls: form.urls,
        placename: form.placename,
      });

      setSaved(true);

    } catch (err) {
      console.error("Failed to update department profile:", err);

      const backendError =
        err.response?.data?.detail ||
        err.response?.data?.deptname?.[0] ||
        err.response?.data?.deptadv?.[0] ||
        err.response?.data?.phone?.[0] ||
        err.response?.data?.website?.[0] ||
        "Could not save changes. Please try again.";

      setError(backendError);

    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={Styles.stateBlock}>
        <p>Loading department profile...</p>
      </div>
    );
  }

  return (
    <form className={Styles.form} onSubmit={handleSubmit}>
      <h3 className={Styles.panelTitle}>Department Profile</h3>
      <p className={Styles.panelSubtitle}>Manage your department information and contact details.</p>
      <div className={Styles.formSection}>
        <h4 className={Styles.sectionTitle}>Department Information</h4>
        <div className={Styles.fieldGrid}>
          <label className={Styles.field}>
            <span>Department Name</span>
            <input type="text" name="deptname" value={form.deptname} onChange={handleChange}
              placeholder="Public Works Department" />
          </label>
          <label className={Styles.field}>
            <span>Abbreviation</span>
            <input type="text" name="deptadv" value={form.deptadv} onChange={handleChange} placeholder="PWD" />
          </label>
          {/* Display Name */}
          <label className={Styles.field}>
            <span>Account Name</span>
            <input type="text" name="name"  value={form.name} onChange={handleChange} placeholder="Department account name"/>
          </label>


          {/* Email */}
          <label className={Styles.field}>
            <span>Email</span>
            <input type="email" name="email" value={form.email} readOnly disabled />
            <small>
              Email is your department login ID and cannot be changed here.
            </small>
          </label>

        </div>

      </div>


      {/* Contact Information */}
      <div className={Styles.formSection}>

        <h4 className={Styles.sectionTitle}>
          Contact Information
        </h4>

        <div className={Styles.fieldGrid}>

          {/* Phone */}
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


          {/* Location */}
          <label className={Styles.field}>
            <span>Location</span>

            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="Department location"
            />
          </label>


          {/* Place */}
          <label className={Styles.field}>
            <span>Place Name</span>

            <input
              type="text"
              name="placename"
              value={form.placename}
              onChange={handleChange}
              placeholder="Kochi"
            />
          </label>

        </div>

      </div>


      {/* Website Information */}
      <div className={Styles.formSection}>

        <h4 className={Styles.sectionTitle}>
          Website & Links
        </h4>

        <div className={Styles.fieldGrid}>

          {/* Website */}
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


          {/* Other URL */}
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
          {error}
        </p>
      )}


      {/* Footer */}
      <div className={Styles.formFooter}>

        {saved && (
          <span className={Styles.savedNote}>
            <FaCheck />
            Saved
          </span>
        )}

        <button
          type="submit"
          className={Styles.primaryBtn}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save changes"}
        </button>

      </div>

    </form>
  );
}


/* =========================================================
   THEME TAB
========================================================= */

function ThemeTab() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={Styles.form}>

      <h3 className={Styles.panelTitle}>
        Theme
      </h3>

      <p className={Styles.panelSubtitle}>
        Choose how CivicConnect looks on your device.
      </p>

      <div className={Styles.themeOptions}>

        {/* Light */}
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


        {/* Dark */}
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


/* =========================================================
   PASSWORD TAB
========================================================= */

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
      <p className={Styles.panelSubtitle}>Choose a strong password for your department account.</p>
      <div className={Styles.fieldGridSingle}>
        <label className={Styles.field}>
          <span>Current password</span>
          <input type="password" name="current" value={form.current} onChange={handleChange}
            className={
              errors.current
                ? Styles.inputError
                : ""
            }/>
          {errors.current && (
            <span className={Styles.errorText}>
              {errors.current}
            </span>
          )}
        </label>
        <label className={Styles.field}>
          <span>New password</span>
          <input type="password" name="next" value={form.next}
            onChange={handleChange}
            className={
              errors.next
                ? Styles.inputError
                : ""
            }
          />
          {errors.next && (
            <span className={Styles.errorText}>
              {errors.next}
            </span>
          )}
        </label>
        <label className={Styles.field}>
          <span>Confirm new password</span>
          <input type="password" name="confirm" value={form.confirm} onChange={handleChange} 
            className={
              errors.confirm
                ? Styles.inputError
                : ""
            }
          />
          {errors.confirm && (
            <span className={Styles.errorText}> {errors.confirm} </span>
          )}
        </label>
      </div>
      <div className={Styles.formFooter}>
        {success && (
          <span className={Styles.savedNote}> <FaCheck /> Password updated </span>
        )}
        <button type="submit" className={Styles.primaryBtn} disabled={submitting}>
          {submitting ? "Updating..." : "Update password"}
        </button>
      </div>
    </form>
  );
}


export default DeptSetting;