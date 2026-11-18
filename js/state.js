const DEMO_ACCOUNT = {
  id: 'USR-DEMO01',
  name: 'Ahmed Al Mansoori',
  email: 'demo@mencare.ae',
  phone: '+971 50 123 4567',
  password: 'Demo1234'
};

function ago(minutes) {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

function demoUser() {
  return {
    id: DEMO_ACCOUNT.id,
    name: DEMO_ACCOUNT.name,
    email: DEMO_ACCOUNT.email,
    phone: DEMO_ACCOUNT.phone,
    password: DEMO_ACCOUNT.password,
    consent: { collection: true, courier: true, lab: true, data: true, at: ago(60 * 24 * 8) },
    profile: {
      fullName: DEMO_ACCOUNT.name,
      phone: DEMO_ACCOUNT.phone,
      email: DEMO_ACCOUNT.email,
      addressLine1: 'Apartment 1204, Al Salam Tower',
      addressLine2: 'Sheikh Zayed Road',
      city: 'Dubai',
      emirate: 'Dubai',
      postcode: '00000',
      country: 'United Arab Emirates',
      deliveryNotes: 'Ask for reception, building B'
    },
    createdAt: ago(60 * 24 * 8)
  };
}

function demoSamples() {
  return [
    {
      id: 'SEM-DM0247',
      status: 'in_transit',
      patientId: DEMO_ACCOUNT.id,
      patientName: DEMO_ACCOUNT.name,
      intake: { reason: 'Routine fertility check', abstinence: '3', consent: true },
      createdAt: ago(38),
      collectedAt: ago(11),
      dispatchedAt: ago(10),
      pickedUpAt: ago(6),
      labReceivedAt: null,
      publishedAt: null,
      rejectedAt: null,
      partner: 'Careem',
      rider: 'Rider 284',
      delivery: {
        address: 'Apartment 1204, Al Salam Tower\nSheikh Zayed Road, Dubai',
        slot: 'today',
        partner: 'Careem',
        notes: 'Ask for reception, building B',
        scheduledAt: ago(36)
      },
      sealOk: true,
      rejectionReason: null,
      results: null
    },
    {
      id: 'SEM-DM0173',
      status: 'results_ready',
      patientId: DEMO_ACCOUNT.id,
      patientName: DEMO_ACCOUNT.name,
      intake: { reason: 'Fertility screening', abstinence: '4', consent: true },
      createdAt: ago(60 * 24 * 3 + 5),
      collectedAt: ago(60 * 24 * 3),
      dispatchedAt: ago(60 * 24 * 3 - 1),
      pickedUpAt: ago(60 * 24 * 3 - 6),
      labReceivedAt: ago(60 * 24 * 3 - 40),
      publishedAt: ago(60 * 24 * 2),
      rejectedAt: null,
      partner: 'noon',
      rider: 'Rider 417',
      delivery: {
        address: 'Apartment 1204, Al Salam Tower\nSheikh Zayed Road, Dubai',
        slot: 'today',
        partner: 'noon',
        notes: 'Ask for reception, building B',
        scheduledAt: ago(60 * 24 * 3 + 1)
      },
      sealOk: true,
      accepted: true,
      rejectionReason: null,
      results: {
        volume: '2.8',
        concentration: '18',
        count: '42',
        totalMotility: '36',
        progressiveMotility: '29',
        morphology: '3',
        velocity: '31'
      }
    },
    {
      id: 'SEM-DM0098',
      status: 'rejected_sla',
      patientId: DEMO_ACCOUNT.id,
      patientName: DEMO_ACCOUNT.name,
      intake: { reason: 'Follow-up check', abstinence: '2', consent: true },
      createdAt: ago(60 * 24 * 6 + 5),
      collectedAt: ago(60 * 24 * 6),
      dispatchedAt: ago(60 * 24 * 6 - 1),
      pickedUpAt: ago(60 * 24 * 6 - 10),
      labReceivedAt: ago(60 * 24 * 6 - 75),
      publishedAt: null,
      rejectedAt: ago(60 * 24 * 6 - 80),
      partner: 'Talabat',
      rider: 'Rider 312',
      delivery: {
        address: 'Apartment 1204, Al Salam Tower\nSheikh Zayed Road, Dubai',
        slot: 'today',
        partner: 'Talabat',
        notes: 'Ask for reception, building B',
        scheduledAt: ago(60 * 24 * 6 + 1)
      },
      sealOk: true,
      rejectionReason: 'sla',
      results: null
    }
  ];
}

const Store = {
  KEY: 'mencare_patient_demo_v1',
  data: null,
  listeners: [],

  init() {
    this.data = this.read();
    if (this.seedDemo()) this.persist();
    return this.data;
  },

  seedDemo() {
    let changed = false;
    if (!this.data.users.some(user => user.email === DEMO_ACCOUNT.email)) {
      this.data.users.push(demoUser());
      changed = true;
    }
    demoSamples().forEach(sample => {
      if (!this.data.samples.some(item => item.id === sample.id)) {
        this.data.samples.push(sample);
        changed = true;
      }
    });
    return changed;
  },

  blank() {
    return { samples: demoSamples(), notices: [], users: [demoUser()], session: null, pendingEmail: DEMO_ACCOUNT.email };
  },

  read() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          samples: parsed.samples || [],
          notices: parsed.notices || [],
          users: parsed.users || [],
          session: parsed.session || null,
          pendingEmail: parsed.pendingEmail || null
        };
      }
    } catch (e) {
      return this.blank();
    }
    return this.blank();
  },

  persist() {
    localStorage.setItem(this.KEY, JSON.stringify(this.data));
    this.listeners.forEach(fn => fn());
  },

  subscribe(fn) {
    this.listeners.push(fn);
  },

  notify(text, sampleId) {
    this.data.notices.unshift({ text, sampleId, at: new Date().toISOString() });
    this.data.notices = this.data.notices.slice(0, 20);
  },

  makeCode(prefix) {
    let code = '';
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return prefix + code;
  },

  newId() {
    return this.makeCode('SEM-');
  },

  newUserId() {
    return this.makeCode('USR-');
  },

  signup(input) {
    const email = input.email.trim().toLowerCase();
    if (this.data.users.some(user => user.email === email)) return { ok: false, error: 'emailExists' };
    const user = {
      id: this.newUserId(),
      name: input.name.trim(),
      email,
      phone: input.phone.trim(),
      password: input.password,
      consent: null,
      profile: null,
      createdAt: new Date().toISOString()
    };
    this.data.users.push(user);
    this.data.pendingEmail = email;
    this.persist();
    return { ok: true, user };
  },

  login(email, password) {
    const user = this.data.users.find(item =>
      item.email === email.trim().toLowerCase() && item.password === password
    );
    if (!user) return { ok: false, error: 'invalid' };
    this.data.session = { userId: user.id, at: new Date().toISOString() };
    this.data.pendingEmail = user.email;
    this.persist();
    return { ok: true, user };
  },

  logout() {
    this.data.session = null;
    this.persist();
  },

  currentUser() {
    if (!this.data.session) return null;
    return this.data.users.find(user => user.id === this.data.session.userId) || null;
  },

  saveConsent(consent) {
    const user = this.currentUser();
    if (!user) return null;
    user.consent = Object.assign({}, consent, { at: new Date().toISOString() });
    this.persist();
    return user;
  },

  updateProfile(profile) {
    const user = this.currentUser();
    if (!user) return null;
    user.profile = Object.assign({}, user.profile || {}, profile);
    if (!user.profile.fullName) user.profile.fullName = user.name;
    if (!user.profile.email) user.profile.email = user.email;
    this.persist();
    return user;
  },

  profileComplete(user) {
    const profile = user && user.profile;
    return !!(profile && profile.fullName && profile.phone && profile.addressLine1 && profile.city && profile.emirate);
  },

  createSample(intake) {
    const user = this.currentUser();
    const sample = {
      id: this.newId(),
      status: 'awaiting',
      patientId: user ? user.id : null,
      patientName: user ? (user.profile ? user.profile.fullName : user.name) : '',
      intake: intake,
      createdAt: new Date().toISOString(),
      collectedAt: null,
      dispatchedAt: null,
      pickedUpAt: null,
      labReceivedAt: null,
      publishedAt: null,
      rejectedAt: null,
      partner: null,
      rider: null,
      delivery: null,
      sealOk: true,
      rejectionReason: null,
      results: null
    };
    this.data.samples.unshift(sample);
    this.notify(I18N.t('noticeOrdered'), sample.id);
    this.persist();
    return sample;
  },

  get(id) {
    return this.data.samples.find(s => s.id === id) || null;
  },

  update(id, patch) {
    const sample = this.get(id);
    if (!sample) return null;
    Object.assign(sample, patch);
    this.persist();
    return sample;
  },

  arrangeDelivery(id, delivery) {
    return this.update(id, {
      status: 'scheduled',
      delivery: Object.assign({}, delivery, { scheduledAt: new Date().toISOString() })
    });
  },

  dispatch(id) {
    return this.update(id, {
      status: 'dispatched',
      dispatchedAt: new Date().toISOString(),
      partner: 'Demo courier',
      rider: 'Rider ' + String(100 + Math.floor(Math.random() * 899))
    });
  },

  transition(id, status, noticeKey) {
    const sample = this.get(id);
    if (!sample) return null;
    const stamp = {
      picked_up: 'pickedUpAt',
      in_transit: null,
      lab_received: 'labReceivedAt',
      analysed: null,
      results_ready: 'publishedAt',
      rejected_sla: 'rejectedAt',
      rejected_seal: 'rejectedAt'
    }[status];
    const patch = { status };
    if (stamp) patch[stamp] = new Date().toISOString();
    if (noticeKey) this.notify(I18N.t(noticeKey), id);
    return this.update(id, patch);
  },

  reset() {
    this.data = this.blank();
    this.persist();
  },

  sla(sample) {
    if (!sample.collectedAt) return null;
    const deadline = Date.parse(sample.collectedAt) + 60 * 60 * 1000;
    const remaining = deadline - Date.now();
    return { deadline, remaining, breached: remaining <= 0 };
  },

  fmtDuration(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
  }
};
