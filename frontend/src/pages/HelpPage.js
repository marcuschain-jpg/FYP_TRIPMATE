import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Help.css";

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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("faq");
  const [successMessage, setSuccessMessage] = useState("");
  const [reviewKey, setReviewKey] = useState(0);

  //FAQ questions and answers 
  const faqs = [
    {
      id: 1,
      question: "How do I create a new trip?",
      answer: "To create a new trip, click on 'My Trips' in the navigation bar, then click the 'Create New Trip' button. Enter your trip details, add a cover photo, and start adding activities!"
    },
    {
      id: 2,
      question: "Can I share my itinerary with friends?",
      answer: "Yes! When creating or editing a trip, you can add collaborators by entering their email addresses. They'll receive an invitation to join your trip."
    },
    {
      id: 3,
      question: "How do I add activities to my itinerary?",
      answer: "Open your trip, go to the Itinerary tab, and click 'Add Activity'. Fill in the activity details like name, location, address, and date. You can also upload photos!"
    },
    {
      id: 4,
      question: "How can I bookmark other people's itineraries?",
      answer: "Visit the Feed page, browse itineraries shared by other users, and click the bookmark icon on any post to save it to your profile."
    },
    {
      id: 5,
      question: "Can I edit or delete my activities?",
      answer: "Yes! Open your trip, click on the activity you want to modify, and use the Edit or Delete buttons. Changes are saved instantly."
    },
  ];

  //Handle ticket submission
  const handleTicketSubmit = (e) => {
    e.preventDefault();
    console.log("Ticket submitted");
    setSuccessMessage("Your support ticket has been submitted successfully! Our team will respond within 24 hours.");
    setTimeout(() => {
      e.target.reset();
    }, 100);
  };

  //Handle review submission
  const handleReviewSubmit = (e) => {
    e.preventDefault();
    const rating = document.getElementById("rating-input").value;
    if (rating === "0") {
      alert("Please select a rating before submitting");
      return;
    }
    console.log("Review submitted with rating:", rating);
    setSuccessMessage("Thank you for your review! We appreciate your feedback.");
    //Reset the review form after submission
    setReviewKey(prev => prev + 1);
  };

  return (
    <div className="help-page">
      <div className="help-header">
        <button className="help-back-btn" onClick={() => navigate("/profile")}>
          ← Back
        </button>
        <h1>Help Centre</h1>
        <div></div>
      </div>

      <div className="help-container">
        {/*Help centre tabs--> FAQ, ticket submission, reviews*/}
        <div className="help-tabs">
          <button
            className={`help-tab-btn ${activeTab === "faq" ? "active" : ""}`}
            onClick={() => setActiveTab("faq")}
          >
            FAQ
          </button>
          <button
            className={`help-tab-btn ${activeTab === "ticket" ? "active" : ""}`}
            onClick={() => setActiveTab("ticket")}
          >
            Submit Ticket
          </button>
          <button
            className={`help-tab-btn ${activeTab === "review" ? "active" : ""}`}
            onClick={() => setActiveTab("review")}
          >
            Submit Review
          </button>
        </div>

        {/*FAQ tab*/}
        {activeTab === "faq" && (
          <div className="help-content faq-section">
            <h2>Frequently Asked Questions</h2>
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
            <h2>Submit a Support Ticket</h2>
            <p className="form-intro">
              Have an issue or need assistance? Let us know and our support team will help you resolve it.
            </p>
            <form className="help-form" onSubmit={handleTicketSubmit}>
              <div className="form-group">
                <label htmlFor="category">Issue Category</label>
                <select id="category" required>
                  <option value="">Select a category</option>
                  <option value="bug">Bug Report</option>
                  <option value="account">Account Issue</option>
                  <option value="technical">Technical Support</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="subject">Subject</label>
                <input
                  type="text"
                  id="subject"
                  placeholder="Brief description of your issue"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">Details</label>
                <textarea
                  id="message"
                  placeholder="Please provide detailed information about your issue..."
                  rows="6"
                  required
                ></textarea>
              </div>

              <button type="submit" className="submit-btn">
                Submit Ticket
              </button>
            </form>
          </div>
        )}

        {/*Submit review tab*/}
        {activeTab === "review" && (
          <div className="help-content review-section" key={reviewKey}>
            <h2>Submit a Review</h2>
            <p className="form-intro">
              Share your experience with TripMate! Your feedback helps us improve.
            </p>
            <form className="help-form" onSubmit={handleReviewSubmit}>
              <div className="form-group">
                <label>Rate Your Experience</label>
                <ReviewStarRating />
                <input type="hidden" id="rating-input" name="rating" defaultValue="0" />
              </div>

              <div className="form-group">
                <label htmlFor="review-message">Your Review</label>
                <textarea
                  id="review-message"
                  placeholder="Tell us about your experience with TripMate..."
                  rows="6"
                  required
                ></textarea>
              </div>

              <button type="submit" className="submit-btn">
                Submit Review
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