// Убедитесь, что скрипт загружается после Telegram WebApp API
// <script src="https://telegram.org/js/telegram-web-app.js"></script>
// в вашем index.html перед script.js

document.addEventListener('DOMContentLoaded', () => {
    // Проверяем, доступен ли Telegram WebApp API
    if (!window.Telegram || !Telegram.WebApp) {
        console.error("Telegram WebApp API not found!");
        // Можно показать сообщение пользователю или отключить функционал WebApp
        document.body.innerHTML = "Ошибка загрузки приложения. Попробуйте открыть через Telegram.";
        return;
    }

    Telegram.WebApp.ready(); // Инициализируем WebApp

    const mathProblemDiv = document.getElementById('math-problem');
    const userAnswerInput = document.getElementById('user-answer');
    const submitAnswerBtn = document.getElementById('submit-answer');
    const resultDiv = document.getElementById('result');
    const problemButtons = document.querySelectorAll('.problem-btn'); // Выбираем все кнопки с номером задания

    let currentProblemNumber = null;
    let currentExpression = '';
    let correctAnswer = null;
    let isFetchingProblem = false; // Флаг для предотвращения множественных запросов

    // Функция для запроса примера у бота по номеру задания
    function requestProblem(problemNumber) {
        if (isFetchingProblem) return; // Если уже идет запрос, игнорируем

        currentProblemNumber = problemNumber;
        isFetchingProblem = true;
        mathProblemDiv.textContent = `Загрузка примера для №${problemNumber}...`;
        resultDiv.textContent = '';
        resultDiv.className = 'result';
        userAnswerInput.value = '';
        submitAnswerBtn.disabled = true; // Отключаем кнопку, пока ждем ответ

        // Отправляем команду боту через WebApp API
        // Данные должны быть JSON строкой
        const data = JSON.stringify({
            command: "generate_math_problem",
            problem_number: problemNumber
        });
        // Telegram.WebApp.sendData() отправляет данные в поле web_app_data сообщения
        Telegram.WebApp.sendData(data);
        console.log(`Отправлен запрос боту для задания №${problemNumber}`);
    }

    // Обработчик данных, пришедших от бота
    // bot.answer_web_app_query() отправляет данные обратно в WebApp в виде объекта, доступного через Telegram.WebApp.onEvent('messageData', ...)
    Telegram.WebApp.onEvent('messageData', (event) => {
        isFetchingProblem = false; // Снимаем флаг загрузки

        try {
            const responseData = JSON.parse(event.data); // event.data содержит строку, отправленную ботом
            console.log("Получены данные от бота:", responseData);

            if (responseData.status === "success") {
                currentExpression = responseData.expression;
                correctAnswer = parseFloat(responseData.answer); // Парсим ответ как число

                 if (isNaN(correctAnswer)) {
                     // Если ответ не удалось распарсить как число
                      mathProblemDiv.textContent = `Ошибка генерации примера №${currentProblemNumber}. Попробуйте еще раз.`;
                      resultDiv.textContent = `Не удалось получить числовой ответ от AI. Raw: ${responseData.raw_deepseek_response || 'N/A'}`;
                      resultDiv.className = 'result incorrect';
                      userAnswerInput.value = '';
                      submitAnswerBtn.disabled = false; // Включаем кнопку, чтобы можно было запросить еще раз

                 } else {
                    mathProblemDiv.textContent = `${currentExpression} = ?`;
                    resultDiv.textContent = '';
                    resultDiv.className = 'result';
                    userAnswerInput.value = '';
                    submitAnswerBtn.disabled = false; // Включаем кнопку ответа
                 }


            } else {
                // Обработка ошибки от бота
                mathProblemDiv.textContent = `Ошибка: ${responseData.message}`;
                resultDiv.textContent = 'Не удалось загрузить пример.';
                resultDiv.className = 'result incorrect';
                submitAnswerBtn.disabled = true;
            }

        } catch (e) {
            console.error("Ошибка обработки данных от бота:", e);
            mathProblemDiv.textContent = 'Ошибка: Неверный формат данных от бота.';
            resultDiv.textContent = '';
            resultDiv.className = 'result incorrect';
            submitAnswerBtn.disabled = true;
        }
    });


    // Обработчики кнопок номера задания
    problemButtons.forEach(button => {
        button.addEventListener('click', () => {
            const problemNumber = button.getAttribute('data-problem-number');
            requestProblem(problemNumber);
        });
    });

    // Обработчик кнопки ответа
    submitAnswerBtn.addEventListener('click', () => {
        const userAnswer = parseFloat(userAnswerInput.value);

        if (isNaN(userAnswer)) {
            resultDiv.textContent = 'Пожалуйста, введите числовой ответ!'; // Уточняем, что нужен числовой ответ
            resultDiv.className = 'result incorrect';
            return;
        }

        if (currentExpression && correctAnswer !== null && !isNaN(correctAnswer)) { // Проверяем, что пример и ответ корректны
             // Проверка ответа с допуском для дробных чисел (например, для ответов типа 0.5)
            const tolerance = 0.0001;
            const isCorrect = Math.abs(userAnswer - correctAnswer) < tolerance;

            if (isCorrect) {
                resultDiv.textContent = '✅ Правильно! Молодец!';
                resultDiv.className = 'result correct';
                 // Можно запросить новый пример после правильного ответа
                // Используем текущий номер задания
                setTimeout(() => requestProblem(currentProblemNumber), 1500);
            } else {
                resultDiv.textContent = `❌ Неправильно. Правильный ответ: ${correctAnswer}`;
                resultDiv.className = 'result incorrect';
                // Можете решить, запрашивать ли новый пример или дать еще попытку
                // Для простоты, запрашиваем новый пример
                setTimeout(() => requestProblem(currentProblemNumber), 2000);
            }
        } else {
            resultDiv.textContent = 'Сначала сгенерируйте пример, выбрав номер задания!';
            resultDiv.className = 'result';
        }
    });

    // Позволяем отправлять ответ по Enter
    userAnswerInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !submitAnswerBtn.disabled) {
            event.preventDefault(); // Предотвращаем стандартное действие Enter (отправку формы, если есть)
            submitAnswerBtn.click();
        }
    });

    // Начальное состояние
    mathProblemDiv.textContent = 'Выберите номер задания выше, чтобы получить пример.';
    submitAnswerBtn.disabled = true; // Отключаем кнопку ответа по умолчанию

});
