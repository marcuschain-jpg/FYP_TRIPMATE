import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import "../styles/Quiz.css";

//Import quiz background picture
import QuizBG from "../Assets/Quiz.jpg";

//Question images
import Q1 from "../Assets/Qn1.jpg";
import Q2 from "../Assets/Qn2.jpg";
import Q3 from "../Assets/Qn3.jpg";
import Q4 from "../Assets/Qn4.jpg";
import Q5 from "../Assets/Qn5.jpg";

//Result images--> traveller type & description
import Foodie from "../Assets/Foodie.jpg";
import ThrillSeeker from "../Assets/ThrillSeeker.jpg";
import RelaxedWanderer from "../Assets/RelaxedWanderer.jpg";

export default function Quiz() {
  const navigate = useNavigate();

  //Questions and options--> clicking on option takes u to the next quesiton
  const questions = [
    {
      text:
        "You see 3 paths glowing before you. Each one hums with a different energy. Which path calls to you first?",
      image: Q1,
      options: [
        {
          label: "A",
          text:
            "The lively, fragrant street where sizzling food fills the air",
        },
        {
          label: "B",
          text: "A rugged path leading into the mountains and mystery",
        },
        {
          label: "C",
          text: "A quiet garden path with soft wind and warm sunlight",
        },
      ],
    },
    {
      text:
        "A friendly villager approaches and invites you to join them for a small activity. What would you enjoy right now?",
      image: Q2,
      options: [
        { label: "A", text: "Try their homemade local dishes" },
        {
          label: "B",
          text:
            "Follow them up a hidden trail which promises an amazing view",
        },
        {
          label: "C",
          text: "Sit down and enjoy a calming cup of tea with them",
        },
      ],
    },
    {
      text:
        "After your activity, you reach a crossroad with 3 signs. Where are you going?",
      image: Q3,
      options: [
        {
          label: "A",
          text: "The night market — I want to eat lots of yummy foods!",
        },
        {
          label: "B",
          text: "The cliff walk — looks dangerous but exciting!",
        },
        {
          label: "C",
          text: "The lakeside pavilion — calm and peaceful",
        },
      ],
    },
    {
      text:
        "The weather suddenly changes and rain starts pouring. What do you do now?",
      image: Q4,
      options: [
        {
          label: "A",
          text:
            "Take cover in a hut — maybe someone is cooking inside",
        },
        {
          label: "B",
          text:
            "Keep walking — the drizzle feels refreshing and you're curious",
        },
        {
          label: "C",
          text:
            "Sit under a shelter and wait for the rain to stop",
        },
      ],
    },
    {
      text:
        "Before you leave the village, you're given a small keepsake. What do you pick?",
      image: Q5,
      options: [
        {
          label: "A",
          text:
            "A beautifully wrapped box of snacks — a taste of the village",
        },
        {
          label: "B",
          text:
            "A handcrafted charm that brings courage and adventure",
        },
        {
          label: "C",
          text:
            "A smooth river stone infused with calming scents",
        },
      ],
    },
  ];

  const [step, setStep] = useState("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]); 
  const [result, setResult] = useState(null); 

  const totalQuestions = questions.length;

  //results linked with options chosen
  //Mostly A--> foodie
  //Mostly B--> thrill seeker
  //Mostly C--> relaxed wanderer
  const resultData = {
    A: {
      title: "Foodie!",
      img: Foodie,
      line1:
        "You discover the world through flavours and love finding hidden local eats!",
      line2: "Ready for your next tasty adventure?",
      line3:
        "Plan your next trip with us or join a trip and meet fellow foodie travellers!",
    },
    B: {
      title: "Thrill Seeker!",
      img: ThrillSeeker,
      line1:
        "You chase excitement, new challenges, and unforgettable experiences.",
      line2: "Craving more adrenaline?",
      line3:
        "Plan your next trip with us or join a trip and embark on your next adventure!",
    },
    C: {
      title: "Relaxed Wanderer!",
      img: RelaxedWanderer,
      line1:
        "You unwind through calming experiences and peaceful surroundings.",
      line2: "Want a soothing escape?",
      line3:
        "Plan your next trip or join a trip to unwind with like-minded individuals!",
    },
  };

  //Tie-breaker logic
  //If there is a tie between 2 options--> choose the most recently selected option
  //e.g. if results are ABBAC --> winner = A --> user = foodie 
  const computeResult = (arr) => {
    const count = { A: 0, B: 0, C: 0 };

    arr.forEach((ans) => {
      if (ans) count[ans] += 1;
    });

    const max = Math.max(count.A, count.B, count.C);
    const candidates = [];
    if (count.A === max) candidates.push("A");
    if (count.B === max) candidates.push("B");
    if (count.C === max) candidates.push("C");

    if (candidates.length === 1) return candidates[0];

    //Tie → most recent answer among tied
    for (let i = arr.length - 1; i >= 0; i--) {
      if (candidates.includes(arr[i])) {
        return arr[i];
      }
    }

    return "A";
  };

  const handleAnswer = (value) => {
    const updated = [...answers];
    updated[currentIndex] = value;
    setAnswers(updated);

    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
    }
    //Last question--> stay on it and wait for "Generate results" button
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (currentIndex === 0 && step === "questions") {
      setStep("intro");
    }
  };

  const handleGenerateResults = () => {
    //Available to click only after user has chosen answer for last question 
    if (!answers[totalQuestions - 1]) return;
    setStep("loading");
  };

  //Loading page while results are tabulated
  useEffect(() => {
    if (step === "loading") {
      const finalResult = computeResult(answers);
      const timer = setTimeout(() => {
        setResult(finalResult);
        setStep("result");
      }, 2000); //2s "tabulating" effect

      return () => clearTimeout(timer);
    }
  }, [step, answers]);

  const currentQuestion = questions[currentIndex];
  const progressPercent = ((currentIndex + 1) / totalQuestions) * 100;

  return (
    <div
      className="quiz-page-bg"
      style={{ backgroundImage: `url(${QuizBG})` }}
    >
      {step === "intro" && (
        <div className="quiz-intro-card">
          <h2 className="quiz-intro-text">
            Embark on a magical journey to find out your travel type!
          </h2>
          <button
            className="quiz-intro-btn-main"
            onClick={() => setStep("questions")}
          >
            Take Quiz
          </button>
        </div>
      )}

      
      {step === "questions" && (
        <div className="quiz-main-card">
          {/*Progress bar--> shows user which qustion they are on*/}
          <div className="quiz-progress">
            <div className="quiz-progress-label">
              Question {currentIndex + 1} of {totalQuestions}
            </div>
            <div className="quiz-progress-track">
              <div
                className="quiz-progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <h2 className="quiz-question-text">{currentQuestion.text}</h2>

          <img
            src={currentQuestion.image}
            alt="Question visual"
            className="quiz-question-image"
          />

          <div className="quiz-options-wrapper">
            {currentQuestion.options.map((opt) => (
              <button
                key={opt.label}
                className={`quiz-option-btn ${
                  answers[currentIndex] === opt.label ? "selected" : ""
                }`}
                onClick={() => handleAnswer(opt.label)}
              >
                {opt.label}. {opt.text}
              </button>
            ))}
          </div>

          <div className="quiz-bottom-row">
            <button
              className="quiz-back-link"
              onClick={handleBack}
              disabled={currentIndex === 0}
            >
              ← Back
            </button>

            {/*Show Generate Results only on last question*/}
            {currentIndex === totalQuestions - 1 && (
              <button
                className="quiz-generate-btn"
                onClick={handleGenerateResults}
                disabled={!answers[totalQuestions - 1]}
              >
                Generate Results
              </button>
            )}
          </div>
        </div>
      )}

      {/*Loading screen with animation*/}
      {step === "loading" && (
        <div className="quiz-loading-card">
          <div className="loading-lantern" />
          <p className="loading-text">Tabulating your travel type...</p>
          <p className="loading-subtext">
            Following your footsteps through the village ✨
          </p>
        </div>
      )}

      {/*Result screen--> shows user their travelling style*/}
      {step === "result" && result && (
        <div className="quiz-result-card">
          <h3 className="quiz-result-top">You Are A</h3>
          <h1 className="quiz-result-title">{resultData[result].title}</h1>

          <img
            src={resultData[result].img}
            alt="Result"
            className="quiz-result-image"
          />

          <p className="quiz-result-line1">{resultData[result].line1}</p>
          <p className="quiz-result-line2">{resultData[result].line2}</p>
          <p className="quiz-result-line3">{resultData[result].line3}</p>

          <Link to="/login" className="join-button">
            Join Now
            </Link>

        </div>
      )}
    </div>
  );
}
