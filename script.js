document.addEventListener('DOMContentLoaded', () => {
    const mathProblemDiv = document.getElementById('math-problem');
    const userAnswerInput = document.getElementById('user-answer');
    const submitAnswerBtn = document.getElementById('submit-answer');
    const resultDiv = document.getElementById('result');
    const easyBtn = document.getElementById('easy-btn');
    const mediumBtn = document.getElementById('medium-btn');
    const hardBtn = document.getElementById('hard-btn');

    let currentExpression = '';
    let correctAnswer = null;
    let currentDifficulty = 'easy'; // По умолчанию

    // Функция для генерации примера (аналог из Python)
    function generateExpression(difficulty) {
        let a, b, c, op1, op2, expression, answer;

        if (difficulty === 'easy') {
            a = Math.floor(Math.random() * 20) + 1;
            b = Math.floor(Math.random() * 20) + 1;
            op1 = Math.random() < 0.5 ? '+' : '-';
            expression = `${a} ${op1} ${b}`;
            answer = op1 === '+' ? a + b : a - b;
        } else if (difficulty === 'medium') {
            a = Math.floor(Math.random() * 10) + 1;
            b = Math.floor(Math.random() * 10) + 1;
            op1 = Math.random() < 0.5 ? '*' : '/';
            if (op1 === '/') {
                // Убедимся, что деление будет без остатка
                let temp = a * b;
                expression = `${temp} / ${a}`;
                answer = b;
            } else {
                expression = `${a} ${op1} ${b}`;
                answer = a * b;
            }
        } else { // hard
            a = Math.floor(Math.random() * 10) + 1;
            b = Math.floor(Math.random() * 10) + 1;
            c = Math.floor(Math.random() * 10) + 1;
            op1 = Math.random() < 0.5 ? '+' : '-';
            op2 = Math.random() < 0.5 ? '*' : '/';

            if (op2 === '/') {
                 // Убедимся, что деление будет без остатка
                let temp = a * b;
                expression = `${temp} / ${a} ${op1} ${c}`;
                // Важно: порядок операций в eval учитывается
                answer = op1 === '+' ? b + c : b - c;
            } else {
                expression = `${a} ${op2} ${b} ${op1} ${c}`;
                 // Важно: порядок операций в eval учитывается
                answer = op1 === '+' ? (op2 === '*' ? a * b : a / b) + c : (op2 === '*' ? a * b : a / b) - c;
                 if (op2 === '/' && a % b !== 0) { // Избегаем деления с остатком в простых случаях
                      return generateExpression(difficulty); // Перегенерируем, если деление не целое
                 }
            }
             // Используем eval для точного вычисления, но будьте осторожны с eval в реальных проектах
            try {
                 answer = eval(expression);
            } catch (e) {
                 console.error("Ошибка при вычислении выражения:", expression, e);
                 return generateExpression(difficulty); // Повторная генерация при ошибке eval
            }
        }

        currentExpression = expression;
        correctAnswer = answer;

        mathProblemDiv.textContent = `${expression} = ?`;
        userAnswerInput.value = '';
        resultDiv.textContent = '';
        resultDiv.className = 'result'; // Очищаем классы результата
    }

    // Обработчики кнопок сложности
    easyBtn.addEventListener('click', () => {
        currentDifficulty = 'easy';
        generateExpression(currentDifficulty);
    });

    mediumBtn.addEventListener('click', () => {
        currentDifficulty = 'medium';
        generateExpression(currentDifficulty);
    });

    hardBtn.addEventListener('click', () => {
        currentDifficulty = 'hard';
        generateExpression(currentDifficulty);
    });

    // Обработчик кнопки ответа
    submitAnswerBtn.addEventListener('click', () => {
        const userAnswer = parseFloat(userAnswerInput.value);

        if (isNaN(userAnswer)) {
            resultDiv.textContent = 'Пожалуйста, введите число.';
            resultDiv.className = 'result incorrect';
            return;
        }

        // Проверка ответа с допуском для дробных чисел
        const isCorrect = Math.abs(userAnswer - correctAnswer) < 0.0001;

        if (isCorrect) {
            resultDiv.textContent = '✅ Правильно! Молодец!';
            resultDiv.className = 'result correct';
            // Генерируем новый пример после правильного ответа
            setTimeout(() => generateExpression(currentDifficulty), 1500); // Пауза перед новым примером
        } else {
            resultDiv.textContent = `❌ Неправильно. Правильный ответ: ${correctAnswer}`;
            resultDiv.className = 'result incorrect';
            // Можете решить, генерировать ли новый пример или дать еще попытку
            // Для простоты, генерируем новый пример после неправильного ответа тоже
            setTimeout(() => generateExpression(currentDifficulty), 2000); // Пауза
        }
    });

    // Позволяем отправлять ответ по Enter
    userAnswerInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            submitAnswerBtn.click();
        }
    });

    // Инициализация при загрузке (можно сгенерировать первый пример или ждать выбора)
    // generateExpression(currentDifficulty); // Можно раскомментировать для генерации при загрузке

});