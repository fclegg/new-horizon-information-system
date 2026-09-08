import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/config";
import { useNavigate } from "react-router-dom";

import ApplicationModal from "./ApplicationModal";


function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showApplication, setShowApplication] =
    useState(false);


  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      navigate("/");
    } catch (error) {
      console.error("Login error:", error);

      switch (error.code) {

        case "auth/invalid-credential":
          setError(
            "Invalid email or password."
          );
          break;

        case "auth/user-not-found":
          setError(
            "No account exists with this email."
          );
          break;

        case "auth/wrong-password":
          setError(
            "Incorrect password."
          );
          break;

        case "auth/invalid-email":
          setError(
            "Please enter a valid email address."
          );
          break;

        default:
          setError(
            "Unable to sign in. Please try again."
          );
      }

    } finally {
      setLoading(false);
    }
  };


  return (
    <>

      <div className="nh-login-page">

        <div className="nh-login-panel">

          <div className="nh-login-header">

            <div className="nh-login-mark">
              NH
            </div>

            <h1>
              NEW HORIZON
            </h1>

            <p>
              Information System
            </p>

          </div>


          <form
            onSubmit={handleLogin}
            className="nh-login-form"
          >

            <div className="nh-login-field">

              <label>
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="Enter your email"
                required
              />

            </div>


            <div className="nh-login-field">

              <label>
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Enter your password"
                required
              />

            </div>


            {error && (
              <div className="nh-login-error">
                {error}
              </div>
            )}


            <button
              type="submit"
              className="nh-login-button"
              disabled={loading}
            >
              {loading
                ? "SIGNING IN..."
                : "SIGN IN"}
            </button>

          </form>


          {/* =================================================
              APPLICATION
              ================================================= */}

          <div className="nh-login-application">

            <div className="nh-login-divider">
              <span>OR</span>
            </div>

            <h2>
              Want to join New Horizon?
            </h2>

            <p>
              Submit an application to become a
              New Horizon investigator.
            </p>

            <button
              type="button"
              className="nh-apply-button"
              onClick={() =>
                setShowApplication(true)
              }
            >
              APPLY NOW
            </button>

          </div>


          <div className="nh-login-footer">
            Authorized New Horizon personnel only.
          </div>

        </div>

      </div>


      {/* =====================================================
          APPLICATION MODAL
          ===================================================== */}

      {showApplication && (
        <ApplicationModal
          onClose={() =>
            setShowApplication(false)
          }
        />
      )}

    </>
  );
}

export default Login;