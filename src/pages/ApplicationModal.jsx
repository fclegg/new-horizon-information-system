import { useState } from "react";
import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/config";


function ApplicationModal({ onClose }) {

  const [formData, setFormData] = useState({

    firstName: "",
    lastName: "",
    todaysDate:
      new Date().toISOString().split("T")[0],

    dateOfBirth: "",

    phoneNumber: "",
    email: "",
    gender: "",

    address: "",
    city: "",
    state: "",

    availability: "",
    dateAvailable: "",

    experience: "",
    religion: "",
    languages: "",
    transportation: "",

    desiredPosition: "",
    heardAboutUs: "",
  });


  const [submitting, setSubmitting] =
    useState(false);

  const [submitted, setSubmitted] =
    useState(false);

  const [error, setError] =
    useState("");


  const handleChange = (e) => {

    const {
      name,
      value,
    } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };


  const handleSubmit = async (e) => {

    e.preventDefault();

    setError("");
    setSubmitting(true);

    try {

      await addDoc(
        collection(db, "applications"),
        {
          ...formData,

          status: "pending",

          submittedAt:
            serverTimestamp(),

          reviewedAt: null,

          reviewedBy: null,

          directorNotes: "",
        }
      );

      setSubmitted(true);

    } catch (err) {

      console.error(
        "Application submission error:",
        err
      );

      setError(
        "Unable to submit your application. Please try again."
      );

    } finally {

      setSubmitting(false);

    }
  };


  /*
   * =========================================================
   * SUCCESS
   * =========================================================
   */

  if (submitted) {

    return (
      <div className="nh-application-overlay">

        <div
          className="
            nh-application-modal
            nh-application-success
          "
        >

          <button
            className="nh-application-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>


          <div className="nh-application-success-icon">
            ✓
          </div>


          <h1>
            APPLICATION SUBMITTED
          </h1>


          <p>
            Thank you for your interest in
            New Horizon.
          </p>


          <p>
            Your application has been
            successfully submitted and will
            be reviewed by a New Horizon
            director.
          </p>


          <button
            type="button"
            className="nh-application-submit"
            onClick={onClose}
          >
            RETURN TO LOGIN
          </button>

        </div>

      </div>
    );
  }


  /*
   * =========================================================
   * APPLICATION FORM
   * =========================================================
   */

  return (
    <div className="nh-application-overlay">

      <div className="nh-application-modal">


        {/* HEADER */}

        <div className="nh-application-header">

          <div>

            <div className="nh-application-mark">
              NH
            </div>

            <h1>
              MEMBER APPLICATION
            </h1>

            <p>
              New Horizon Investigator Application
            </p>

          </div>


          <button
            className="nh-application-close"
            onClick={onClose}
            aria-label="Close application"
          >
            ×
          </button>

        </div>


        <form
          onSubmit={handleSubmit}
          className="nh-application-form"
        >


          {/* =================================================
              PERSONAL INFORMATION
              ================================================= */}

          <section className="nh-application-section">

            <div className="nh-application-section-title">
              PERSONAL INFORMATION
            </div>


            <div className="nh-application-grid">


              <div className="nh-application-field">

                <label>
                  First Name <span>*</span>
                </label>

                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />

              </div>


              <div className="nh-application-field">

                <label>
                  Last Name <span>*</span>
                </label>

                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />

              </div>


              <div className="nh-application-field">

                <label>
                  Today's Date <span>*</span>
                </label>

                <input
                  type="date"
                  name="todaysDate"
                  value={formData.todaysDate}
                  onChange={handleChange}
                  required
                />

              </div>


              <div className="nh-application-field">

                <label>
                  Date of Birth <span>*</span>
                </label>

                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                />

              </div>


              <div className="nh-application-field">

                <label>
                  Phone Number <span>*</span>
                </label>

                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="(555) 555-5555"
                  required
                />

              </div>


              <div className="nh-application-field">

                <label>
                  Email <span>*</span>
                </label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                />

              </div>


              <div className="nh-application-field">

                <label>
                  Gender <span>*</span>
                </label>

                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                >

                  <option value="">
                    Select an option
                  </option>

                  <option value="Male">
                    Male
                  </option>

                  <option value="Female">
                    Female
                  </option>

                  <option value="Other">
                    Other
                  </option>

                  <option value="Prefer not to say">
                    Prefer not to say
                  </option>

                </select>

              </div>


              <div className="nh-application-field">

                <label>
                  Address
                </label>

                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                />

              </div>


              <div className="nh-application-field">

                <label>
                  City <span>*</span>
                </label>

                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />

              </div>


              <div className="nh-application-field">

                <label>
                  State <span>*</span>
                </label>

                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  required
                />

              </div>

            </div>

          </section>


          {/* =================================================
              AVAILABILITY
              ================================================= */}

          <section className="nh-application-section">

            <div className="nh-application-section-title">
              AVAILABILITY
            </div>


            <div className="nh-application-field">

              <label>
                What's Your Availability (Weekly)
                <span>*</span>
              </label>


              <div className="nh-choice-group">


                <label className="nh-choice">

                  <input
                    type="radio"
                    name="availability"
                    value="Open Availability (Any day)"
                    checked={
                      formData.availability ===
                      "Open Availability (Any day)"
                    }
                    onChange={handleChange}
                    required
                  />

                  <span>
                    <strong>A</strong>
                    Open Availability (Any day)
                  </span>

                </label>


                <label className="nh-choice">

                  <input
                    type="radio"
                    name="availability"
                    value="Moderate Availability (3-4 days)"
                    checked={
                      formData.availability ===
                      "Moderate Availability (3-4 days)"
                    }
                    onChange={handleChange}
                  />

                  <span>
                    <strong>B</strong>
                    Moderate Availability (3-4 days)
                  </span>

                </label>


                <label className="nh-choice">

                  <input
                    type="radio"
                    name="availability"
                    value="Limited Availability (1-2 days)"
                    checked={
                      formData.availability ===
                      "Limited Availability (1-2 days)"
                    }
                    onChange={handleChange}
                  />

                  <span>
                    <strong>C</strong>
                    Limited Availability (1-2 days)
                  </span>

                </label>

              </div>

            </div>


            <div className="nh-application-field">

              <label>
                Date Available to Start <span>*</span>
              </label>

              <input
                type="date"
                name="dateAvailable"
                value={formData.dateAvailable}
                onChange={handleChange}
                required
              />

            </div>

          </section>


          {/* =================================================
              EXPERIENCE
              ================================================= */}

          <section className="nh-application-section">

            <div className="nh-application-section-title">
              EXPERIENCE
            </div>


            <div className="nh-application-field">

              <label>
                Have You Had Any Experiences:
                <span>*</span>
              </label>


              <div className="nh-choice-group horizontal">

                <label className="nh-choice">

                  <input
                    type="radio"
                    name="experience"
                    value="Yes"
                    checked={
                      formData.experience === "Yes"
                    }
                    onChange={handleChange}
                    required
                  />

                  <span>
                    <strong>A</strong>
                    Yes
                  </span>

                </label>


                <label className="nh-choice">

                  <input
                    type="radio"
                    name="experience"
                    value="No"
                    checked={
                      formData.experience === "No"
                    }
                    onChange={handleChange}
                  />

                  <span>
                    <strong>B</strong>
                    No
                  </span>

                </label>

              </div>

            </div>


            <div className="nh-application-field">

              <label>
                Religion or Belief <span>*</span>
              </label>

              <input
                type="text"
                name="religion"
                value={formData.religion}
                onChange={handleChange}
                required
              />

            </div>


            <div className="nh-application-field">

              <label>
                Known Languages <span>*</span>
              </label>

              <input
                type="text"
                name="languages"
                value={formData.languages}
                onChange={handleChange}
                placeholder="English, Spanish, etc."
                required
              />

            </div>


            <div className="nh-application-field">

              <label>
                Do You Have Reliable Transportation?
                <span>*</span>
              </label>


              <div className="nh-choice-group horizontal">

                <label className="nh-choice">

                  <input
                    type="radio"
                    name="transportation"
                    value="Yes"
                    checked={
                      formData.transportation ===
                      "Yes"
                    }
                    onChange={handleChange}
                    required
                  />

                  <span>
                    <strong>A</strong>
                    Yes
                  </span>

                </label>


                <label className="nh-choice">

                  <input
                    type="radio"
                    name="transportation"
                    value="No"
                    checked={
                      formData.transportation ===
                      "No"
                    }
                    onChange={handleChange}
                  />

                  <span>
                    <strong>B</strong>
                    No
                  </span>

                </label>

              </div>

            </div>


            <div className="nh-application-field">

              <label>
                Desired Position <span>*</span>
              </label>


              <select
                name="desiredPosition"
                value={formData.desiredPosition}
                onChange={handleChange}
                required
              >

                <option value="">
                  Select a position
                </option>

                <option value="Investigator">
                  Investigator
                </option>

                <option value="Trainee Investigator">
                  Trainee Investigator
                </option>

                <option value="Researcher">
                  Researcher
                </option>

                <option value="Other">
                  Other
                </option>

              </select>

            </div>


            <div className="nh-application-field">

              <label>
                Where Did You Hear About Us?
                <span>*</span>
              </label>

              <input
                type="text"
                name="heardAboutUs"
                value={formData.heardAboutUs}
                onChange={handleChange}
                required
              />

            </div>

          </section>


          {error && (
            <div className="nh-application-error">
              {error}
            </div>
          )}


          {/* ACTIONS */}

          <div className="nh-application-actions">

            <button
              type="button"
              className="nh-application-cancel"
              onClick={onClose}
              disabled={submitting}
            >
              CANCEL
            </button>


            <button
              type="submit"
              className="nh-application-submit"
              disabled={submitting}
            >
              {submitting
                ? "SUBMITTING..."
                : "SUBMIT APPLICATION"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

export default ApplicationModal;