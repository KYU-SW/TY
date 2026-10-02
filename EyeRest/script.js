console.log("EyeRest JavaScript 연결 성공");

/*
 * 개발 중에는 타이머를 초 단위로 시험한다.
 *
 * true:
 * 양호 20초, 주의 15초, 휴식 권장 10초
 *
 * false:
 * 양호 20분, 주의 15분, 휴식 권장 10분
 */
const DEMO_MODE = true;

/*
 * 사용자가 입력하는 증상 항목의 id
 */
const symptomIds = [
  "fatigue",
  "dryness",
  "blur",
  "discomfort"
];

/*
 * HTML 요소 가져오기
 */
const checkButton = document.getElementById("checkButton");
const startWorkButton = document.getElementById("startWorkButton");

const resultCard = document.getElementById("resultCard");
const statusBadge = document.getElementById("statusBadge");
const totalScoreElement = document.getElementById("totalScore");
const resultMessage = document.getElementById("resultMessage");

const timerCard = document.getElementById("timerCard");
const timerStatus = document.getElementById("timerStatus");
const timerDisplay = document.getElementById("timerDisplay");

const pauseButton = document.getElementById("pauseButton");
const endWorkButton = document.getElementById("endWorkButton");

const breakCard = document.getElementById("breakCard");
const breakTimerDisplay =
  document.getElementById("breakTimerDisplay");

const completeBreakButton =
  document.getElementById("completeBreakButton");

const postponeBreakButton =
  document.getElementById("postponeBreakButton");

/*
 * 현재 작업 세션 상태
 */
let currentResult = null;

let workTimerId = null;
let breakTimerId = null;

let remainingWorkSeconds = 0;
let remainingBreakSeconds = 20;

let isWorkPaused = false;

let completedBreaks = 0;
let postponedBreaks = 0;

/*
 * 슬라이더의 숫자를 실시간으로 표시한다.
 */
symptomIds.forEach((id) => {
  const slider = document.getElementById(id);
  const valueElement =
    document.getElementById(`${id}Value`);

  if (!slider || !valueElement) {
    console.error(`${id} 관련 요소를 찾을 수 없습니다.`);
    return;
  }

  slider.addEventListener("input", () => {
    valueElement.textContent = slider.value;
  });
});

/*
 * 네 가지 증상 점수의 합을 계산한다.
 */
function calculateTotalScore() {
  let totalScore = 0;

  symptomIds.forEach((id) => {
    const input = document.getElementById(id);
    totalScore += Number(input.value);
  });

  return totalScore;
}

/*
 * 점수에 따라 휴식 안내 수준과 작업 주기를 결정한다.
 *
 * 이 점수 구간은 의료 진단 기준이 아니라
 * 프로토타입의 휴식 안내를 위한 설계 규칙이다.
 */
function classifyEyeCondition(totalScore) {
  if (totalScore <= 5) {
    return {
      status: "양호",
      color: "#1ca7a6",
      workMinutes: 20,
      message:
        "현재 불편 정도가 낮습니다. 작업 중에도 정기적으로 눈을 쉬어 주세요."
    };
  }

  if (totalScore <= 12) {
    return {
      status: "주의",
      color: "#f2a23a",
      workMinutes: 15,
      message:
        "눈의 불편감이 확인되었습니다. 평소보다 조금 이른 휴식을 권장합니다."
    };
  }

  return {
    status: "휴식 권장",
    color: "#ff7a66",
    workMinutes: 10,
    message:
      "현재 눈 휴식이 권장되는 상태입니다. 작업 전에 잠시 화면에서 눈을 떼어 주세요."
  };
}

/*
 * 초 단위 시간을 00:00 형식으로 변환한다.
 *
 * 예:
 * 65초 → 01:05
 */
function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const minuteText = String(minutes).padStart(2, "0");
  const secondText = String(seconds).padStart(2, "0");

  return `${minuteText}:${secondText}`;
}

/*
 * 실행 중인 작업 타이머를 안전하게 제거한다.
 */
function clearWorkTimer() {
  if (workTimerId !== null) {
    clearInterval(workTimerId);
    workTimerId = null;
  }
}

/*
 * 실행 중인 휴식 타이머를 안전하게 제거한다.
 */
function clearBreakTimer() {
  if (breakTimerId !== null) {
    clearInterval(breakTimerId);
    breakTimerId = null;
  }
}

/*
 * 상태 확인 버튼
 */
checkButton.addEventListener("click", () => {
  const totalScore = calculateTotalScore();

  currentResult =
    classifyEyeCondition(totalScore);

  totalScoreElement.textContent = totalScore;

  statusBadge.textContent =
    currentResult.status;

  statusBadge.style.backgroundColor =
    currentResult.color;

  resultMessage.textContent =
    `${currentResult.message} 권장 작업 주기는 ` +
    `${currentResult.workMinutes}분입니다.`;

  resultCard.classList.remove("hidden");

  resultCard.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  console.log("눈 상태 판정 결과:", {
    totalScore,
    status: currentResult.status,
    workMinutes: currentResult.workMinutes
  });
});

/*
 * 작업 시작 버튼
 */
startWorkButton.addEventListener("click", () => {
  if (!currentResult) {
    alert("먼저 눈 상태를 확인해 주세요.");
    return;
  }

  startWorkSession();
});

/*
 * 새로운 작업 세션을 시작한다.
 */
function startWorkSession() {
  clearWorkTimer();
  clearBreakTimer();

  isWorkPaused = false;
  pauseButton.textContent = "일시 정지";

  /*
   * 개발 모드에서는 분 대신 초로 시험한다.
   */
  if (DEMO_MODE) {
    remainingWorkSeconds =
      currentResult.workMinutes;
  } else {
    remainingWorkSeconds =
      currentResult.workMinutes * 60;
  }

  timerDisplay.textContent =
    formatTime(remainingWorkSeconds);

  timerStatus.textContent =
    DEMO_MODE
      ? "시연 모드: 다음 휴식까지 남은 시간"
      : "다음 휴식까지 남은 시간";

  resultCard.classList.add("hidden");
  breakCard.classList.add("hidden");
  timerCard.classList.remove("hidden");

  timerCard.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  runWorkTimer();
}

/*
 * 작업 타이머를 실행한다.
 */
function runWorkTimer() {
  clearWorkTimer();

  workTimerId = setInterval(() => {
    if (isWorkPaused) {
      return;
    }

    remainingWorkSeconds -= 1;

    timerDisplay.textContent =
      formatTime(remainingWorkSeconds);

    if (remainingWorkSeconds <= 0) {
      clearWorkTimer();
      showBreakScreen();
    }
  }, 1000);
}

/*
 * 작업 일시 정지 및 재개
 */
pauseButton.addEventListener("click", () => {
  isWorkPaused = !isWorkPaused;

  if (isWorkPaused) {
    pauseButton.textContent = "계속하기";
    timerStatus.textContent = "작업이 일시 정지되었습니다.";
  } else {
    pauseButton.textContent = "일시 정지";
    timerStatus.textContent =
      "다음 휴식까지 남은 시간";
  }
});

/*
 * 작업 종료
 */
endWorkButton.addEventListener("click", () => {
  const shouldEnd =
    window.confirm("현재 작업을 종료하시겠습니까?");

  if (!shouldEnd) {
    return;
  }

  clearWorkTimer();
  clearBreakTimer();

  timerCard.classList.add("hidden");
  breakCard.classList.add("hidden");
  resultCard.classList.remove("hidden");

  resultMessage.textContent =
    `작업이 종료되었습니다. ` +
    `완료한 휴식은 ${completedBreaks}회, ` +
    `연기한 휴식은 ${postponedBreaks}회입니다.`;
});

/*
 * 작업시간이 끝나면 휴식 화면을 표시한다.
 */
function showBreakScreen() {
  clearWorkTimer();

  timerCard.classList.add("hidden");
  breakCard.classList.remove("hidden");

  remainingBreakSeconds = 20;

  breakTimerDisplay.textContent =
    formatTime(remainingBreakSeconds);

  breakCard.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  runBreakTimer();
}

/*
 * 20초 휴식 타이머
 */
function runBreakTimer() {
  clearBreakTimer();

  breakTimerId = setInterval(() => {
    remainingBreakSeconds -= 1;

    breakTimerDisplay.textContent =
      formatTime(remainingBreakSeconds);

    if (remainingBreakSeconds <= 0) {
      clearBreakTimer();

      breakTimerDisplay.textContent =
        "휴식 완료 가능";
    }
  }, 1000);
}

/*
 * 휴식 완료
 */
completeBreakButton.addEventListener("click", () => {
  clearBreakTimer();

  completedBreaks += 1;

  alert(
    `휴식을 완료했습니다.\n` +
    `현재 휴식 완료 횟수: ${completedBreaks}회`
  );

  breakCard.classList.add("hidden");

  /*
   * 같은 눈 상태 판정 결과를 사용해
   * 다음 작업 주기를 다시 시작한다.
   */
  startWorkSession();
});

/*
 * 휴식 연기
 */
postponeBreakButton.addEventListener("click", () => {
  clearBreakTimer();

  postponedBreaks += 1;

  /*
   * 개발 모드에서는 5초 뒤 다시 알림을 제공한다.
   * 실제 모드에서는 5분 뒤 다시 알림을 제공한다.
   */
  remainingWorkSeconds =
    DEMO_MODE ? 5 : 5 * 60;

  breakCard.classList.add("hidden");
  timerCard.classList.remove("hidden");

  timerStatus.textContent =
    "휴식이 연기되었습니다. 잠시 후 다시 안내합니다.";

  timerDisplay.textContent =
    formatTime(remainingWorkSeconds);

  isWorkPaused = false;
  pauseButton.textContent = "일시 정지";

  runWorkTimer();

  console.log(
    `휴식 연기 횟수: ${postponedBreaks}회`
  );
});