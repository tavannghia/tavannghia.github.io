const textInput = document.getElementById("textInput");
const voiceSelect = document.getElementById("voiceSelect");
const rateInput = document.getElementById("rate");
const playButton = document.getElementById("playButton");
const pauseButton = document.getElementById("pauseButton");
const stopButton = document.getElementById("stopButton");
const currentSentenceDisplay = document.getElementById("currentSentence");
const resumeButton = document.getElementById("resumeButton");
let speechSynthesis = window.speechSynthesis;
let utterance;
let voices = [];
let currentSentenceIndex = 0;
let sentences = [];
let isPaused = false;
let pauseCharIndex = 0;

// Hàm lấy danh sách các giọng đọc
function populateVoiceList() {
  voices = speechSynthesis.getVoices();
  voiceSelect.innerHTML = "";
  voices.forEach((voice, index) => {
    const option = document.createElement("option");
    option.textContent = `${voice.name} (${voice.lang})`;
    option.value = index;
    voiceSelect.appendChild(option);
  });
}

// Gọi hàm lấy danh sách các giọng đọc khi có thay đổi
populateVoiceList();
if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = populateVoiceList;
}

// Xử lý sự kiện nút "Đọc"
playButton.addEventListener("click", () => {
  if (utterance && speechSynthesis.speaking) {
    return; // Nếu đang nói, không làm gì
  }

  sentences = textInput.value.match(/[^\.!\?]+[\.!\?]+/g) || [textInput.value];
  currentSentenceIndex = 0;
  speakSentence(currentSentenceIndex);
});

function speakSentence(index) {
  if (index >= sentences.length) return;

  utterance = new SpeechSynthesisUtterance(sentences[index]);
  utterance.voice = voices[voiceSelect.value];
  utterance.rate = rateInput.value;

  utterance.onboundary = function (event) {
    const charIndex = event.charIndex;
    const text = sentences[index];

    if (isPaused) {
      pauseCharIndex = charIndex;
      return;
    }

    const words = text.split(/\s+/);
    let currentWordIndex = 0;
    let characterCount = 0;
    for (let i = 0; i < words.length; i++) {
      if (charIndex < characterCount + words[i].length) {
        currentWordIndex = i;
        break;
      }
      characterCount += words[i].length + 1; // Cộng thêm 1 để tính khoảng trắng
    }

    const highlightedSentence = words
      .map((word, i) =>
        i === currentWordIndex
          ? `<span style="color: red; font-weight: bold;">${word}</span>`
          : word
      )
      .join(" ");
    currentSentenceDisplay.innerHTML = highlightedSentence;
  };

  utterance.onend = () => {
    currentSentenceIndex++;
    if (currentSentenceIndex < sentences.length) {
      speakSentence(currentSentenceIndex);
    } else {
      currentSentenceDisplay.textContent = "Đã đọc xong.";
    }
  };

  speechSynthesis.speak(utterance);
}

// Xử lý sự kiện nút "Tạm dừng"
pauseButton.addEventListener("click", () => {
  if (speechSynthesis.speaking) {
    isPaused = true;
    speechSynthesis.pause();
  }
});

// Xử lý sự kiện nút "Tiếp tục"
resumeButton.addEventListener("click", () => {
  if (isPaused) {
    isPaused = false;
    const text = sentences[currentSentenceIndex];
    utterance = new SpeechSynthesisUtterance(text.slice(pauseCharIndex));
    utterance.voice = voices[voiceSelect.value];
    utterance.rate = rateInput.value;
    utterance.onboundary = function (event) {
      const charIndex = event.charIndex;
      const words = text.slice(pauseCharIndex).split(/\s+/);
      let currentWordIndex = 0;
      let characterCount = 0;
      for (let i = 0; i < words.length; i++) {
        if (charIndex < characterCount + words[i].length) {
          currentWordIndex = i;
          break;
        }
        characterCount += words[i].length + 1;
      }

      const highlightedSentence = words
        .map((word, i) =>
          i === currentWordIndex
            ? `<span style="color: red; font-weight: bold;">${word}</span>`
            : word
        )
        .join(" ");
      currentSentenceDisplay.innerHTML = highlightedSentence;
    };

    utterance.onend = () => {
      currentSentenceIndex++;
      if (currentSentenceIndex < sentences.length) {
        speakSentence(currentSentenceIndex);
      } else {
        currentSentenceDisplay.textContent = "Đã đọc xong.";
      }
    };

    speechSynthesis.speak(utterance);
  }
});

// Xử lý sự kiện nút "Dừng"
stopButton.addEventListener("click", () => {
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
    currentSentenceDisplay.textContent = "";
    isPaused = false;
  }
});
