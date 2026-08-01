let currentExamQuestions = [];
let currentIndex = 0;
let userAnswers = {};
const QUESTIONS_PER_EXAM = 50;

document.addEventListener("DOMContentLoaded", () => {
  initExamInfo();
});

function initExamInfo() {
  if (typeof questionBank !== "undefined" && Array.isArray(questionBank)) {
    const totalQ = document.getElementById("total-q");
    const examQ = document.getElementById("exam-q");
    
    if (totalQ) totalQ.innerText = questionBank.length;
    if (examQ) examQ.innerText = Math.min(QUESTIONS_PER_EXAM, questionBank.length);
  } else {
    console.warn("Chưa tìm thấy mảng 'questionBank'!");
  }
}

function startExam() {
  if (typeof questionBank === "undefined" || !Array.isArray(questionBank) || questionBank.length === 0) {
    alert("Không tìm thấy dữ liệu câu hỏi! Vui lòng kiểm tra lại file questions.js.");
    return;
  }

  // Shuffle & lấy số lượng câu hỏi
  let shuffled = [...questionBank].sort(() => 0.5 - Math.random());
  currentExamQuestions = shuffled.slice(0, Math.min(QUESTIONS_PER_EXAM, questionBank.length));
  userAnswers = {};

  document.getElementById("welcome-card")?.classList.add("hidden");
  document.getElementById("result-card")?.classList.add("hidden");
  document.getElementById("quiz-card")?.classList.remove("hidden");
  
  showQuestion(0);
}

// Hàm chuẩn hóa lấy mảng đáp án đúng
function getCorrectAnswers(q) {
  const raw = q.correctAnswer !== undefined ? q.correctAnswer : (q.correctAnswers || q.correct);
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "number") return [raw];
  return [];
}

function showQuestion(index) {
  currentIndex = index;
  const q = currentExamQuestions[index];

  // 1. Cập nhật số thứ tự
  const qNumElem = document.getElementById("question-number");
  if (qNumElem) qNumElem.innerText = `Câu ${index + 1} / ${currentExamQuestions.length}`;

  // 2. Cập nhật nội dung
  const qTextElem = document.getElementById("question-text");
  if (qTextElem) qTextElem.innerText = q.question || "Nội dung câu hỏi bị trống";

  // 3. Xử lý Single / Multiple
  const correctArr = getCorrectAnswers(q);
  const isMultiple = q.type === "multiple" || correctArr.length > 1;

  const badgeElem = document.getElementById("select-type-badge");
  if (badgeElem) {
    badgeElem.innerText = isMultiple ? "Select all that apply (Chọn nhiều đáp án)" : "Select one answer (Chọn 1 đáp án)";
  }

  // 4. Render các lựa chọn
  const optionsDiv = document.getElementById("options-container");
  if (optionsDiv) {
    optionsDiv.innerHTML = "";
    const opts = q.options || q.choices || [];
    const inputType = isMultiple ? "checkbox" : "radio";

    opts.forEach((opt, optIndex) => {
      const isChecked = (userAnswers[currentIndex] || []).includes(optIndex) ? "checked" : "";
      
      const label = document.createElement("label");
      label.className = "option-item";
      label.innerHTML = `
        <span>${opt}</span>
        <input type="${inputType}" name="option" value="${optIndex}" ${isChecked}>
      `;
      
      label.querySelector("input").addEventListener("change", saveAnswer);
      optionsDiv.appendChild(label);
    });
  }

  // 5. Nút bấm điều hướng
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  const submitBtn = document.getElementById("submit-btn");

  if (prevBtn) prevBtn.disabled = (index === 0);

  if (index === currentExamQuestions.length - 1) {
    if (nextBtn) nextBtn.classList.add("hidden");
    if (submitBtn) submitBtn.classList.remove("hidden");
  } else {
    if (nextBtn) nextBtn.classList.remove("hidden");
    if (submitBtn) submitBtn.classList.add("hidden");
  }
}

function saveAnswer() {
  const selected = Array.from(document.querySelectorAll('input[name="option"]:checked'))
                        .map(cb => parseInt(cb.value));
  userAnswers[currentIndex] = selected;
}

function nextQuestion() {
  if (currentIndex < currentExamQuestions.length - 1) {
    showQuestion(currentIndex + 1);
  }
}

function prevQuestion() {
  if (currentIndex > 0) {
    showQuestion(currentIndex - 1);
  }
}

function finishExam() {
  let score = 0;

  currentExamQuestions.forEach((q, idx) => {
    const userSelected = (userAnswers[idx] || []).sort((a, b) => a - b);
    const correctArr = getCorrectAnswers(q).sort((a, b) => a - b);

    const isCorrect = userSelected.length === correctArr.length &&
                      userSelected.every((val, i) => val === correctArr[i]);
    if (isCorrect) score++;
  });

  const percentage = currentExamQuestions.length > 0 
    ? Math.round((score / currentExamQuestions.length) * 100) 
    : 0;
  const passed = percentage >= 70;

  document.getElementById("quiz-card")?.classList.add("hidden");
  const resultCard = document.getElementById("result-card");
  if (resultCard) resultCard.classList.remove("hidden");

  const scoreBox = document.getElementById("score-box");
  if (scoreBox) {
    scoreBox.innerHTML = `
      <h2>${passed ? "🎉 PASSED!" : "❌ FAILED"}</h2>
      <p>Your Score: <b>${score}/${currentExamQuestions.length}</b> (${percentage}%)</p>
      <p>Pass Grade: 70%</p>
    `;
  }

  // Hiển thị khu vực xem lại bài làm
  let reviewContainer = document.getElementById("review-container");
  if (!reviewContainer) {
    reviewContainer = document.createElement("div");
    reviewContainer.id = "review-container";
    if (resultCard) resultCard.appendChild(reviewContainer);
  }

  reviewContainer.innerHTML = "<h3 style='margin-top:20px; text-align:left;'>Chi tiết bài làm:</h3>";

  currentExamQuestions.forEach((q, idx) => {
    const userSelected = userAnswers[idx] || [];
    const correctArr = getCorrectAnswers(q);
    const opts = q.options || [];

    const isCorrect = userSelected.length === correctArr.length &&
                      userSelected.every(val => correctArr.includes(val));

    const qBox = document.createElement("div");
    qBox.style.cssText = `
      margin: 15px 0;
      padding: 15px;
      border: 1px solid #ccc;
      border-radius: 10px;
      text-align: left;
      background-color: ${isCorrect ? '#e6fffa' : '#fff5f5'};
    `;

    let htmlContent = `<p style="font-weight: bold; font-size: 15px;">Câu ${idx + 1}: ${q.question}</p>
                       <ul style="list-style-type: none; padding-left: 0; margin-top: 10px;">`;

    opts.forEach((opt, optIdx) => {
      const isSelected = userSelected.includes(optIdx);
      const isAnsCorrect = correctArr.includes(optIdx);

      let colorStyle = "color: #333;";
      let tag = "";

      if (isAnsCorrect) {
        colorStyle = "color: #28a745; font-weight: bold;";
        tag = " ✓ (Đáp án đúng)";
      } else if (isSelected && !isAnsCorrect) {
        colorStyle = "color: #dc3545; font-weight: bold;";
        tag = " ✗ (Đã chọn sai)";
      }

      htmlContent += `<li style="${colorStyle} margin: 6px 0; font-size: 14px;">
                        ${isSelected ? '🔘' : '⚪'} ${opt} ${tag}
                      </li>`;
    });

    htmlContent += `</ul>`;
    qBox.innerHTML = htmlContent;
    reviewContainer.appendChild(qBox);
  });
}
