const path = require("path");
const fs = require("fs");
var appRoot = require('app-root-path');
const { runQunitPuppeteer, printOutput, printFailedTests } = require("node-qunit-puppeteer");

/*
runQunitPuppeteer -  Открывает указанную HTML-страницу в кукловоде Chromium и фиксирует результаты тестового прогона.
Возвращает объект с информацией о каждом запуске модуля / теста.
printOutput -  Принимает вывод runQunitPuppeteer и выводит его на консоль с идентификатором и цветами.
printFailedTests - Получает вывод runQunitPuppeteer и выводит на консоль информацию о неудавшихся тестах с идентификацией и цветами.
*/
const qunitArgs = {
  // Путь к набору тестов
  targetUrl: `file://${path.join(appRoot.path, "test.html")}`,
  // (необязательно, по умолчанию 30000) глобальный тайм-аут для набора тестов
  timeout: 10000,
  // (необязательно, по умолчанию false) должна ли консоль браузера перенаправляться или нет
  redirectConsole: true
};

let a = runQunitPuppeteer(qunitArgs)
  .then(result => {
    //  Выводим результат теста
    printOutput(result, console);
    // JSON
    fs.writeFileSync("testReport.json", JSON.stringify(result, null, 2), (err) => {
      if (err) throw err;
      console.log('Data written to file');
    });

    if (result.stats.failed > 0) {
      printFailedTests(result, console);
      // Обработка неудачного тестового запуска
    }
  })
  .catch(ex => {
    console.error(ex);
  });