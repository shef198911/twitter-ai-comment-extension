// ==UserScript==
// @name         Twitter AI Reply Button with Styles Hover Menu
// @version      1.4.20
// @description  Adds a draggable gear icon with a dropdown menu showing text generation and translation options on Twitter
// @match        https://twitter.com/*
// @match        https://x.com/*
// @match        https://pro.x.com/*
// @grant        none
// ==/UserScript==

const GROQ_API_KEY = "You Groq API";

function createOrGetFloatingWindow() {
  let win = document.getElementById("ai-floating-replies-window");
  if (win) return win;

  win = document.createElement("div");
  win.id = "ai-floating-replies-window";
  Object.assign(win.style, {
    position: "absolute",
    backgroundColor: "#15202b",
    border: "1px solid #38444d",
    borderRadius: "8px",
    padding: "10px",
    color: "white",
    fontSize: "14px",
    userSelect: "text",
    display: "none",
    flexDirection: "column",
    gap: "6px",
    maxWidth: "400px",
    boxShadow: "0 0 10px rgba(29, 161, 242, 0.9)",
    zIndex: 99999,
  });

  document.body.appendChild(win);
  return win;
}

function createOrGetTranslateWindow() {
  let win = document.getElementById("ai-translate-window");
  if (win) return win;

  win = document.createElement("div");
  win.id = "ai-translate-window";
  Object.assign(win.style, {
    position: "absolute",
    backgroundColor: "#15202b",
    border: "1px solid #38444d",
    borderRadius: "8px",
    padding: "10px",
    color: "white",
    fontSize: "14px",
    userSelect: "text",
    display: "none",
    flexDirection: "column",
    gap: "6px",
    maxWidth: "400px",
    boxShadow: "0 0 10px rgba(29, 161, 242, 0.9)",
    zIndex: 99999,
  });

  document.body.appendChild(win);
  return win;
}

function insertButtonIntoReplyBoxes() {
  const boxes = document.querySelectorAll('div[contenteditable="true"][data-testid="tweetTextarea_0"]');

  boxes.forEach((box) => {
    const container = box.parentElement;
    if (!container || container.querySelector(".ai-gear-button")) return;

    container.style.position = "relative";

    // Основная кнопка (шестерёнка)
    const gearButton = document.createElement("button");
    gearButton.className = "ai-gear-button";
    gearButton.textContent = "⚙️";

    const buttonFontSize = 15.34;
    const buttonPaddingX = 10;
    const buttonPaddingY = 5.81;

    Object.assign(gearButton.style, {
      position: "absolute",
      left: "6px",
      top: `${container.clientHeight - (buttonPaddingY * 2 + buttonFontSize)}px`,
      backgroundColor: "transparent",
      border: "none",
      color: "#1DA1F2",
      padding: `${buttonPaddingY}px ${buttonPaddingX}px`,
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: `${buttonFontSize}px`,
      zIndex: 10000,
    });

    // Всплывающее меню
    const dropdownMenu = document.createElement("div");
    dropdownMenu.className = "ai-dropdown-menu";
    Object.assign(dropdownMenu.style, {
      position: "absolute",
      backgroundColor: "#15202b",
      border: "1px solid #38444d",
      borderRadius: "6px",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.5)",
      padding: `${buttonPaddingY}px ${buttonPaddingX}px`,
      display: "none",
      flexDirection: "row",
      gap: "6px",
      zIndex: 11000,
      opacity: 0,
      transform: "translateX(-10px)",
      transition: "opacity 0.3s ease, transform 0.3s ease",
      maxWidth: "calc(100% - 20px)",
    });

    // Кнопка генерации текста
    const generateButton = document.createElement("button");
    generateButton.textContent = "💡";
    Object.assign(generateButton.style, {
      backgroundColor: "transparent",
      border: "none",
      color: "white",
      padding: `${buttonPaddingY}px ${buttonPaddingX}px`,
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: `${buttonFontSize}px`,
      textAlign: "center",
      whiteSpace: "nowrap",
    });
    generateButton.addEventListener("click", async (e) => {
      e.stopPropagation();
      dropdownMenu.style.display = "none";
      await generateText(box, container);
    });

    // Кнопка переводчика
    const translateButton = document.createElement("button");
    translateButton.textContent = "🌐";
    Object.assign(translateButton.style, {
      backgroundColor: "transparent",
      border: "none",
      color: "white",
      padding: `${buttonPaddingY}px ${buttonPaddingX}px`,
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: `${buttonFontSize}px`,
      textAlign: "center",
      whiteSpace: "nowrap",
    });

    // Меню выбора языка
    const langMenu = document.createElement("div");
    langMenu.className = "ai-lang-menu";
    Object.assign(langMenu.style, {
      position: "absolute",
      top: "0",
      left: "100%",
      backgroundColor: "#15202b",
      border: "1px solid #38444d",
      borderRadius: "6px",
      boxShadow: "0 2px 8px rgb(0 0 0 / 0.5)",
      padding: `${buttonPaddingY}px`,
      display: "none",
      flexDirection: "row",
      gap: "3px",
      zIndex: 12000,
      userSelect: "none",
      minWidth: "60px",
      fontSize: `${buttonFontSize}px`,
    });

    const languages = [
      { key: "ru", label: "RU" },
      { key: "en", label: "ENG" },
    ];

    languages.forEach(({ key, label }) => {
      const langBtn = document.createElement("button");
      langBtn.textContent = label;
      Object.assign(langBtn.style, {
        backgroundColor: "transparent",
        color: "white",
        border: "none",
        cursor: "pointer",
        textAlign: "left",
        padding: `${buttonPaddingY - 0.5}px ${buttonPaddingX - 1.5}px`,
        borderRadius: "4px",
        whiteSpace: "nowrap",
        fontSize: `${buttonFontSize}px`,
      });
      langBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        langMenu.style.display = "none";
        await translateText(box, container, key);
      });
      langMenu.appendChild(langBtn);
    });

    translateButton.addEventListener("click", (e) => {
      e.stopPropagation();
      langMenu.style.display = langMenu.style.display === "flex" ? "none" : "flex";
      dropdownMenu.style.display = "flex";
    });

    dropdownMenu.appendChild(generateButton);
    dropdownMenu.appendChild(translateButton);
    dropdownMenu.appendChild(langMenu);

    // Перетаскивание кнопки
    let isDragging = false;
    let dragStartX, dragStartY, startLeft, startTop;

    gearButton.addEventListener("mousedown", (e) => {
      isDragging = false;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      const rect = gearButton.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      startLeft = rect.left - containerRect.left;
      startTop = rect.top - containerRect.top;
      document.body.style.userSelect = "none";

      function onMouseMove(eMove) {
        const dx = eMove.clientX - dragStartX;
        const dy = eMove.clientY - dragStartY;
        if (!isDragging && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
          isDragging = true;
        }
        if (isDragging) {
          const maxLeft = container.clientWidth - gearButton.offsetWidth;
          const maxTop = container.clientHeight - gearButton.offsetHeight;
          let newLeft = startLeft + dx;
          let newTop = startTop + dy;
          newLeft = Math.max(0, Math.min(newLeft, maxLeft));
          newTop = Math.max(0, Math.min(newTop, maxTop));
          gearButton.style.left = `${newLeft}px`;
          gearButton.style.top = `${newTop}px`;
        }
      }

      function onMouseUp() {
        document.body.style.userSelect = "";
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      }

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    });

    // Показ/скрытие меню
    gearButton.addEventListener("mouseenter", () => {
      const containerRect = container.getBoundingClientRect();
      const buttonRect = gearButton.getBoundingClientRect();
      const menuWidth = dropdownMenu.offsetWidth || 100;
      const menuHeight = dropdownMenu.offsetHeight || 40;

      let newLeft = buttonRect.left - containerRect.left + buttonRect.width + 4;
      let newTop = buttonRect.top - containerRect.top;

      if (newLeft + menuWidth > containerRect.width) {
        newLeft = buttonRect.left - containerRect.left - menuWidth - 4;
      }

      newLeft = Math.max(0, Math.min(newLeft, containerRect.width - menuWidth));
      newTop = Math.max(0, Math.min(newTop, containerRect.height - menuHeight));

      dropdownMenu.style.left = `${newLeft}px`;
      dropdownMenu.style.top = `${newTop}px`;
      dropdownMenu.style.display = "flex";
      setTimeout(() => {
        dropdownMenu.style.opacity = "1";
        dropdownMenu.style.transform = "translateX(0)";
      }, 10);
    });

    gearButton.addEventListener("mouseleave", () => {
      dropdownMenu.style.opacity = "0";
      dropdownMenu.style.transform = "translateX(-10px)";
      setTimeout(() => {
        if (dropdownMenu.style.opacity === "0") {
          dropdownMenu.style.display = "none";
        }
      }, 300);
    });

    dropdownMenu.addEventListener("mouseenter", () => {
      dropdownMenu.style.display = "flex";
      dropdownMenu.style.opacity = "1";
      dropdownMenu.style.transform = "translateX(0)";
    });

    dropdownMenu.addEventListener("mouseleave", () => {
      dropdownMenu.style.opacity = "0";
      dropdownMenu.style.transform = "translateX(-10px)";
      setTimeout(() => {
        if (dropdownMenu.style.opacity === "0") {
          dropdownMenu.style.display = "none";
        }
      }, 300);
    });

    async function generateText(box, container) {
      const floatingWin = createOrGetFloatingWindow();

      if (floatingWin.style.display === "flex") {
        floatingWin.style.display = "none";
        floatingWin.innerHTML = "";
        return;
      }

      floatingWin.style.display = "flex";
      floatingWin.innerHTML = "⏳ Генерируем варианты ответов...";

      const rect = container.getBoundingClientRect();
      floatingWin.style.top = window.scrollY + rect.bottom + 6 + "px";
      floatingWin.style.left = window.scrollX + rect.left + "px";

      try {
        const tweetText = getTweetTextFromDOM(box);
        if (!tweetText) throw new Error("Не удалось получить текст твита.");

        const prompt = `Ты — генератор комментариев для Twitter. Сгенерируй ровно три коротких комментария на русском языке. Стиль — живой, как будто пишешь другу в Twitter, без официоза, сложных слов и пересказа твита. Комментарии должны быть реакцией на твит, добавлять новую мысль или эмоцию, но не повторять его содержание. Используй лёгкую эмоцию (🤔 или 😅) только в одном из трёх комментариев.

Требования:
1. Не используй кавычки, хештеги, англицизмы, восклицания, смайлики (кроме 🤔 или 😅), слова-вводы («Интересно», «Похоже», «Я думаю», «Мне кажется»).
2. Пиши кратко, естественно, как в разговоре с другом, без сленга, флирта, хайпа или излишней вежливости.
3. Не пересказывай и не повторяй текст твита — реагируй на его тему или идею.
4. Обязательно верни ровно три варианта в формате:
1. [комментарий]
2. [комментарий]
3. [комментарий]

Структура ответов:
1. Короткий, простой комментарий, выражающий реакцию или мнение.
2. Более содержательный комментарий, можно с техническим оттенком, но в простом стиле.
3. глубокий расширенный технический ответ на простом языке..

Твит:
${tweetText}

Ответы:
1.`;

        // Генерация случайного seed для разнообразия ответов
        const seed = Math.floor(Math.random() * 1000000);
        console.log("GenerateText Seed:", seed);

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [
              { role: "system", content: "Ты — генератор комментариев Twitter. Всегда возвращай ровно 3 варианта ответа на русском языке в формате '1. ответ\n2. ответ\n3. ответ'. Пиши без вступлений, лишних слов, сленга, кавычек и англицизмов, в лёгком техническом стиле." },
              { role: "user", content: prompt },
            ],
            max_tokens: 2000,
            temperature: 0.9,
            top_p: 1,
            seed: seed,
          }),
        });

        console.log("GenerateText Response status:", response.status);
        const data = await response.json();
        console.log("GenerateText Raw response:", data.choices?.[0]?.message?.content || "No content");
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status} - ${data.error?.message || 'No additional details'}`);

        const replyText = data.choices?.[0]?.message?.content;
        if (!replyText) {
          floatingWin.innerHTML = "❌ Не удалось получить ответ от модели.";
          return;
        }

        const regex = /(?:^|\n)([123])\.\s*([\s\S]+?)(?=(?:\n[123]\.|$))/g;
        const options = [];
        let match;
        while ((match = regex.exec(replyText)) !== null) {
          options.push(match[2].trim());
        }

        if (options.length === 0) {
          floatingWin.innerHTML = "❌ Модель не вернула ни одного варианта.";
          return;
        }

        floatingWin.innerHTML = "";
        options.forEach((optionText, index) => {
          const optionBtn = document.createElement("button");
          optionBtn.textContent = optionText;
          Object.assign(optionBtn.style, {
            backgroundColor: "#1da1f2",
            border: "none",
            borderRadius: "6px",
            padding: "8px",
            cursor: "pointer",
            color: "white",
            textAlign: "left",
            whiteSpace: "normal",
            fontSize: "14px",
            width: "100%",
            marginBottom: index < options.length - 1 ? "6px" : "0",
          });

          optionBtn.addEventListener("click", () => {
            insertTextProperly(box, optionText);
            floatingWin.style.display = "none";
            floatingWin.innerHTML = "";
            box.focus();
          });

          floatingWin.appendChild(optionBtn);
        });

        if (options.length < 3) {
          console.warn(`GenerateText: Only ${options.length} options received. Displaying available options.`);
        }
      } catch (err) {
        floatingWin.innerHTML = `❌ Ошибка при генерации ответа: ${err.message}`;
        console.error("GenerateText error:", err);
      }
    }

    async function translateText(box, container, targetLang) {
      const translateWin = createOrGetTranslateWindow();
      translateWin.style.display = "flex";
      translateWin.innerHTML = "⏳ Переводим текст...";

      const rect = container.getBoundingClientRect();
      translateWin.style.top = window.scrollY + rect.bottom + 6 + "px";
      translateWin.style.left = window.scrollX + rect.left + "px";

      try {
        let inputText = box.innerText.trim();
        console.log("TranslateText Input text:", inputText);

        // Проверка на пустой текст или текст без букв/цифр
        if (!inputText || !inputText.match(/\w/)) {
          throw new Error("Текст пустой или содержит только неподдерживаемые символы.");
        }
        // Ограничение длины текста
        if (inputText.length > 500) {
          inputText = inputText.substring(0, 500);
          console.warn("TranslateText: Input text truncated to 500 characters.");
        }

        const prompt = targetLang === "ru"
          ? `Переведи с английского на русский язык. Сохраняй естественный стиль, как будто текст написал носитель языка. Не добавляй пояснений, только перевод:\n\n${inputText}`
          : `Переведи с русского на английский язык. Сохраняй естественный стиль, как будто текст написал носитель языка. Не добавляй пояснений, только перевод:\n\n${inputText}`;

        // Генерация случайного seed для разнообразия
        const seed = Math.floor(Math.random() * 1000000);
        console.log("TranslateText Seed:", seed);

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [
              { role: "system", content: "Ты — профессиональный переводчик. Переводи текст точно и естественно, без лишних пояснений." },
              { role: "user", content: prompt },
            ],
            max_tokens: 700,
            temperature: 0.5,
            top_p: 1,
            seed: seed,
          }),
        });

        console.log("TranslateText Response status:", response.status);
        const data = await response.json();
        console.log("TranslateText Response data:", data);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status} - ${data.error?.message || 'No additional details'}`);

        const translated = data.choices?.[0]?.message?.content;
        if (!translated) throw new Error("Empty response");

        translateWin.innerHTML = "";
        const textDiv = document.createElement("div");
        textDiv.textContent = translated.trim();
        Object.assign(textDiv.style, {
          whiteSpace: "pre-wrap",
          marginBottom: "6px",
        });

        const copyBtn = document.createElement("button");
        copyBtn.textContent = "Скопировать";
        Object.assign(copyBtn.style, {
          backgroundColor: "#1da1f2",
          border: "none",
          borderRadius: "6px",
          padding: "8px",
          cursor: "pointer",
          color: "white",
          textAlign: "center",
          fontSize: "14px",
          width: "100%",
        });

        copyBtn.addEventListener("click", () => {
          navigator.clipboard.writeText(translated.trim()).then(() => {
            translateWin.style.display = "none";
            translateWin.innerHTML = "";
            box.focus();
          }).catch((err) => {
            console.error("Ошибка при копировании:", err);
            translateWin.innerHTML = "❌ Ошибка при копировании.";
          });
        });

        translateWin.appendChild(textDiv);
        translateWin.appendChild(copyBtn);
      } catch (err) {
        translateWin.innerHTML = `❌ Ошибка при переводе: ${err.message}`;
        console.error("TranslateText error:", err);
      }
    }

    container.appendChild(gearButton);
    container.appendChild(dropdownMenu);
  });
}

function insertTextProperly(el, text) {
  if (!el) {
    console.error("insertTextProperly: Element is undefined");
    return;
  }
  el.focus();
  document.execCommand("insertText", false, text);
}

function getTweetTextFromDOM(replyBox) {
  console.log("getTweetTextFromDOM: Starting with replyBox:", replyBox);
  const dialog = replyBox.closest('[role="dialog"]');
  let tweetText = "";
  let tweetElements = [];

  if (dialog) {
    tweetElements = dialog.querySelectorAll('div[lang], [data-testid="tweetText"]');
    console.log("getTweetTextFromDOM: Found in dialog:", tweetElements.length);
  } else {
    const article = replyBox.closest("article");
    tweetElements = article?.querySelectorAll('div[lang], [data-testid="tweetText"]') || [];
    console.log("getTweetTextFromDOM: Found in article:", tweetElements.length);
  }

  tweetText = Array.from(tweetElements).map((el) => el.innerText.trim()).filter((text) => text).join("\n");
  console.log("getTweetTextFromDOM: Resulting tweet text:", tweetText);
  return tweetText.trim();
}

document.addEventListener("click", (e) => {
  const floatingWin = document.getElementById("ai-floating-replies-window");
  const translateWin = document.getElementById("ai-translate-window");
  if (floatingWin && !floatingWin.contains(e.target)) {
    floatingWin.style.display = "none";
    floatingWin.innerHTML = "";
  }
  if (translateWin && !translateWin.contains(e.target)) {
    translateWin.style.display = "none";
    translateWin.innerHTML = "";
  }
});

// Повторная вставка кнопок каждые 3 сек
setInterval(() => {
  insertButtonIntoReplyBoxes();
}, 3000);

// Включение переводчика по умолчанию
const translatorEnabled = true;

// Добавление функции для кнопок перевода твитов
function addTranslateButtonsToTweets() {
  if (!translatorEnabled) return;

  const tweetElements = document.querySelectorAll('article div[lang], article [data-testid="tweetText"]');
  console.log("addTranslateButtonsToTweets: Found tweet elements:", tweetElements.length);

  tweetElements.forEach((tweetEl) => {
    const article = tweetEl.closest("article");
    if (!article) {
      console.log("addTranslateButtonsToTweets: No article found for tweet element:", tweetEl);
      return;
    }
    if (article.querySelector(".groq-translate-button")) return;

    const tweetText = tweetEl.innerText.trim();
    if (!tweetText) {
      console.log("addTranslateButtonsToTweets: Empty tweet text for element:", tweetEl);
      return;
    }

    const btn = document.createElement("div");
    btn.className = "groq-translate-button";
    btn.textContent = "Перевести с помощью Groq 🔄";
    Object.assign(btn.style, {
      color: "#1DA1F2",
      cursor: "pointer",
      marginTop: "8px",
      fontSize: "13px",
      userSelect: "none",
      position: "relative",
      zIndex: 10000,
      pointerEvents: "auto",
      textDecoration: "none",
    });

    btn.addEventListener("mouseenter", () => {
      btn.style.textDecoration = "underline";
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.textDecoration = "none";
    });

    btn.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (article.querySelector(".groq-translation-result")) return;

      const translationEl = document.createElement("div");
      translationEl.className = "groq-translation-result";
      translationEl.textContent = "⏳ Перевод...";
      Object.assign(translationEl.style, {
        backgroundColor: "#192734",
        borderRadius: "6px",
        padding: "8px",
        marginTop: "6px",
        color: "white",
        fontSize: "14px",
        whiteSpace: "pre-wrap",
      });

      btn.after(translationEl);

      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [
              { role: "system", content: "Ты — профессиональный переводчик. Твоя задача — переводить английский текст на правильный грамматический русский язык с соблюдением всех правил русского языка, сохраняя структуры и стиль, и все грамматические правила, сохраняя мысль текста, чтобы было понятно носителю русского языка. Переводи грамотно и понятно, как будто текст написал человек. Переводи полный текст целиком, исключи смешивание английского и русского языка. Не добавляй пояснений, выдавай только перевод." },
              { role: "user", content: `Переведи на русский:\n\n${tweetText}` },
            ],
            max_tokens: 300,
            temperature: 0.3,
            top_p: 1,
          }),
        });

        console.log("AddTranslateButtons Response status:", res.status);
        const data = await res.json();
        console.log("AddTranslateButtons Response data:", data);
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status} - ${data.error?.message || 'No additional details'}`);

        const translated = data.choices?.[0]?.message?.content;
        if (!translated) throw new Error("Empty response");

        translationEl.innerHTML = "";
        const textDiv = document.createElement("div");
        textDiv.textContent = translated.trim();
        Object.assign(textDiv.style, {
          whiteSpace: "pre-wrap",
          marginBottom: "6px",
        });

        const copyBtn = document.createElement("button");
        copyBtn.textContent = "Скопировать";
        Object.assign(copyBtn.style, {
          backgroundColor: "#1da1f2",
          border: "none",
          borderRadius: "6px",
          padding: "8px",
          cursor: "pointer",
          color: "white",
          textAlign: "center",
          fontSize: "14px",
          width: "100%",
        });

        copyBtn.addEventListener("click", () => {
          navigator.clipboard.writeText(translated.trim()).then(() => {
            translationEl.style.display = "none";
            translationEl.innerHTML = "";
          }).catch((err) => {
            console.error("Ошибка при копировании:", err);
            translationEl.textContent = "❌ Ошибка при копировании.";
          });
        });

        translationEl.appendChild(textDiv);
        translationEl.appendChild(copyBtn);
      } catch (e) {
        translationEl.textContent = `❌ Ошибка при переводе: ${e.message}`;
        console.error("AddTranslateButtons error:", e);
      }
    });

    tweetEl.parentElement?.appendChild(btn);
  });
}

// Вызов функции для добавления кнопок перевода в интервале
setInterval(() => {
  addTranslateButtonsToTweets();
}, 3000);