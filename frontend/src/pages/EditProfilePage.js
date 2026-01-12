import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/EditProfile.css";

//Initial user profile information before editing
const initialProfile = {
  username: "JohnSmith",
  bio: "Always down for an adventure!",
  accountType: "Premium",
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

  const incomingProfile = location.state?.profile ?? initialProfile;

  //User info starting states
  const [username, setUsername] = useState(incomingProfile.username);
  const [bio, setBio] = useState(incomingProfile.bio);
  const [accountType, setAccountType] = useState(incomingProfile.accountType);
  const [interests, setInterests] = useState(incomingProfile.interests);
  const [profilePic, setProfilePic] = useState(incomingProfile.profilePic);

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
    if (accountType === "Premium" && type === "Free") setShowUnsubscribeModal(true);
    else if (accountType === "Free" && type === "Premium") setShowUpgradeModal(true);
  };

  //Confirm unsubscribe modal/confirmation message
  const confirmUnsubscribe = () => {
    setAccountType("Free");
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
    if (cleanCardNumber.length !== 16) return alert("Card number must be 16 digits");
    if (paymentDetails.cvv.length !== 3) return alert("CVV must be 3 digits");

    const expParts = paymentDetails.expDate.split("/");
    if (expParts.length !== 2 || expParts[0].length !== 2 || expParts[1].length !== 2) {
      return alert("Please enter expiry date in MM/YY format");
    }

    setShowPaymentModal(false);
    setAccountType("Premium");
    setShowSuccessModal(true);
    setTimeout(() => setShowSuccessModal(false), 3000);
  };

  const cancelPayment = () => {
    setShowPaymentModal(false);
    setPaymentDetails({ cardName: "", cardNumber: "", expDate: "", cvv: "" });
  };

  //Handle profile picture upload
  const handleProfilePicChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setProfilePic(reader.result);
    reader.readAsDataURL(file);
  };

  //Save changes and navigate back
  const handleSaveChanges = (e) => {
    e.preventDefault();

    const updatedProfile = {
      ...incomingProfile,
      username,
      bio,
      accountType,
      interests,
      profilePic,
    };

    navigate("/profile", { state: { updatedProfile } });
  };

  //Cancel edit and return profile
  const handleCancel = () => navigate("/profile");

  return (
    <div className="edit-profile-page">
      <div className="edit-profile-sidebar">
        <ul>
          <li onClick={() => navigate("/feed")}>Feed</li>
          <li className="active">My Profile</li>
        </ul>
      </div>

      <div className="edit-profile-main">
        <div className="edit-profile-container">
          <h1 className="edit-profile-title">Profile</h1>

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
                Change Photo
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
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="bio">Bio</label>
              <input
                type="text"
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself"
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
              <label>Account Type</label>
              <div className="account-type-buttons">
                <button
                  type="button"
                  className={`account-type-btn ${accountType === "Premium" ? "active" : ""}`}
                  onClick={() => handleAccountTypeClick("Premium")}
                >
                  Premium
                </button>
                <button
                  type="button"
                  className={`account-type-btn ${accountType === "Free" ? "active" : ""}`}
                  onClick={() => handleAccountTypeClick("Free")}
                >
                  Free
                </button>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="save-btn">
                Save Changes
              </button>
              <button type="button" className="cancel-btn" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/*Unsubscribe from premium modal/ confimation message*/}
      {showUnsubscribeModal && (
        <div className="modal-overlay" onClick={cancelUnsubscribe}>
          <div className="unsubscribe-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Unsubscribe from TripMate Premium?</h2>
            <p>The community won't be the same without you :(</p>
            <p className="modal-warning">
              Unsubscribing to premium would mean losing perks like joining group trips and collaboration.
              Are you sure you want to unsubscribe?
            </p>
            <div className="modal-actions">
              <button className="unsubscribe-confirm-btn" onClick={confirmUnsubscribe}>
                Unsubscribe
              </button>
              <button className="unsubscribe-cancel-btn" onClick={cancelUnsubscribe}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/*Upgrade to premium modal/ confirmation message*/}
      {showUpgradeModal && (
        <div className="modal-overlay" onClick={cancelUpgrade}>
          <div className="upgrade-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Level up your journey!</h2>
            <p className="upgrade-description">
              Upgrade to TripMate premium to unlock exclusive perks and smarter trip planning.
            </p>
            <div className="modal-actions">
              <button className="subscribe-btn" onClick={handleUpgradeClick}>
                Subscribe
              </button>
              <button className="modal-cancel-btn" onClick={cancelUpgrade}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/*Payment modal-> credit car details form*/}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={cancelPayment}>
          <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Payment Details</h2>
            <form onSubmit={handlePaymentSubmit}>
              <div className="payment-form-group">
                <label>Name on card</label>
                <input
                  type="text"
                  value={paymentDetails.cardName}
                  onChange={(e) => setPaymentDetails({ ...paymentDetails, cardName: e.target.value })}
                  placeholder="John Smith"
                  required
                />
              </div>

              <div className="payment-form-group">
                <label>Card no.</label>
                <input
                  type="text"
                  value={paymentDetails.cardNumber}
                  onChange={(e) =>
                    setPaymentDetails({ ...paymentDetails, cardNumber: formatCardNumber(e.target.value) })
                  }
                  placeholder="1234 5678 9012 3456"
                  required
                />
              </div>

              <div className="payment-row">
                <div className="payment-form-group">
                  <label>Exp date</label>
                  <input
                    type="text"
                    value={paymentDetails.expDate}
                    onChange={(e) =>
                      setPaymentDetails({ ...paymentDetails, expDate: formatExpDate(e.target.value) })
                    }
                    placeholder="MM/YY"
                    required
                  />
                </div>
                <div className="payment-form-group">
                  <label>CVV</label>
                  <input
                    type="text"
                    value={paymentDetails.cvv}
                    onChange={(e) => setPaymentDetails({ ...paymentDetails, cvv: formatCVV(e.target.value) })}
                    placeholder="123"
                    required
                  />
                </div>
              </div>

              <div className="payment-modal-actions">
                <button type="button" className="payment-cancel-btn" onClick={cancelPayment}>
                  Cancel
                </button>
                <button type="submit" className="payment-submit-btn">
                  Make Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/*Success modal/message*/}
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="success-modal">
            <div className="success-icon">✓</div>
            <h2>Welcome to Premium!</h2>
            <p>Your account has been upgraded successfully.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditProfilePage;
