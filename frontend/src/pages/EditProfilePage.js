import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/EditProfile.css";
import Axios from '../hooks/Axios.js';
import { useTranslation } from "react-i18next";

//Initial user profile information before editing
const initialProfile = {
  email: "Loading..",
  firstName: "",
  lastName: "",
  bio: "",
  accountType: "registered",
  interests: {
    food: true,
    adventure: true,
    artMusic: false,
    history: false,
    sightseeing: false,
  },
  profilePic: "",
};

function EditProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const incomingProfile = initialProfile;
  const { t } = useTranslation("profile");

  const [loading, setLoading] = useState(true);

  //User info starting states
  const [email, setEmail] = useState(incomingProfile.email);
  const [firstName, setFirstName] = useState(incomingProfile.firstName);
  const [lastName, setLastName] = useState(incomingProfile.lastName);
  const [bio, setBio] = useState(incomingProfile.bio);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountType, setAccountType] = useState(incomingProfile.accountType);
  const [interests, setInterests] = useState(incomingProfile.interests);
  const [profilePic, setProfilePic] = useState(incomingProfile.profilePic);
  const [mediaToUpload, setMediaToUpload] = useState(null);

  //Modal states
  const [showUnsubscribeModal, setShowUnsubscribeModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  //Payment details state
  const [paymentDetails, setPaymentDetails] = useState({
    cardName: "",
    cardNumber: "",
    expDate: "",
    cvv: "",
  });

  //Load profile details
  useEffect(() => {
    const getProfileDetails = async() => {
      try{
        const res = await Axios.get("Users/GetProfileDetails", {withCredentials: true});
        setLoading(false);
        console.log(res.data)
        setEmail(res.data[0].email);
        setFirstName(res.data[0].first_name !== null ? res.data[0].first_name : "");
        setLastName(res.data[0].last_name !== null ? res.data[0].last_name : "");
        setBio(res.data[0].bio !== null ? res.data[0].bio : "");
        setAccountType(res.data[0].type);
        setProfilePic(res.data[0].photo_url !== null ? res.data[0].photo_url : "");
      }
      catch(err){
        if(err.response){
          if (err.response.status === 401 || err.response.status === 403) {
            const errorMsg = err.response.status + ": " + err.response.data.message;
            navigate(`/login/${errorMsg}`);
          } else if (err.response.status === 500) {
            const errorMsg = err.response.status + ": " + err.response.data.message;
            console.log(errorMsg);
          }
        }
        else console.log(err);
      }
    }
    getProfileDetails()
  }, [])

  //Credit card details format
  const formatCardNumber = (value) => {
    const cleaned = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const limited = cleaned.substring(0, 16);
    const matches = limited.match(/.{1,4}/g);
    return matches ? matches.join(" ") : limited;
  };

  const formatExpDate = (value) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length >= 2) return cleaned.substring(0, 2) + "/" + cleaned.substring(2, 4);
    return cleaned;
  };

  const formatCVV = (value) => value.replace(/\D/g, "").substring(0, 3);

  //User interests checkboxes
  const handleInterestChange = (interest) => {
    setInterests((prev) => ({
      ...prev,
      [interest]: !prev[interest],
    }));
  };

  //Handle account type click
  const handleAccountTypeClick = (type) => {
    if (accountType === "premium" && type === "Free") setShowUnsubscribeModal(true);
    else if (accountType === "registered" && type === "Premium") setShowUpgradeModal(true);
  };

  //Confirm unsubscribe modal/confirmation message
  const confirmUnsubscribe = async() => {
    const newAccType = "registered";
    try{
      const res = Axios.patch("Users/UserChangeType", {newType: newAccType}, {withCredentials:true})
      if(res.data.send) alert (t("ep_succ_unsubscribe"))
    }
    catch(err){
      if(err.response){
        if (err.response.status === 401 || err.response.status === 403) {
          const errorMsg = err.response.status + ": " + err.response.data.message;
          navigate(`/login/${errorMsg}`);
        } else if (err.response.status === 500) {
          const errorMsg = err.response.status + ": " + err.response.data.message;
          console.log(errorMsg);
        }
      }
      else console.log(err);
    }
    setAccountType(newAccType);
    setShowUnsubscribeModal(false);
  };

  const cancelUnsubscribe = () => setShowUnsubscribeModal(false);

  const handleUpgradeClick = () => {
    setShowUpgradeModal(false);
    setShowPaymentModal(true);
  };

  const cancelUpgrade = () => setShowUpgradeModal(false);

  //Handle payment submit
  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    const cleanCardNumber = paymentDetails.cardNumber.replace(/\s+/g, "");
    if (cleanCardNumber.length !== 16) return alert(t("ep_err_card_number"));
    if (paymentDetails.cvv.length !== 3) return alert(t("ep_err_card_cvv"));
    const expParts = paymentDetails.expDate.split("/");
    if (expParts.length !== 2 || expParts[0].length !== 2 || expParts[1].length !== 2) {
      return alert(t("ep_err_card_date"));
    }

    const newAccType = "premium";
    try{
      const res = Axios.patch("Users/UserChangeType", {newType: newAccType}, {withCredentials:true})
      setShowPaymentModal(false);
      setAccountType("premium");
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 3000);
    }
    catch(err){
      if(err.response){
        if (err.response.status === 401 || err.response.status === 403) {
          const errorMsg = err.response.status + ": " + err.response.data.message;
          navigate(`/login/${errorMsg}`);
        } else if (err.response.status === 500) {
          const errorMsg = err.response.status + ": " + err.response.data.message;
          console.log(errorMsg);
        }
      }
      else console.log(err);
    }
  };

  const cancelPayment = () => {
    setShowPaymentModal(false);
    setPaymentDetails({ cardName: "", cardNumber: "", expDate: "", cvv: "" });
  };

  //Handle profile picture upload
  const handleProfilePicChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMediaToUpload(e.target.files?.[0]);
    
    const reader = new FileReader();
    reader.onloadend = () => setProfilePic(reader.result);
    reader.readAsDataURL(file);
  };

  //Save changes and navigate back
  const handleSaveChanges = async(e) => {
    e.preventDefault();

    if (password || confirmPassword) {
      if (password !== confirmPassword) {
        return alert(t("ep_err_password_match"));
      }
      if (password.length < 6) {
        return alert(t("ep_err_password_"));
      }
    }

    const formData = new FormData();
    if(mediaToUpload) formData.append("media", mediaToUpload);
    formData.append("email", email);
    formData.append("firstname", firstName);
    formData.append("lastname", lastName);
    formData.append("bio", bio);
    if (password) formData.append("password", password);

    try{
      const res = await Axios.patch("Users/UpdateUserProfile", formData, {headers:{ "Content-Type": "multipart/form-data" }, withCredentials:true})
      if(res.data.validateErr) alert(res.data.message)
      else if(res.data){
        const updatedProfile = {
          ...incomingProfile,
          email,
          firstName,
          lastName,
          bio,
          accountType,
          interests,
          profilePic,
        };
        navigate("/profile", { state: { updatedProfile } });
      }
    }
    catch(err){
      if(err.response){
        if (err.response.status === 401 || err.response.status === 403) {
          const errorMsg = err.response.status + ": " + err.response.data.message;
          navigate(`/login/${errorMsg}`);
        } else if (err.response.status === 500) {
          const errorMsg = err.response.status + ": " + err.response.data.message;
          console.log(errorMsg);
        }
      }
      else console.log(err);
    }
  };

  //Cancel edit and return profile
  const handleCancel = () => navigate("/profile");

  return (
    <div className="edit-profile-page">
      <div className="edit-profile-main">
        <div className="edit-profile-container">
          <h1 className="edit-profile-title">{t("ep_title")}</h1>
          <form onSubmit={handleSaveChanges}>
            <div className="profile-pic-section">
              <div className="profile-pic-wrapper">
                {profilePic ? (
                  <img src={profilePic} alt="Profile" className="profile-pic-preview" />
                ) : (
                  <div className="profile-pic-empty">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="60"
                      height="60"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#999"
                      strokeWidth="1.5"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                )}
              </div>
              <label htmlFor="profile-pic-input" className="change-pic-btn">
                {t("ep_changephoto")}
              </label>
              <input
                type="file"
                id="profile-pic-input"
                accept="image/*"
                onChange={handleProfilePicChange}
                style={{ display: "none" }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">{t("ep_email")}</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("ep_email_ph")}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">{t("ep_fname")}</label>
                <input
                  type="text"
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={t("ep_fname_ph")}
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">{t("ep_lname")}</label>
                <input
                  type="text"
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={t("ep_lname_ph")}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="bio">{t("ep_bio")}</label>
              <input
                type="text"
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={t("ep_bio_ph")}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">{t("ep_password")}</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("ep_password_ph")}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">{t("ep_confirmpassword")}</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t("ep_confirmpassword_ph")}
              />
            </div>

            <div className="form-group">
              <label>My Interests</label>
              <div className="interests-grid">
                {[
                  ["food", "Food"],
                  ["adventure", "Adventure"],
                  ["artMusic", "Art & Music"],
                  ["history", "History"],
                  ["sightseeing", "Sightseeing"],
                ].map(([key, label]) => (
                  <label className="interest-checkbox" key={key}>
                    <input
                      type="checkbox"
                      checked={!!interests[key]}
                      onChange={() => handleInterestChange(key)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>{t("ep_acctype_title")}</label>
              <div className="account-type-buttons">
                <button
                  type="button"
                  className={`account-type-btn ${accountType === "premium" ? "active" : ""}`}
                  onClick={() => handleAccountTypeClick("Premium")}
                >
                  {t("ep_acctype_premium")}
                </button>
                <button
                  type="button"
                  className={`account-type-btn ${accountType === "registered" ? "active" : ""}`}
                  onClick={() => handleAccountTypeClick("Free")}
                >
                  {t("ep_acctype_free")}
                </button>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="save-btn">
                {t("ep_save_btn")}
              </button>
              <button type="button" className="cancel-btn" onClick={handleCancel}>
                {t("ep_cancel_btn")}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/*Unsubscribe from premium modal*/}
      {showUnsubscribeModal && (
        <div className="modal-overlay" onClick={cancelUnsubscribe}>
          <div className="unsubscribe-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t("ep_unsubmodal_title")}</h2>
            <p>{t("ep_unsubmodal_text")}</p>
            <p className="modal-warning">
              {t("ep_unsubmodal_warning1")}
              {t("ep_unsubmodal_warning2")}
            </p>
            <div className="modal-actions">
              <button className="unsubscribe-confirm-btn" onClick={confirmUnsubscribe}>
                {t("ep_unsub_btn")}
              </button>
              <button className="unsubscribe-cancel-btn" onClick={cancelUnsubscribe}>
                {t("ep_cancel_btn")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/*Upgrade to premium modal*/}
      {showUpgradeModal && (
        <div className="modal-overlay" onClick={cancelUpgrade}>
          <div className="upgrade-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t("ep_submodal_title")}</h2>
            <p className="upgrade-description">
              {t("ep_submodal_text")}
            </p>
            <div className="modal-actions">
              <button className="subscribe-btn" onClick={handleUpgradeClick}>
                {t("ep_sub_btn")}
              </button>
              <button className="modal-cancel-btn" onClick={cancelUpgrade}>
                {t("ep_cancel_btn")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/*Payment modal*/}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={cancelPayment}>
          <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t("ep_cardmodal_title")}</h2>
            <form onSubmit={handlePaymentSubmit}>
              <div className="payment-form-group">
                <label>{t("ep_cardmodal_name_tb")}</label>
                <input
                  type="text"
                  value={paymentDetails.cardName}
                  onChange={(e) => setPaymentDetails({ ...paymentDetails, cardName: e.target.value })}
                  placeholder={t("ep_cardmodal_name_ph")}
                  required
                />
              </div>
              <div className="payment-form-group">
                <label>{t("ep_cardmodal_num_tb")}</label>
                <input
                  type="text"
                  value={paymentDetails.cardNumber}
                  onChange={(e) =>
                    setPaymentDetails({ ...paymentDetails, cardNumber: formatCardNumber(e.target.value) })
                  }
                  placeholder={t("ep_cardmodal_num_ph")}
                  required
                />
              </div>
              <div className="payment-row">
                <div className="payment-form-group">
                  <label>{t("ep_cardmodal_expdate_tb")}</label>
                  <input
                    type="text"
                    value={paymentDetails.expDate}
                    onChange={(e) =>
                      setPaymentDetails({ ...paymentDetails, expDate: formatExpDate(e.target.value) })
                    }
                    placeholder={t("ep_cardmodal_expdate_ph")}
                    required
                  />
                </div>
                <div className="payment-form-group">
                  <label>{t("ep_cardmodal_cvv_tb")}</label>
                  <input
                    type="text"
                    value={paymentDetails.cvv}
                    onChange={(e) => setPaymentDetails({ ...paymentDetails, cvv: formatCVV(e.target.value) })}
                    placeholder={t("ep_cardmodal_cvv_ph")}
                    required
                  />
                </div>
              </div>
              <div className="payment-modal-actions">
                <button type="button" className="payment-cancel-btn" onClick={cancelPayment}>
                  {t("ep_cancel_btn")}
                </button>
                <button type="submit" className="payment-submit-btn">
                  {t("ep_cancel_btn")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/*Success modal*/}
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="success-modal">
            <div className="success-icon">✓</div>
            <h2>{t("ep_succmodal_title")}</h2>
            <p>{t("ep_succmodal_text")}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditProfilePage;