let currentExamQuestions = [];
let currentIndex = 0;
let userAnswers = {};
const QUESTIONS_PER_EXAM = 50;

document.addEventListener("DOMContentLoaded", () => {
  if (typeof questionBank !== "undefined") {
    document.getElementById("total-q").innerText = questionBank.length;
    document.getElementById("exam-q").innerText = Math.min(QUESTIONS_PER_EXAM, questionBank.length);
  }
});

function startExam() {
  if (typeof questionBank === "undefined" || questionBank.length === 0) {
    alert("Không tìm thấy dữ liệu câu hỏi trong questionBank!");
    return;
  }

  let shuffled = [...questionBank].sort(() => 0.5 - Math.random());
  currentExamQuestions = shuffled.slice(0, QUESTIONS_PER_EXAM);
  userAnswers = {};

  document.getElementById("welcome-card").classList.add("hidden");
  document.getElementById("quiz-card").classList.remove("hidden");
  showQuestion(0);
}

function showQuestion(index) {
  currentIndex = index;
  const q = currentExamQuestions[index];

  // 1. Ẩn chữ "Question X of Y" (Để trống theo yêu cầu)
  const qNumElem = document.getElementById("question-number");
  if (qNumElem) qNumElem.innerText = "";

  // 2. Hiển thị nội dung câu hỏi
  document.getElementById("question-text").innerText = q.question;

  // 3. Xử lý loại câu hỏi (Single hay Multiple)
  const correctArr = q.correctAnswers || q.correct || [];
  const isMultiple = q.type === "multiple" || correctArr.length > 1;

  const badgeElem = document.getElementById("select-type-badge");
  if (badgeElem) {
    badgeElem.innerText = isMultiple ? "Select all that apply" : "Select one answer";
  }

  // 4. Render danh sách đáp án linh hoạt (hỗ trợ cả options, choices, answers)
  const optionsDiv = document.getElementById("options-container");
  optionsDiv.innerHTML = "";
  
  const opts = q.options || q.choices || q.answers || [];
  const inputType = isMultiple ? "checkbox" : "radio";

  opts.forEach((opt, optIndex) => {
    const isChecked = (userAnswers[currentIndex] || []).includes(optIndex) ? "checked" : "";
    
    optionsDiv.innerHTML += `
      <label class="option-item" style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px; cursor: pointer;">
        <input type="${inputType}" name="option" value="${optIndex}" ${isChecked} onchange="saveAnswer()">
        <span>${opt}</span>
      </label>
    `;
  });

  // 5. Nút bấm Chuyển câu / Nộp bài
  const nextBtn = document.getElementById("next-btn");
  const submitBtn = document.getElementById("submit-btn");

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

// Hàm Nộp Bài & Tính Điểm & Chi Tiết Đáp Án
function submitExam() {
  let score = 0;

  // 1. Tính điểm
  currentExamQuestions.forEach((q, idx) => {
    const userSelected = userAnswers[idx] || [];
    const correctArr = q.correctAnswers || q.correct || [];

    const isCorrect = userSelected.length === correctArr.length &&
                      userSelected.every(val => correctArr.includes(val));
    if (isCorrect) score++;
  });

  const percentage = Math.round((score / currentExamQuestions.length) * 100);
  const passed = percentage >= 70;

  // 2. Chuyển thẻ giao diện
  document.getElementById("quiz-card").classList.add("hidden");
  const resultCard = document.getElementById("result-card");
  if (resultCard) resultCard.classList.remove("hidden");

  // 3. Hiển thị tổng kết điểm
  const scoreBox = document.getElementById("score-box");
  if (scoreBox) {
    scoreBox.innerHTML = `
      <h2>${passed ? "🎉 PASSED!" : "❌ FAILED"}</h2>
      <p>Your Score: <b>${score}/${currentExamQuestions.length}</b> (${percentage}%)</p>
      <p>Pass Grade: 70%</p>
    `;
  }

  // 4. Render khu vực Xem lại bài làm (Chi tiết Đúng / Sai từng câu)
  let reviewContainer = document.getElementById("review-container");
  if (!reviewContainer) {
    reviewContainer = document.createElement("div");
    reviewContainer.id = "review-container";
    if (resultCard) resultCard.appendChild(reviewContainer);
  }

  reviewContainer.innerHTML = "<h2 style='margin-top:20px;'>Chi tiết bài làm:</h2>";

  currentExamQuestions.forEach((q, idx) => {
    const userSelected = userAnswers[idx] || [];
    const correctArr = q.correctAnswers || q.correct || [];
    const opts = q.options || q.choices || q.answers || [];

    const isCorrect = userSelected.length === correctArr.length &&
                      userSelected.every(val => correctArr.includes(val));

    const qBox = document.createElement("div");
    qBox.style.margin = "15px 0";
    qBox.style.padding = "15px";
    qBox.style.border = "1px solid #ccc";
    qBox.style.borderRadius = "8px";
    qBox.style.textAlign = "left";
    qBox.style.backgroundColor = isCorrect ? "#e6fffa" : "#fff5f5";

    // Chỉ hiển thị nội dung câu hỏi
    let htmlContent = `<p style="font-weight: bold; font-size: 16px;">${q.question}</p><ul style="list-style-type: none; padding-left: 0;">`;

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
        tag = " ✗ (Bạn đã chọn sai)";
      }

      htmlContent += `<li style="${colorStyle} margin: 5px 0;">
                        ${isSelected ? '🔘' : '⚪'} ${opt} ${tag}
                      </li>`;
    });

    htmlContent += `</ul>`;
    htmlContent += `<p style="font-weight:bold; color:${isCorrect ? '#28a745' : '#dc3545'}; margin-top: 8px;">
                      Kết quả: ${isCorrect ? '✓ Đúng' : '✗ Sai'}
                    </p>`;

    qBox.innerHTML = htmlContent;
    reviewContainer.appendChild(qBox);
  });
}

// Khai báo alias để không bị lỗi nếu HTML gọi nhầm finishExam()
function finishExam() {
  submitExam();
}
