import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Help.css";
import Axios from '../hooks/Axios.js';
import { useTranslation } from "react-i18next";

//Success message section
const SuccessMessage = ({ message, onClose }) => (
  <div className="success-overlay" onClick={onClose}>
    <div className="success-modal" onClick={(e) => e.stopPropagation()}>
      <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#0b4f6c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <h2>Success!</h2>
      <p>{message}</p>
      <button onClick={onClose} className="success-btn">Got it</button>
    </div>
  </div>
);

//Star rating state (for review form)
const ReviewStarRating = () => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const handleStarClick = (star) => {
    setRating(star);
    //Store in hidden input
    const input = document.getElementById("rating-input");
    if (input) input.value = star;
  };

  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          className={`star-btn ${star <= (hoverRating || rating) ? "filled" : ""}`}
          onClick={() => handleStarClick(star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          type="button"
        >
          ★
        </button>
      ))}

    </div>
  );
};

function HelpPage() {
  const { t, i18n } = useTranslation("helpcentre");
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("faq");
  const [successMessage, setSuccessMessage] = useState("");
  const [reviewKey, setReviewKey] = useState(0);
  const [faqs, setFaqs] = useState([]);
  const [lang, setLang] = useState(i18n.language || "en");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFAQ = async() =>{
      try{
        const res = await Axios.get("Users/GetFAQ", {params:{lang}, withCredentials:true})
        setFaqs(res.data);
      }
      catch(err){
        if(err.response){
          if(err.response.status === 401 || err.response.status === 403){
            const errorMsg = err.response.status + ": " + err.response.data.message;
            navigate(`/login/${errorMsg}`);
          }
          else if(err.response.status === 500) console.log(err.response.data.message);
        }
        else console.log(err)
      }
    }
    loadFAQ()
    setLoading(true);
  }, [lang])

  useEffect(() => {
    // Run when ititialized(default) & lang changed
    i18n.on("languageChanged", function(lng) {
      setLang(lng);
    });

    return() => {
      i18n.off("languageChanged", function(lng) {});
    };
  }, [i18n])

  //Handle ticket submission
  const handleTicketSubmit = async(e) => {
    e.preventDefault();
    const category = document.getElementById("category").value;
    const subject = document.getElementById("subject").value;
    const message = document.getElementById("message").value;
    try{
      const res = await Axios.post("Users/SubmitTicket", {category:category, title:subject, contents:message}, {withCredentials:true})
      if(res.data){
        console.log("Ticket submitted");
        setSuccessMessage(t("hp_ticket_success"));
        setTimeout(() => {
          e.target.reset();
        }, 100);
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

  //Handle review submission
  const handleReviewSubmit = async(e) => {
    e.preventDefault();
    let rating = document.getElementById("rating-input").value;
    const content = document.getElementById("review-message").value;
    if (rating === "0") {
      alert(t("hp_review_rating_alert"));
      return;
    }
    rating = parseInt(rating);

    try{
      const res = await Axios.post("Users/SubmitReview", {content:content, rating:rating}, {withCredentials:true})
      if(res.data){
        console.log("Review submitted with rating:", rating);
        setSuccessMessage(t("hp_review_success"));
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

    //Reset the review form after submission
    setReviewKey(prev => prev + 1);
  };

  {loading && <p>Loading..</p>}

  return (
    <div className="help-page">
      <div className="help-header">
        <button className="help-back-btn" onClick={() => navigate("/profile")}>
          ← {t("hp_back_btn")}
        </button>
        <h1>{t("hp_title")}</h1>
        <div></div>
      </div>

      <div className="help-container">
        {/*Help centre tabs--> FAQ, ticket submission, reviews*/}
        <div className="help-tabs">
          <button
            className={`help-tab-btn ${activeTab === "faq" ? "active" : ""}`}
            onClick={() => setActiveTab("faq")}
          >
            {t("hp_tab_faq")}
          </button>
          <button
            className={`help-tab-btn ${activeTab === "ticket" ? "active" : ""}`}
            onClick={() => setActiveTab("ticket")}
          >
            {t("hp_tab_ticket")}
          </button>
          <button
            className={`help-tab-btn ${activeTab === "review" ? "active" : ""}`}
            onClick={() => setActiveTab("review")}
          >
            {t("hp_tab_review")}
          </button>
        </div>

        {/*FAQ tab*/}
        {activeTab === "faq" && (
          <div className="help-content faq-section">
            <h2>{t("hp_faq_title")}</h2>
            <div className="faq-list">
              {faqs.map((faq) => (
                <FAQItem key={faq.id} faq={faq} />
              ))}
            </div>
          </div>
        )}

        {/*Submit ticket tab*/}
        {activeTab === "ticket" && (
          <div className="help-content ticket-section">
            <h2>{t("hp_ticket_title")}</h2>
            <p className="form-intro">
              {t("hp_ticket_intro")}
            </p>
            <form className="help-form" onSubmit={handleTicketSubmit}>
              <div className="form-group">
                <label htmlFor="category">{t("hp_ticket_category_label")}</label>
                <select id="category" required>
                  <option value="">{t("hp_ticket_category_placeholder")}</option>
                  <option value="bug">{t("hp_ticket_category_bug")}</option>
                  <option value="account">{t("hp_ticket_category_account")}</option>
                  <option value="technical">{t("hp_ticket_category_technical")}</option>
                  <option value="other">{t("hp_ticket_category_other")}</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="subject">{t("hp_ticket_subject_label")}</label>
                <input
                  type="text"
                  id="subject"
                  placeholder={t("hp_ticket_subject_placeholder")}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">{t("hp_ticket_details_label")}</label>
                <textarea
                  id="message"
                  placeholder={t("hp_ticket_details_placeholder")}
                  rows="6"
                  required
                ></textarea>
              </div>

              <button type="submit" className="submit-btn">
                {t("hp_ticket_submit_btn")}
              </button>
            </form>
          </div>
        )}

        {/*Submit review tab*/}
        {activeTab === "review" && (
          <div className="help-content review-section" key={reviewKey}>
            <h2>{t("hp_review_title")}</h2>
            <p className="form-intro">
              {t("hp_review_intro")}
            </p>
            <form className="help-form" onSubmit={handleReviewSubmit}>
              <div className="form-group">
                <label>{t("hp_review_rating_label")}</label>
                <ReviewStarRating />
                <input type="hidden" id="rating-input" name="rating" defaultValue="0" />
              </div>

              <div className="form-group">
                <label htmlFor="review-message">{t("hp_review_message_label")}</label>
                <textarea
                  id="review-message"
                  placeholder={t("hp_review_message_placeholder")}
                  rows="6"
                  required
                ></textarea>
              </div>

              <button type="submit" className="submit-btn">
                {t("hp_review_submit_btn")}
              </button>
            </form>
          </div>
        )}
      </div>

      {/*Submission success message modal*/}
      {successMessage && (
        <SuccessMessage
          message={successMessage}
          onClose={() => {
            setSuccessMessage("");
          }}
        />
      )}
    </div>
  );
}

//Collaspsible section for FAQ questions and answers
function FAQItem({ faq }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="faq-item">
      <button
        className="faq-question"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span>{faq.question}</span>
        <span className={`faq-toggle ${isOpen ? "open" : ""}`}>+</span>
      </button>
      {isOpen && (
        <div className="faq-answer">
          {faq.answer}
        </div>
      )}
    </div>
  );
}

export default HelpPage;