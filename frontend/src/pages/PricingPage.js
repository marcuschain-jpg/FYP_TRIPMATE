import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Pricing.css";
import { useTranslation } from 'react-i18next';

//Import background picture
import PricingBG from "../Assets/Pricing.jpg";

export default function PricingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div
      className="pricing-bg"
      style={{ backgroundImage: `url(${PricingBG})` }}
    >
      <div className="pricing-wrapper">

        {/*Free version card */}
        <div className="pricing-card free">
          <h2 className="pricing-title">{t("free_version_title")}</h2>
          <p className="pricing-price">
            $0<span>/{t("month")}</span>
          </p>

          <ul className="pricing-list">
            <li>{t("fp_list_1")}</li>
            <li>{t("fp_list_2")}</li>
            <li>{t("fp_list_3")}</li>
            <li>{t("fp_list_4")}</li>
          </ul>

          <button
            className="pricing-btn"
            onClick={() => navigate("/register")} //Join button takes user to create account page
          >
            Join
          </button>
        </div>

        {/*premium version card*/}
        <div className="pricing-card premium">
          <h2 className="pricing-title">{t("premium_version_title")}</h2>
          <p className="pricing-price">
            $4.99<span>/{t("month")}</span>
          </p>

          <ul className="pricing-list">
            <li>{t("pp_list_1")}</li>
            <li>{t("pp_list_2")}</li>
            <li>{t("pp_list_3")}</li>
            <li>{t("pp_list_4")}</li>
          </ul>

          <button
            className="pricing-btn"
            onClick={() => navigate("/register")} //Join button takes user to create account page 
          >
            Join
          </button>
        </div>

      </div>
    </div>
  );
}
