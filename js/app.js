(function () {
  const t = key => I18N.t(key);
  const cap = value => value.split('_').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');

  const STATUS_CLASS = {
    awaiting: '',
    scheduled: 'info',
    sealed: 'warn',
    dispatched: '',
    picked_up: '',
    in_transit: '',
    lab_received: '',
    analysed: '',
    results_ready: 'ok',
    rejected_sla: 'danger',
    rejected_seal: 'danger'
  };

  const PARAMS = [
    ['volume', 'ml', 1.5],
    ['concentration', 'milPerMl', 15],
    ['count', 'milTotal', 39],
    ['totalMotility', 'percent', 40],
    ['progressiveMotility', 'percent', 32],
    ['morphology', 'percent', 4],
    ['velocity', 'umPerS', 25]
  ];

  const STEPS = ['awaiting', 'scheduled', 'dispatched', 'picked_up', 'in_transit', 'lab_received', 'analysed', 'results_ready'];

  const QUIZ = [
    ['quizQ1', [['quizQ1NotTrying', 0], ['quizQ1UnderYear', 0], ['quizQ1OneToTwo', 2], ['quizQ1OverTwo', 3]]],
    ['quizQ2', [['quizQ2Under30', 0], ['quizQ2Thirties', 1], ['quizQ2Forties', 2], ['quizQ2Fifties', 3]]],
    ['quizQ3', [['quizQ3Never', 0], ['quizQ3Quit', 1], ['quizQ3Current', 2]]],
    ['quizQ4', [['quizQ4None', 0], ['quizQ4Some', 1], ['quizQ4Often', 2]]],
    ['quizQ5', [['quizQ5None', 0], ['quizQ5Yes', 3], ['quizQ5Unsure', 1]]],
    ['quizQ6', [['quizQ6No', 0], ['quizQ6Yes', 1]]]
  ];

  const EMIRATES = [
    ['Dubai', 'دبي'], ['Abu Dhabi', 'أبوظبي'], ['Sharjah', 'الشارقة'],
    ['Ajman', 'عجمان'], ['Ras Al Khaimah', 'رأس الخيمة'],
    ['Fujairah', 'الفجيرة'], ['Umm Al Quwain', 'أم القيوين']
  ];

  let role = 'patient';
  let screen = 'welcome';
  let selectedId = null;
  let labSelection = null;
  let learnReturn = 'welcome';
  let quizIndex = 0;
  let quizAnswers = [];

  const view = document.getElementById('view');
  const notice = document.getElementById('notice');
  const langToggle = document.getElementById('langToggle');

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
  }

  function showNotice(text) {
    const target = role === 'patient' ? document.getElementById('patientFeedback') : notice;
    target.hidden = false;
    target.textContent = text;
  }

  function icon(name) {
    const paths = {
      lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
      shield: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/>',
      home: '<path d="M4 11l8-7 8 7"/><path d="M6 10v9h12v-9"/>',
      box: '<path d="M4 8l8-4 8 4v9l-8 4-8-4z"/><path d="M4 8l8 4 8-4M12 12v9"/>',
      user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
      arrowLeft: '<path d="M15 5l-7 7 7 7"/>',
      pin: '<path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
      clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',
      play: '<circle cx="12" cy="12" r="9"/><path d="M10 8l6 4-6 4z"/>',
      book: '<path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z"/><path d="M8 7h8M8 11h6"/>',
      check: '<path d="M5 12l4 4L19 6"/>',
      qr: '<rect x="4" y="4" width="6" height="6"/><rect x="14" y="4" width="6" height="6"/><rect x="4" y="14" width="6" height="6"/><path d="M14 14h3v3h-3zM19 19h2v2h-2z"/>',
      logout: '<path d="M10 5H5v14h5"/><path d="M14 8l4 4-4 4M9 12h9"/>'
    };
    return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (paths[name] || '') + '</svg>';
  }

  function qrSvg(seed) {
    const n = 21;
    const cell = 6;
    let hash = 0;
    for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    const cells = [];
    const inFinder = (r, c) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        let on = false;
        if (inFinder(r, c)) {
          const rr = r < 7 ? r : r - (n - 7);
          const cc = c < 7 ? c : c - (n - 7);
          on = rr === 0 || rr === 6 || cc === 0 || cc === 6 || (rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4);
        } else {
          hash = (hash * 1664525 + 1013904223) >>> 0;
          on = (hash >>> 16) % 2 === 0;
        }
        if (on) cells.push('<rect x="' + (c * cell) + '" y="' + (r * cell) + '" width="' + cell + '" height="' + cell + '"/>');
      }
    }
    return '<svg class="qr" viewBox="0 0 ' + (n * cell) + ' ' + (n * cell) + '" xmlns="http://www.w3.org/2000/svg" aria-label="' + esc(seed) + '"><rect width="100%" height="100%" fill="#fff"/>' + cells.join('') + '</svg>';
  }

  function fmtTime(iso) {
    if (!iso) return '-';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function fmtDate(iso) {
    return new Intl.DateTimeFormat(I18N.current === 'ar' ? 'ar-AE' : 'en-AE', {
      dateStyle: 'medium', timeZone: 'Asia/Dubai'
    }).format(new Date(iso));
  }

  function statusChip(sample) {
    return '<span class="chip ' + (STATUS_CLASS[sample.status] || '') + '">' + t('status' + cap(sample.status)) + '</span>';
  }

  function field(id, label, type, value, placeholder) {
    const attrs = type === 'number' ? ' min="0" max="30"' : '';
    return '<div class="field"><label for="' + id + '">' + esc(label) + '</label>' +
      '<input id="' + id + '" type="' + type + '" value="' + esc(value || '') + '" placeholder="' + esc(placeholder || '') + '"' + attrs + '></div>';
  }

  function selectField(id, label, options, value) {
    return '<div class="field"><label for="' + id + '">' + esc(label) + '</label><select id="' + id + '">' +
      options.map(([optionValue, optionLabel]) =>
        '<option value="' + esc(optionValue) + '"' + (optionValue === value ? ' selected' : '') + '>' + esc(optionLabel) + '</option>'
      ).join('') + '</select></div>';
  }

  function textArea(id, label, value, placeholder) {
    return '<div class="field"><label for="' + id + '">' + esc(label) + '</label>' +
      '<textarea id="' + id + '" rows="3" placeholder="' + esc(placeholder || '') + '">' + esc(value || '') + '</textarea></div>';
  }

  function emirateOptions() {
    return EMIRATES.map(entry => [entry[0], I18N.current === 'ar' ? entry[1] : entry[0]]);
  }

  function formatAddress(profile) {
    if (!profile) return '';
    return [profile.addressLine1, profile.addressLine2, profile.city, profile.emirate, profile.postcode, profile.country]
      .filter(Boolean).join(', ');
  }

  function reachedStep(sample) {
    const index = STEPS.indexOf(sample.status);
    if (index !== -1) return index;
    if (sample.publishedAt || sample.status === 'results_ready') return 7;
    if (sample.labReceivedAt || sample.status === 'lab_received') return 5;
    if (sample.pickedUpAt || sample.status === 'picked_up') return 3;
    if (sample.collectedAt || sample.dispatchedAt || sample.status === 'dispatched') return 2;
    if (sample.delivery || sample.status === 'scheduled') return 1;
    return 0;
  }

  function timeline(sample) {
    const reached = sample.status === 'analysed' && role === 'patient' ? STEPS.indexOf('lab_received') : reachedStep(sample);
    const rejected = sample.status.indexOf('rejected') === 0;
    let html = '<ol class="timeline">';
    STEPS.forEach((step, index) => {
      let cls = '';
      if (role === 'patient' && ['awaiting', 'analysed'].includes(step)) return;
      if (index < reached) cls = 'done';
      else if (index === reached) cls = rejected ? 'done' : (index === STEPS.length - 1 ? 'done' : 'current');
      html += '<li class="' + cls + '"' + (cls === 'current' ? ' aria-current="step"' : '') +
        '>' + t('status' + cap(step)) + '</li>';
    });
    if (rejected) html += '<li class="bad">' + t('status' + cap(sample.status)) + '</li>';
    return html + '</ol>';
  }

  function slaBox(sample) {
    const info = Store.sla(sample);
    if (!info) return '';
    if (sample.labReceivedAt || ['lab_received', 'analysed', 'results_ready', 'rejected_sla', 'rejected_seal'].includes(sample.status)) return '';
    const cls = info.breached ? 'bad' : info.remaining < 15 * 60 * 1000 ? 'warn' : '';
    const text = info.breached ? t('breachedLabel') : t('countdownLabel') + ': ' + Store.fmtDuration(info.remaining);
    return '<div class="sla ' + cls + '" data-countdown="' + esc(sample.id) + '">' + icon('clock') + '<span>' + text + '</span></div>';
  }

  function labLateness(sample) {
    if (!sample.labReceivedAt || !sample.collectedAt) return 0;
    return Date.parse(sample.labReceivedAt) - Date.parse(sample.collectedAt);
  }

  function patientSamples(user) {
    if (!user) return [];
    return Store.data.samples.filter(sample => sample.patientId === user.id);
  }



  function gateScreen() {
    const user = Store.currentUser();
    if (!user) return ['welcome', 'signup', 'login', 'learn', 'quiz', 'quizResult'].indexOf(screen) !== -1 ? screen : 'welcome';
    if (!user.consent) return 'consent';
    if (!Store.profileComplete(user)) return 'profile';
    return ['home', 'results', 'orders', 'prepare', 'learn', 'quiz', 'quizResult', 'profile', 'order', 'delivery', 'sample', 'report'].indexOf(screen) !== -1 ? screen : 'home';
  }

  function go(next, id) {
    if (next !== 'quiz' && next !== 'quizResult') clearQuiz();
    screen = next;
    if (id) selectedId = id;
    render();
  }

  function screenMeta(current, user) {
    const map = {
      welcome: { title: t('welcomeTitle'), sub: '' },
      results: { title: t('navResults'), sub: t('reportListIntro') },
      prepare: { title: t('prepareTitle'), sub: '', back: true },
      signup: { title: t('signupTitle'), sub: t('signupSub') },
      login: { title: t('loginTitle'), sub: t('loginSub') },
      consent: { title: t('consentTitle'), sub: t('consentSub') },
      profile: {
        title: t('profileTitle'),
        sub: user && Store.profileComplete(user) ? t('profileEditSub') : t('profileSetupSub'),
        back: !!(user && Store.profileComplete(user))
      },
      home: {
        title: t('patientHome'),
        sub: t('homeSub')
      },
      orders: { title: t('navSamples'), sub: t('ordersSub') },
      learn: { title: t('learnTitle'), sub: user ? t('learnSub') : t('learnGuestSub'), back: true },
      quiz: { title: t('quizTitle'), sub: t('quizSub'), back: true },
      quizResult: { title: t('quizResultTitle'), sub: t('quizResultSub'), back: true },
      order: { title: t('orderTitle'), sub: t('orderIntro'), back: true },
      delivery: { title: t('deliveryTitle'), sub: t('deliverySub'), back: true },
      sample: { title: t('trackSample'), sub: t('trackSampleSub'), back: true },
      report: { title: t('reportTitle'), sub: t('reportIntro'), back: true }
    };
    return map[current] || map.home;
  }

  function appHeader(meta) {
    return '<header class="app-header">' +
      '<div class="app-header-row">' +
        '<div class="app-brand"><span class="app-mark">' + icon('shield') +
        '</span><div class="app-brand-text"><strong>' + t('brand') + '</strong></div></div>' +
        '<button class="icon-btn" type="button" data-action="lang" aria-label="' + t('language') + '">' +
        (I18N.current === 'en' ? 'ع' : 'EN') + '</button>' +
      '</div>' +
      '<div class="app-heading">' +
        (meta.back ? '<button class="back-btn" type="button" data-action="back" aria-label="' + t('back') + '">' + icon('arrowLeft') + '</button>' : '') +
        '<div><h1 tabindex="-1">' + esc(meta.title) + '</h1></div>' +
      '</div>' +
      (meta.sub ? '<p class="screen-sub">' + esc(meta.sub) + '</p>' : '') +
      '</header>';
  }

  function appNav(current, guest) {
    const active = current === 'report' ? 'results'
      : ['orders', 'sample', 'order', 'delivery', 'prepare', 'learn', 'quiz', 'quizResult'].includes(current) ? 'home' : current;
    const items = guest
      ? [['learn', 'navLearn', 'play'], ['login', 'navSignIn', 'lock'], ['signup', 'navSignUp', 'user']]
      : [['home', 'navHome', 'home'], ['results', 'navResults', 'book'], ['profile', 'navProfile', 'user']];
    return '<nav class="app-nav">' + items.map(([key, label, glyph]) =>
      '<button type="button" class="nav-item ' + (active === key ? 'active' : '') + '" data-action="goto-' + key + '"' +
      (active === key ? ' aria-current="page"' : '') + '>' +
      icon(glyph) + '<span>' + t(label) + '</span></button>'
    ).join('') + '</nav>';
  }

  function patientButton(action, label, id, style = 'primary') {
    return '<button class="btn ' + style + ' block" type="button" data-action="' + action + '"' +
      (id ? ' data-id="' + esc(id) + '"' : '') + '>' + t(label) + '</button>';
  }

  function privacyDetails() {
    return '<details class="privacy-panel"><summary>' + t('privacyTitle') + '</summary>' +
      '<p>' + t('privacyCourier') + '</p><p>' + t('privacyLab') + '</p><p>' + t('privacyReport') +
      '</p><p class="hint">' + t('demoPrivacy') + '</p></details>';
  }

  function welcomeScreen() {
    return '<div class="screen"><section class="welcome-card"><span class="welcome-symbol">' + icon('shield') +
      '</span><h2>' + t('welcomeHeadline') + '</h2><p>' + t('welcomeBody') + '</p>' +
      patientButton('goto-learn', 'explorePrivately') + patientButton('goto-signup', 'bookHome', null, 'soft') +
      '<button class="link" type="button" data-action="goto-login">' + t('navSignIn') + '</button>' +
      '</section>' + privacyDetails() + '</div>';
  }

  function signupScreen() {
    return '<div class="screen auth-screen">' +
      '<p class="demo-disclosure">' + t('demoPrivacy') + '</p>' +
      '<div class="form-card">' +
        field('su-name', t('fullNameLabel'), 'text', '', 'Ahmed Al Mansoori') +
        field('su-email', t('emailLabel'), 'email', '', 'name@example.com') +
        field('su-phone', t('phoneLabel'), 'tel', '', '+971 50 123 4567') +
        field('su-password', t('passwordLabel'), 'password', '', '') +
        '<p class="hint">' + t('passwordHint') + '</p>' +
        '<button class="btn primary block" type="button" data-action="signup">' + t('signupBtn') + '</button>' +
        '<p class="switch-line">' + t('haveAccount') + ' <button class="link" type="button" data-action="goto-login">' + t('signinLink') + '</button></p>' +
      '</div>' +
      '<button class="link quiet learn-entry" type="button" data-action="goto-learn">' + t('learnFirstLink') + '</button>' +
      '</div>';
  }

  function loginScreen() {
    return '<div class="screen auth-screen">' +
      '<p class="demo-disclosure">' + t('demoPrivacy') + '</p>' +
      '<div class="form-card">' +
        field('li-email', t('emailLabel'), 'email', Store.data.pendingEmail || '', 'name@example.com') +
        field('li-password', t('passwordLabel'), 'password', '', '') +
        '<p class="hint">' + t('loginHint') + '</p>' +
        '<button class="btn primary block" type="button" data-action="login">' + t('loginBtn') + '</button>' +
        '<p class="switch-line">' + t('noAccount') + ' <button class="link" type="button" data-action="goto-signup">' + t('signupLink') + '</button></p>' +
      '</div>' +
      '<section class="demo-card">' +
        '<div class="demo-card-head">' + icon('play') + '<strong>' + t('demoTitle') + '</strong></div>' +
        '<p>' + t('demoBody') + '</p>' +
        '<div class="demo-credentials">' +
          '<div><span>' + t('emailLabel') + '</span><b class="mono">' + esc(DEMO_ACCOUNT.email) + '</b></div>' +
          '<div><span>' + t('passwordLabel') + '</span><b class="mono">' + esc(DEMO_ACCOUNT.password) + '</b></div>' +
        '</div>' +
        '<button class="btn soft block" type="button" data-action="demo-login">' + t('demoLoginBtn') + '</button>' +
      '</section>' +
      '<button class="link quiet learn-entry" type="button" data-action="goto-learn">' + t('learnFirstLink') + '</button>' +
      '</div>';
  }

  function consentScreen() {
    const items = [
      ['consentCollection', 'collection'],
      ['consentCourier', 'courier'],
      ['consentLab', 'lab'],
      ['consentData', 'data']
    ];
    return '<div class="screen">' +
      '<div class="form-card">' +
      items.map(([label, key]) =>
        '<label class="consent-item">' + icon('shield') + '<span>' + t(label) + '</span>' +
        '<input type="checkbox" data-consent="' + key + '"></label>'
      ).join('') +
      '<button class="btn primary block" type="button" data-action="consent">' + t('consentAgree') + '</button>' +
      '<p class="hint">' + t('consentNote') + '</p>' + privacyDetails() +
      '<button class="link quiet" type="button" data-action="logout">' + t('logout') + '</button>' +
      '</div></div>';
  }

  function profileScreen(user, setup) {
    const profile = user.profile || {};
    return '<div class="screen">' +
      '<div class="form-card">' +
        field('pf-name', t('fullNameLabel'), 'text', profile.fullName || user.name, '') +
        field('pf-phone', t('phoneLabel'), 'tel', profile.phone || user.phone, '') +
        field('pf-email', t('emailLabel'), 'email', profile.email || user.email, '') +
        '<div class="divider"></div>' +
        textArea('pf-a1', t('addressLine1'), profile.addressLine1, '') +
        field('pf-a2', t('addressLine2'), 'text', profile.addressLine2, '') +
        field('pf-city', t('cityLabel'), 'text', profile.city, '') +
        selectField('pf-emirate', t('emirateLabel'), emirateOptions(), profile.emirate || 'Dubai') +
        field('pf-postcode', t('postcodeLabel'), 'text', profile.postcode, '') +
        field('pf-country', t('countryLabel'), 'text', profile.country || 'United Arab Emirates', '') +
        field('pf-notes', t('deliveryNotesLabel'), 'text', profile.deliveryNotes, '') +
        '<button class="btn primary block" type="button" data-action="save-profile">' + t(setup ? 'saveProfile' : 'saveChanges') + '</button>' +
        '<p class="hint">' + t('profileNote') + '</p>' +
        '<div class="profile-links">' +
        '<button class="link quiet" type="button" data-action="logout">' + t('logout') + '</button>' +
        '<button class="link quiet" type="button" data-action="reset">' + t('resetBtn') + '</button>' +
        '</div>' +
      '</div>' + privacyDetails() + '</div>';
  }

  function patientHistory(user) {
    return patientSamples(user).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }

  function homeScreen() {
    const history = patientHistory(Store.currentUser());
    const sample = history.find(item => ['awaiting', 'scheduled'].includes(item.status)) ||
      history.find(item => !['rejected_sla', 'rejected_seal', 'results_ready'].includes(item.status)) || history[0];
    const actions = {
      awaiting: ['goto-delivery', 'choosePickup', 'awaitingNext'],
      scheduled: ['goto-prepare', 'prepareTitle', 'scheduledNext'],
      lab_received: ['open-sample', 'trackSample', 'reviewNext'],
      analysed: ['open-sample', 'trackSample', 'reviewNext'],
      results_ready: ['open-report', 'openReport', 'resultsNext'],
      rejected_sla: ['open-sample', 'seeWhatHappened', 'lateNext'],
      rejected_seal: ['open-sample', 'seeWhatHappened', 'sealNext']
    };
    const [action, label, detail] = sample
      ? actions[sample.status] || ['open-sample', 'trackSample', 'trackingNext']
      : ['goto-order', 'bookHome', 'bookingNext'];
    return '<div class="screen"><section class="journey-card">' +
      '<span class="journey-icon">' + icon('box') + '</span>' +
      '<h2>' + (sample ? t('status' + cap(sample.status)) : t('bookingTitle')) + '</h2><p>' + t(detail) + '</p>' +
      (sample ? slaBox(sample) : '') + patientButton(action, label, sample && sample.id) +
      '</section><div class="patient-links">' +
      '<button class="action-tile" type="button" data-action="goto-learn"><span class="tile-icon">' +
      icon('book') + '</span><strong>' + t('navLearn') + '</strong><span class="tile-arrow">›</span></button>' +
      '<button class="action-tile" type="button" data-action="goto-orders"><span class="tile-icon">' +
      icon('box') + '</span><strong>' + t('navSamples') + '</strong><span class="tile-arrow">›</span></button>' +
      '</div>' + privacyDetails() + '</div>';
  }

  function resultsScreen(user) {
    const reports = patientHistory(user).filter(sample => sample.status === 'results_ready');
    return '<div class="screen">' + (reports.length ? reports.map(sample =>
      '<button class="action-tile" type="button" data-action="open-report" data-id="' + esc(sample.id) + '">' +
      '<span class="tile-icon">' + icon('book') + '</span><span><strong>' + t('reportTitle') +
      '</strong><small>' + fmtDate(sample.publishedAt || sample.createdAt) + '</small></span>' +
      '<span class="tile-arrow" aria-hidden="true">›</span></button>').join('')
      : '<div class="empty-card"><strong>' + t('noReports') + '</strong><p>' + t('reportListIntro') + '</p></div>') +
      '</div>';
  }

  function ordersScreen() {
    let html = '<div class="screen">';
    const samples = patientHistory(Store.currentUser());
    if (!samples.length) html += '<div class="empty-card">' + icon('box') + '<strong>' + t('noSamples') + '</strong></div>';
    samples.forEach(sample => {
      html += '<button class="order-row" type="button" data-action="open-sample" data-id="' + esc(sample.id) + '">' +
        '<span class="order-row-icon">' + icon('box') + '</span>' +
        '<span class="order-row-main"><span class="mono">' + esc(sample.id) + '</span><small>' + fmtTime(sample.createdAt) + '</small></span>' +
        statusChip(sample) + '</button>';
    });
    return html + patientButton('goto-order', 'bookHome') + '</div>';
  }

  function learnScreen(guest) {
    let html = '<div class="screen">' +
      '<article class="quiz-entry">' +
        '<span class="quiz-entry-icon">' + icon('check') + '</span>' +
        '<div><span class="learn-meta">' + t('quizBadge') + '</span>' +
          '<h3>' + t('quizCardTitle') + '</h3>' +
          '<p>' + t('quizCardBody') + '</p>' +
          '<button class="btn primary" type="button" data-action="goto-quiz">' + t('quizCta') + '</button>' +
        '</div></article>';
    [['privacy', 'shield'], ['custody', 'clock'], ['lab', 'check'], ['next', 'book']].forEach(([key, glyph]) => {
      html += '<article class="learn-card">' +
        '<span class="learn-thumb">' + icon(glyph) + '</span>' +
        '<div class="learn-card-body">' +
          '<span class="learn-meta">' + t('learnMeta') + '</span>' +
          '<h3>' + t('learn' + cap(key) + 'Title') + '</h3>' +
          '<p>' + t('learn' + cap(key) + 'Body') + '</p>' +
        '</div></article>';
    });
    if (guest) {
      html += '<div class="trust-card learn-guest">' + icon('shield') +
        '<div><strong>' + t('learnGuestTitle') + '</strong><p>' + t('learnGuestBody') + '</p>' +
        '<div class="actions">' +
          '<button class="btn primary" type="button" data-action="goto-signup">' + t('navSignUp') + '</button>' +
          '<button class="btn soft" type="button" data-action="goto-login">' + t('navSignIn') + '</button>' +
        '</div></div></div>';
    }
    html += '</div>';
    return html;
  }

  function quizScore() {
    return quizAnswers.reduce((total, answer, index) =>
      total + (answer == null ? 0 : QUIZ[index][1][answer][1]), 0);
  }

  function quizBand() {
    const score = quizScore();
    if (score <= 2) return 'low';
    if (score <= 6) return 'moderate';
    return 'high';
  }

  function clearQuiz() {
    quizIndex = 0;
    quizAnswers = [];
  }

  function startQuiz() {
    clearQuiz();
    go('quiz');
  }

  function quizScreen() {
    const [question, options] = QUIZ[quizIndex];
    const progress = Math.round((quizIndex / QUIZ.length) * 100);
    return '<div class="screen">' +
      '<section class="quiz-card">' +
        '<div class="quiz-progress"><span>' + t('quizStep') + ' ' + (quizIndex + 1) + ' / ' + QUIZ.length + '</span><span>' + progress + '%</span></div>' +
        '<div class="quiz-bar"><i style="width:' + progress + '%"></i></div>' +
        '<h2>' + t(question) + '</h2>' +
        '<div class="quiz-options">' + options.map(([label], index) =>
          '<button class="quiz-option' + (quizAnswers[quizIndex] === index ? ' selected' : '') + '" type="button" data-action="quiz-answer" data-value="' + index + '">' + t(label) + '</button>'
        ).join('') + '</div>' +
        '<div class="actions"><button class="btn soft" type="button" data-action="quiz-back">' +
          (quizIndex === 0 ? t('quizExit') : t('back')) + '</button></div>' +
      '</section>' +
      '<div class="trust-card">' + icon('lock') + '<div><strong>' + t('quizAnonTitle') + '</strong><p>' + t('quizAnonBody') + '</p></div></div>' +
      '</div>';
  }

  function quizResultScreen() {
    const band = quizBand();
    const user = Store.currentUser();
    return '<div class="screen">' +
      '<section class="quiz-card quiz-result">' +
        '<span class="quiz-band ' + band + '">' + t('quizBand' + cap(band)) + '</span>' +
        '<h2>' + t('quizResultHeadline' + cap(band)) + '</h2>' +
        '<p>' + t('quizResult' + cap(band) + 'Body') + '</p>' +
        '<div class="divider"></div>' +
        '<strong>' + t('quizNextTitle') + '</strong>' +
        '<p>' + t('quizNext' + cap(band)) + '</p>' +
        '<div class="actions">' +
          '<button class="btn primary" type="button" data-action="' + (user ? 'goto-order' : 'goto-signup') + '">' + t(user ? 'actionOrder' : 'navSignUp') + '</button>' +
          '<button class="btn soft" type="button" data-action="quiz-restart">' + t('quizRestart') + '</button>' +
        '</div>' +
      '</section>' +
      '<div class="trust-card">' + icon('shield') + '<div><strong>' + t('quizAnonTitle') + '</strong><p>' + t('quizResultAnonBody') + '</p></div></div>' +
      '<p class="hint">' + t('quizDisclaimer') + '</p>' +
      '</div>';
  }

  function orderScreen(user) {
    return '<div class="screen">' +
      '<div class="form-card">' +
        field('or-abstinence', t('abstinenceLabel'), 'number', '3', '') +
        '<div class="address-preview">' + icon('pin') + '<div><span>' + t('addressLabel') + '</span><strong>' + esc(formatAddress(user.profile)) + '</strong></div>' +
        '<button class="link" type="button" data-action="goto-profile">' + t('profileEditSub') + '</button></div>' +
        '<button class="btn primary block" type="button" data-action="order">' + t('orderBtn') + '</button>' +
        '<p class="hint">' + t('demoNote') + '</p>' +
      '</div></div>';
  }

  function deliveryScreen(sample, user) {
    const delivery = sample.delivery || {};
    const slots = [
      ['today', t('slotToday')],
      ['tomorrow-am', t('slotTomorrow')],
      ['tomorrow-pm', t('slotNext')]
    ];
    const selectedSlot = delivery.slot || 'today';
    return '<div class="screen">' +
      '<div class="form-card">' +
        textArea('dl-address', t('addressLabel'), delivery.address || formatAddress(user.profile), '') +
        '<div class="choice-group"><span class="choice-label">' + t('slotLabel') + '</span>' +
        slots.map(([value, label]) =>
          '<label class="choice"><input type="radio" name="slot" value="' + value + '"' + (value === selectedSlot ? ' checked' : '') + '><span>' + esc(label) + '</span></label>'
        ).join('') + '</div>' +


        field('dl-notes', t('deliveryNotes'), 'text', delivery.notes || '', '') +
        privacyDetails() + patientButton('arrange-delivery', 'confirmDelivery', sample.id) +
      '</div></div>';
  }

  function prepareScreen(sample) {
    return '<div class="screen"><section class="form-card"><ol class="prep-list">' +
      ['prepWindow', 'prepGuide', 'prepLabel'].map(key => '<li>' + t(key) + '</li>').join('') +
      '</ol><p class="mono" dir="ltr">' + esc(sample.id) + '</p><p class="hint">' + t('sealedNote') + '</p>' +
      patientButton('collect', 'sealedCta', sample.id) + '</section></div>';
  }

  function sampleScreen(sample) {
    const status = sample.status;
    let html = '<div class="screen">' +
      '<section class="id-card">' +
        '<span class="id-label">' + t('idTitle') + '</span>' +
        '<div class="id-row"><div><strong class="mono id-value">' + esc(sample.id) + '</strong>' +
        '<button class="link copy" type="button" data-action="copy-id" data-id="' + esc(sample.id) + '">' + t('copyId') + '</button></div>' +
        qrSvg(sample.id) + '</div>' +
        '<p class="hint">' + t('idNote') + '</p>' +
      '</section>' +
      '<section class="detail-card">' +
        '<div class="detail-top">' + statusChip(sample) + '<small>' + fmtTime(sample.createdAt) + '</small></div>' +
        slaBox(sample);

    if (sample.delivery) {
      html += '<div class="detail-line">' + icon('pin') + '<div><span>' + t('scheduledFor') + '</span><strong>' + esc(sample.delivery.address.split('\n')[0]) + '</strong>' +
        '<small>' + t({ today: 'slotToday', 'tomorrow-am': 'slotTomorrow', 'tomorrow-pm': 'slotNext' }[sample.delivery.slot] || 'confirmDelivery') + '</small></div></div>';
    }
    if (status === 'dispatched') {
      html += '<p class="hint">' + t('courierSimulated') + '</p>' + patientButton('pickup-help', 'pickupHelp', null, 'soft');
    }
    if (status.indexOf('rejected') === 0) {
      html += '<div class="alert danger">' + t(status === 'rejected_sla' ? 'lateNext' : 'sealNext') + '</div>' +
        patientButton('goto-order', 'bookAgain');
    }
    html += '<div class="sub-label">' + t('timelineTitle') + '</div>' + timeline(sample);

    html += '<div class="actions">';
    if (status === 'awaiting') {
      html += '<button class="btn primary" type="button" data-action="goto-delivery" data-id="' + esc(sample.id) + '">' + t('arrangeDelivery') + '</button>';
    } else if (status === 'scheduled') {
      html += patientButton('goto-prepare', 'prepareTitle', sample.id) +
        patientButton('goto-delivery', 'changePickup', sample.id, 'soft');
    } else if (status === 'results_ready') {
      html += '<button class="btn primary" type="button" data-action="open-report" data-id="' + esc(sample.id) + '">' + t('openReport') + '</button>';
    } else if (status === 'lab_received' || status === 'analysed') {
      html += '<div class="alert">' + t('waitingLab') + '</div>';
    }
    html += '</div></section></div>';
    return html;
  }

  function reportScreen(sample) {
    const results = sample.results || {};
    let cards = '';
    PARAMS.forEach(([key, unitKey, ref]) => {
      const raw = results[key];
      const value = raw === '' || raw == null ? '-' : raw;
      let cls = 'chip';
      let label = t('informational');
      if (key !== 'velocity' && raw !== '' && raw != null) {
        const numeric = Number(raw);
        if (numeric < ref) { cls = 'chip warn'; label = t('below'); }
        else if (numeric > ref && key === 'volume') { cls = 'chip warn'; label = t('above'); }
        else { cls = 'chip ok'; label = t('inRange'); }
      }
      cards += '<div class="result"><span>' + t(key) + '</span><strong>' + esc(value) + ' ' + t(unitKey) + '</strong>' +
        '<small>' + t('reference') + ' <bdi>≥ ' + ref + ' ' + t(unitKey) + '</bdi></small><div class="result-chip"><span class="' + cls + '">' + label + '</span></div></div>';
    });
    return '<div class="screen">' +
      '<div class="report-card"><p class="hint">' + fmtDate(sample.publishedAt || sample.createdAt) + '</p>' +
      '<h2>' + t('reportOverview') + '</h2><p>' + t('reportSummary') + '</p>' +
      '<details class="privacy-panel measurement-panel"><summary>' + t('measurements') +
      '</summary><div class="results-grid">' + cards + '</div></details>' +
      '<div class="safety"><strong>' + t('consultTitle') + '</strong><p>' + t('consultBody') + '</p>' +
      '<button class="btn primary" type="button" data-action="consult">' + t('consultBtn') + '</button></div>' +
      '<p class="hint">' + t('disclaimer') + '</p></div></div>';
  }

  function renderPatient(user, current) {
    const meta = screenMeta(current, user);
    const ownedSample = id => {
      const sample = id ? Store.get(id) : null;
      return sample && user && sample.patientId === user.id ? sample : null;
    };
    let body;
    if (!user) {
      body = current === 'welcome' ? welcomeScreen()
        : current === 'learn' ? learnScreen(true)
        : current === 'quiz' ? quizScreen()
        : current === 'quizResult' ? quizResultScreen()
        : current === 'login' ? loginScreen() : signupScreen();
    } else if (current === 'consent') {
      body = consentScreen();
    } else if (current === 'profile') {
      body = profileScreen(user, !Store.profileComplete(user));
    } else if (current === 'order') {
      body = orderScreen(user);
    } else if (current === 'delivery') {
      const sample = ownedSample(selectedId);
      body = sample ? deliveryScreen(sample, user) : homeScreen();
    } else if (current === 'sample') {
      const sample = ownedSample(selectedId);
      body = sample ? sampleScreen(sample) : ordersScreen();
    } else if (current === 'report') {
      const sample = ownedSample(selectedId);
      body = sample && sample.status === 'results_ready' ? reportScreen(sample) : ordersScreen();
    } else if (current === 'results') {
      body = resultsScreen(user);
    } else if (current === 'prepare') {
      const sample = ownedSample(selectedId);
      body = sample && sample.status === 'scheduled' ? prepareScreen(sample) : homeScreen();
    } else if (current === 'orders') {
      body = ordersScreen();
    } else if (current === 'learn') {
      body = learnScreen();
    } else if (current === 'quiz') {
      body = quizScreen();
    } else if (current === 'quizResult') {
      body = quizResultScreen();
    } else {
      body = homeScreen();
    }
    const nav = user && user.consent && Store.profileComplete(user)
      ? appNav(current)
      : !user && ['learn', 'quiz', 'quizResult'].indexOf(current) !== -1 ? appNav(current, true) : '';
    return '<div class="app-shell">' + appHeader(meta) +
      '<div class="app-body"><div id="patientFeedback" class="patient-feedback" role="status" hidden></div>' + body + '</div>' + nav + '</div>';
  }

  function renderDispatch() {
    let html = '<div class="page-head"><h1>' + t('dispatchTitle') + '</h1><p>' + t('dispatchIntro') + '</p></div><div class="grid">';
    const active = Store.data.samples.filter(s => ['dispatched', 'picked_up', 'in_transit'].indexOf(s.status) !== -1);
    if (!active.length) html += '<section class="card wide"><p class="empty">' + t('noDispatches') + '</p></section>';
    active.forEach(sample => {
      html += '<section class="card"><div class="sample-top"><span class="sample-id">' + esc(sample.id) + '</span>' + statusChip(sample) + '</div>' +
        '<div class="meta">' + t('partner') + ': <b>' + esc(sample.partner) + '</b> · ' + t('rider') + ': <b>' + esc(sample.rider) + '</b></div>' +
        slaBox(sample) + '<div class="actions">';
      if (sample.status === 'dispatched') html += '<button class="btn" type="button" data-action="pick-up" data-id="' + sample.id + '">' + t('assignRider') + '</button>';
      if (sample.status === 'picked_up') html += '<button class="btn" type="button" data-action="en-route" data-id="' + sample.id + '">' + t('statusInTransit') + '</button>';
      if (sample.status === 'in_transit') html += '<button class="btn" type="button" data-action="hand-lab" data-id="' + sample.id + '">' + t('handToLab') + '</button>';
      html += '</div></section>';
    });
    return html + '</div>';
  }

  function resultForm(sample) {
    let fields = '';
    PARAMS.forEach(([key]) => {
      fields += '<div class="field"><label for="p-' + key + '">' + t(key) + '</label>' +
        '<input id="p-' + key + '" type="number" step="any" min="0" placeholder="0"></div>';
    });
    return '<div class="divider"></div><h2>' + t('resultsTitle') + '</h2><p>' + t('resultsIntro') + '</p>' +
      '<div class="results-grid">' + fields + '</div>' +
      '<div class="actions"><button class="btn" type="button" data-action="publish" data-id="' + sample.id + '">' + t('publishBtn') + '</button></div>';
  }

  function renderLab() {
    let html = '<div class="page-head"><h1>' + t('labTitle') + '</h1><p>' + t('labIntro') + '</p></div><div class="grid">';

    html += '<section class="card"><h2>' + t('scanTitle') + '</h2>' +
      '<div class="field"><label for="scanId">' + t('scanLabel') + '</label>' +
      '<input id="scanId" type="text" placeholder="' + t('scanPlaceholder') + '" autocomplete="off"></div>' +
      '<div class="actions"><button class="btn" type="button" data-action="lookup">' + t('scanBtn') + '</button></div>';

    if (labSelection) {
      const sample = Store.get(labSelection);
      if (!sample) labSelection = null;
      else {
        const late = labLateness(sample);
        html += '<div class="divider"></div><div class="sample-top"><span class="sample-id">' + esc(sample.id) + '</span>' + statusChip(sample) + '</div>' +
          '<div class="meta">' + t('collected') + ': <b>' + fmtTime(sample.collectedAt) + '</b> · ' +
          t('statusLabReceived') + ': <b>' + fmtTime(sample.labReceivedAt) + '</b></div>' +
          '<div class="sla ' + (late > 3600000 ? 'bad' : '') + '">' +
          (late > 3600000 ? t('breachedLabel') : t('countdownLabel') + ': ' + Store.fmtDuration(3600000 - late)) + '</div>';
        if (sample.status.indexOf('rejected') === 0) {
          html += '<p class="meta" style="margin-top:10px">' + t('rejectionNote') + ': ' + t('status' + cap(sample.status)) + '</p>';
        } else if (!sample.accepted) {
          html += '<div class="actions"><button class="btn" type="button" data-action="accept" data-id="' + sample.id + '">' + t('acceptSample') + '</button>' +
            '<button class="btn danger" type="button" data-action="reject-sla" data-id="' + sample.id + '">' + t('rejectSla') + '</button>' +
            '<button class="btn danger" type="button" data-action="reject-seal" data-id="' + sample.id + '">' + t('rejectSeal') + '</button></div>';
        } else {
          html += '<span class="chip ok">' + t('statusLabReceived') + '</span>' + resultForm(sample);
        }
      }
    }
    html += '</section>';

    html += '<section class="card wide"><h2>' + t('labQueueTitle') + '</h2>';
    const queue = Store.data.samples.filter(s => ['lab_received', 'analysed', 'results_ready'].indexOf(s.status) !== -1 || s.status.indexOf('rejected') === 0);
    if (!queue.length) html += '<p class="empty">' + t('noLabQueue') + '</p>';
    queue.forEach(sample => {
      html += '<div class="sample"><div class="sample-top"><span class="sample-id">' + esc(sample.id) + '</span>' + statusChip(sample) + '</div>' +
        '<div class="meta">' + t('collected') + ': <b>' + fmtTime(sample.collectedAt) + '</b> · ' +
        t('statusLabReceived') + ': <b>' + fmtTime(sample.labReceivedAt) + '</b></div>' +
        '<div class="actions"><button class="btn secondary" type="button" data-action="select" data-id="' + sample.id + '">' + t('scanBtn') + '</button></div></div>';
    });
    html += '</section></div>';
    return html;
  }

  function render() {
    const user = Store.currentUser();
    const current = gateScreen();
    if (current !== 'quiz' && current !== 'quizResult') clearQuiz();
    screen = current;

    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.getAttribute('data-i18n')); });
    langToggle.textContent = I18N.current === 'en' ? 'العربية' : 'English';
    document.querySelectorAll('.tab').forEach(tab => {
      const active = tab.dataset.role === role;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    });

    const latest = role === 'patient' ? null : Store.data.notices[0];
    notice.hidden = !latest;
    if (latest) notice.textContent = latest.text;

    view.innerHTML = role === 'patient' ? renderPatient(user, current) : role === 'dispatch' ? renderDispatch() : renderLab();

    const scanId = document.getElementById('scanId');
    if (scanId) scanId.onkeydown = event => { if (event.key === 'Enter') lookupSample(); };
  }

  function lookupSample() {
    const input = document.getElementById('scanId');
    if (!input) return;
    const found = Store.get(input.value.trim().toUpperCase());
    if (found) {
      labSelection = found.id;
      render();
    } else {
      showNotice(t('notFound'));
    }
  }

  function publish(sample) {
    const results = {};
    PARAMS.forEach(([key]) => {
      const input = document.getElementById('p-' + key);
      results[key] = input ? input.value : '';
    });
    Store.update(sample.id, { results, accepted: true });
    Store.transition(sample.id, 'results_ready', 'noticePublished');
    labSelection = null;
    render();
  }

  function value(id) {
    const element = document.getElementById(id);
    return element ? element.value.trim() : '';
  }

  function doSignup() {
    const name = value('su-name');
    const email = value('su-email');
    const phone = value('su-phone');
    const password = value('su-password');
    if (!name || !email || !phone || !password) return showNotice(t('errRequired'));
    if (!/^\S+@\S+\.\S+$/.test(email)) return showNotice(t('errEmail'));
    if (password.length < 6) return showNotice(t('errPasswordShort'));
    const result = Store.signup({ name, email, phone, password });
    if (!result.ok) return showNotice(t('errEmailExists'));
    screen = 'login';
    render();
    showNotice(t('accountCreated'));
  }

  function doLogin() {
    const result = Store.login(value('li-email'), value('li-password'));
    if (!result.ok) return showNotice(t('errInvalidLogin'));
    screen = 'home';
    render();
    showNotice(t('signedIn'));
  }

  function demoLogin() {
    const result = Store.login(DEMO_ACCOUNT.email, DEMO_ACCOUNT.password);
    if (!result.ok) return showNotice(t('errInvalidLogin'));
    screen = 'home';
    selectedId = null;
    render();
    showNotice(t('demoSignedIn'));
  }

  function doConsent() {
    const boxes = Array.from(document.querySelectorAll('[data-consent]'));
    if (!boxes.length || boxes.some(box => !box.checked)) return showNotice(t('errConsent'));
    Store.saveConsent({
      collection: true,
      courier: true,
      lab: true,
      data: true
    });
    screen = 'home';
    render();
  }

  function doProfile(setup) {
    const profile = {
      fullName: value('pf-name'),
      phone: value('pf-phone'),
      email: value('pf-email'),
      addressLine1: value('pf-a1'),
      addressLine2: value('pf-a2'),
      city: value('pf-city'),
      emirate: value('pf-emirate'),
      postcode: value('pf-postcode'),
      country: value('pf-country'),
      deliveryNotes: value('pf-notes')
    };
    if (!profile.fullName || !profile.phone || !profile.addressLine1 || !profile.city || !profile.emirate) {
      return showNotice(t('errRequired'));
    }
    Store.updateProfile(profile);
    if (setup) screen = 'home';
    render();
    showNotice(t('profileSaved'));
  }

  function doOrder() {
    const sample = Store.createSample({
      abstinence: value('or-abstinence') || '3',
      consent: true
    });
    selectedId = sample.id;
    screen = 'sample';
    render();
  }

  function doDelivery(id) {
    const sample = Store.get(id);
    if (!sample) return;
    if (sample.patientId !== Store.currentUser()?.id || !['awaiting', 'scheduled'].includes(sample.status)) return;
    const address = value('dl-address');
    if (!address) return showNotice(t('errRequired'));
    const slotInput = document.querySelector('input[name="slot"]:checked');
    Store.arrangeDelivery(id, {
      address,
      slot: slotInput ? slotInput.value : 'today',
      partner: 'Demo courier',
      notes: value('dl-notes')
    });
    go('sample', id);
    showNotice(t('deliveryConfirmed'));
  }

  function doCollect(id) {
    const sample = Store.get(id);
    if (!sample || sample.status !== 'scheduled' || sample.patientId !== Store.currentUser()?.id) return;
    if (!sample.delivery) {
      screen = 'delivery';
      render();
      return showNotice(t('errRequired'));
    }
    Store.update(id, { collectedAt: new Date().toISOString(), sealOk: true });
    Store.dispatch(id);
    Store.notify(t('noticeCollected'), id);
    go('sample', id);
  }

  function copyId(id) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(id).then(() => showNotice(t('copied'))).catch(() => showNotice(id));
    } else {
      showNotice(id);
    }
  }

  function handleAction(action, el) {
    const id = el.dataset.id || selectedId;
    const sample = id ? Store.get(id) : null;
    const user = Store.currentUser();

    if (action === 'lang') {
      I18N.toggle();
      render();
    } else if (action === 'goto-signup') {
      go('signup');
    } else if (action === 'goto-login') {
      go('login');
    } else if (action === 'goto-home') {
      go('home');
    } else if (action === 'goto-results') {
      go('results');
    } else if (action === 'goto-prepare') {
      go('prepare', id);
    } else if (action === 'pickup-help') {
      showNotice(t('pickupHelpDemo'));
    } else if (action === 'goto-orders') {
      go('orders');
    } else if (action === 'goto-learn') {
      learnReturn = user ? 'home' : screen;
      go('learn');
    } else if (action === 'goto-quiz') {
      startQuiz();
    } else if (action === 'quiz-answer') {
      quizAnswers[quizIndex] = Number(el.dataset.value);
      if (quizIndex === QUIZ.length - 1) go('quizResult');
      else { quizIndex += 1; render(); }
    } else if (action === 'quiz-back') {
      if (quizIndex === 0) go('learn');
      else { quizIndex -= 1; render(); }
    } else if (action === 'quiz-restart') {
      startQuiz();
    } else if (action === 'goto-profile') {
      go('profile');
    } else if (action === 'goto-order') {
      go('order');
    } else if (action === 'goto-delivery') {
      go('delivery', id);
    } else if (action === 'open-sample') {
      go('sample', id);
    } else if (action === 'open-report') {
      go('report', id);
    } else if (action === 'back') {
      if (screen === 'quiz' || screen === 'quizResult') go('learn');
      else if (!user && screen === 'learn') go(learnReturn);
      else if (screen === 'prepare' || screen === 'delivery') go('sample', selectedId);
      else if (screen === 'report') go('results');
      else go('home');
    } else if (action === 'signup') {
      doSignup();
    } else if (action === 'login') {
      doLogin();
    } else if (action === 'demo-login') {
      demoLogin();
    } else if (action === 'consent') {
      doConsent();
    } else if (action === 'save-profile') {
      doProfile(!!(user && !Store.profileComplete(user)));
    } else if (action === 'logout') {
      Store.logout();
      selectedId = null;
      go('welcome');
    } else if (action === 'order') {
      doOrder();
    } else if (action === 'arrange-delivery') {
      doDelivery(id);
    } else if (action === 'collect') {
      doCollect(id);
    } else if (action === 'copy-id') {
      copyId(id);
    } else if (action === 'pick-up') {
      Store.transition(id, 'picked_up', 'noticePicked');
      render();
    } else if (action === 'en-route') {
      Store.transition(id, 'in_transit');
      render();
    } else if (action === 'hand-lab') {
      Store.transition(id, 'lab_received', 'noticeHanded');
      render();
    } else if (action === 'lookup') {
      lookupSample();
    } else if (action === 'select') {
      labSelection = id;
      render();
    } else if (action === 'accept') {
      Store.update(id, { accepted: true });
      Store.notify(t('noticeAccepted'), id);
      render();
    } else if (action === 'reject-sla') {
      Store.transition(id, 'rejected_sla', 'noticeRejectedSla');
      labSelection = null;
      render();
    } else if (action === 'reject-seal') {
      Store.update(id, { sealOk: false });
      Store.transition(id, 'rejected_seal', 'noticeRejectedSeal');
      labSelection = null;
      render();
    } else if (action === 'publish') {
      if (sample) publish(sample);
    } else if (action === 'consult') {
      showNotice(t('consultDemo'));
    } else if (action === 'reset') {
      Store.reset();
      screen = 'login';
      selectedId = null;
      labSelection = null;
      render();
    }
  }

  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      clearQuiz();
      role = tab.dataset.role;
      if (role === 'patient') screen = 'home';
      render();
    });
  });

  langToggle.addEventListener('click', () => {
    I18N.toggle();
    render();
  });

  view.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const before = screen;
    handleAction(button.dataset.action, button);
    if (before !== screen) view.querySelector('h1[tabindex]')?.focus({ preventScroll: true });
  });

  window.addEventListener('storage', event => {
    if (event.key === Store.KEY) {
      Store.data = Store.read();
      render();
    }
  });

  setInterval(() => {
    document.querySelectorAll('[data-countdown]').forEach(el => {
      const sample = Store.get(el.dataset.countdown);
      const info = sample && Store.sla(sample);
      if (!info) return;
      const span = el.querySelector('span');
      const text = info.breached ? t('breachedLabel') : t('countdownLabel') + ': ' + Store.fmtDuration(info.remaining);
      if (span) span.textContent = text;
      else el.textContent = text;
      el.classList.toggle('bad', info.breached);
      el.classList.toggle('warn', !info.breached && info.remaining < 15 * 60 * 1000);
    });
  }, 1000);

  Store.init();
  screen = Store.currentUser() ? 'home' : 'welcome';
  render();
})();
