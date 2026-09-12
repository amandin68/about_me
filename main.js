/* ==========================================================================
   Переключатель языка.

   Оба перевода лежат прямо в HTML, в соседних элементах с атрибутом
   data-lang. Переключение — это смена одного атрибута lang у <html>:
   дальше всё делает CSS, показывая нужную половину и пряча вторую.
   Никакой перезагрузки и никаких отдельных страниц.
   ========================================================================== */

(function () {
  'use strict';

  var buttons = document.querySelectorAll('[data-set-lang]');
  if (!buttons.length) return;

  function apply(lang) {
    document.documentElement.lang = lang;

    // Заголовок вкладки и описание для поисковиков живут в <head>, в CSS их
    // не спрячешь — меняем вручную из data-атрибутов на <body>.
    var title = document.body.getAttribute('data-title-' + lang);
    if (title) document.title = title;

    var desc = document.body.getAttribute('data-desc-' + lang);
    var meta = document.querySelector('meta[name="description"]');
    if (desc && meta) meta.setAttribute('content', desc);

    buttons.forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-set-lang') === lang));
    });

    try {
      localStorage.setItem('lang', lang);
    } catch (e) { /* хранение запрещено — просто не запоминаем выбор */ }
  }

  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      apply(b.getAttribute('data-set-lang'));
    });
  });

  // Язык уже выставлен в lang-init.js — здесь только приводим в
  // соответствие вид кнопок и заголовок вкладки.
  apply(document.documentElement.lang === 'en' ? 'en' : 'ru');
}());


/* Плавное появление блоков при прокрутке.

   Принцип: страница обязана быть читаемой без скрипта. Поэтому в CSS блоки
   видны по умолчанию, а прятать их разрешено только при классе .js —
   который вешается здесь, первой же строкой. Если файл не загрузился или
   JS отключён, посетитель просто увидит обычную статичную страницу,
   а не пустой экран.                                                      */

(function () {
  'use strict';

  var items = document.querySelectorAll('.reveal');

  // Браузер слишком старый для наблюдателя — оставляем всё видимым.
  if (!('IntersectionObserver' in window) || !items.length) return;

  // Пользователь просил в системе уменьшить движение — уважаем и выходим.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.documentElement.classList.add('js');

  /* IntersectionObserver — встроенный в браузер наблюдатель: он сам
     сообщает, когда элемент показался на экране. Дешевле и точнее,
     чем слушать событие скролла и считать координаты вручную.            */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      io.unobserve(entry.target);   // показали один раз — дальше не следим
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  items.forEach(function (el, i) {
    // Небольшая задержка по порядку — соседние блоки появляются каскадом.
    el.style.transitionDelay = (i % 4) * 70 + 'ms';
    io.observe(el);
  });

  /* Страховка. Наблюдатель может не отдать события, а переход — не проиграться
     (вкладка в фоне, энергосбережение, необычное окружение). Анимация здесь
     украшение, а текст обязателен, поэтому через полторы секунды снимаем
     класс .js целиком: правило, которое прячет блоки, просто перестаёт
     действовать — мгновенно и без всякого перехода.                        */
  setTimeout(function () {
    var stuck = false;

    items.forEach(function (el) {
      // Случай первый: наблюдатель не сработал — класс так и не появился.
      if (!el.classList.contains('is-visible')) { stuck = true; return; }

      // Случай второй: класс есть, но переход не проигрался и блок всё ещё
      // прозрачный. Так бывает, когда вкладка не отрисовывается.
      var r = el.getBoundingClientRect();
      var onScreen = r.top < window.innerHeight && r.bottom > 0;
      if (onScreen && getComputedStyle(el).opacity === '0') stuck = true;
    });

    if (stuck) document.documentElement.classList.remove('js');
  }, 2000);
}());
