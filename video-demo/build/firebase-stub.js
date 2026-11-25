// Firebase falso, em memória — só para gravar o vídeo demo com DADOS DE EXEMPLO.
// Nenhum dado real do app é lido ou gravado.
(function () {
  const PHOTO = (n) => 'https://app.demo/photos/' + n + '.jpg';

  class Timestamp {
    constructor(d) { this._d = new Date(d); }
    toDate() { return new Date(this._d); }
    valueOf() { return this._d.getTime(); }
  }
  const SERVER_TS = { __serverTs: true };
  const toVal = (v) => (v instanceof Timestamp ? v.valueOf() : v instanceof Date ? v.getTime() : v);

  const now = new Date();
  const at = (daysAgo, h, m) => { const d = new Date(now); d.setDate(d.getDate() - daysAgo); d.setHours(h, m, 0, 0); return new Timestamp(d); };
  const item = (desc, qty, status, horario, photo) => ({ desc, qty: String(qty), status, horario: horario || '', uploadedUrl: photo ? PHOTO(photo) : null });
  const cats = (eq, pr, bo) => ({
    equipamento: { pendencia: !!(eq && eq.length), items: eq || [] },
    producao: { pendencia: !!(pr && pr.length), items: pr || [] },
    bonded: { pendencia: !!(bo && bo.length), items: bo || [] },
  });
  const side = (n) => ({ uploadedUrl: PHOTO(n) });
  const meal = (a, b) => ({ na: false, frente: side(a), verso: side(b) });
  const fullPhotos = {
    spml: { desc: '2x VGML · 1x DBML', na: false, photos: [side('trolley_c')] },
    preorder: { desc: '', na: true, photos: [] },
    fornosBC: { na: false, photos: [side('forno_a')] },
    fornosYC: { na: false, photos: [side('forno_b'), side('forno_a')] },
    remanentes: { na: true, photos: [] },
    maletas: { na: false, photos: [side('caixas_a')] },
    business: { jantar: meal('trolley_a', 'trolley_b'), cafe: { na: true }, lanche: { na: true } },
    economica: { jantar: meal('trolley_d', 'trolley_c'), cafe: { na: true }, lanche: meal('trolley_b', 'trolley_a') },
    crew: { frente: side('trolley_c'), verso: side('trolley_d') },
    apoio: { na: true },
  };

  const base = (o) => Object.assign({ execQty: '24', econQty: '150', crewTT: '2', crewTC: '6' }, fullPhotos, o);
  const seed = [
    base({ flightNumber: 'LA 3350', expedidorNome: 'Rafael Lima', startedBy: 'rafael', completedBy: 'rafael', status: 'pendente', createdAt: at(0, 6, 40),
      categories: cats(null, [item('Faltou Lanche HLD2 na econômica', 12, 'pendente', '', 'caixas_b')], null) }),
    base({ flightNumber: 'LA 4512', expedidorNome: 'Camila Rocha', startedBy: 'camila', completedBy: 'camila', status: 'pendente', createdAt: at(0, 7, 55),
      categories: cats([item('Gaveta de bebidas sem lacre', 2, 'pendente', '', 'trolley_b')], null, [item('Chocolate do bonded', 1, 'chegou', '08:12')]) }),
    base({ flightNumber: 'LA 3104', expedidorNome: 'Bruno Alves', startedBy: 'bruno', status: 'rascunho', step: 3, createdAt: at(0, 8, 20), categories: cats() }),
    base({ flightNumber: 'LA 3010', expedidorNome: 'Marina Costa', startedBy: 'marina', completedBy: 'marina', status: 'completo', createdAt: at(0, 5, 30), categories: cats() }),
    base({ flightNumber: 'LA 3226', expedidorNome: 'João Pereira', startedBy: 'joao', completedBy: 'joao', status: 'completo', createdAt: at(0, 5, 55),
      categories: cats(null, [item('Carne — refeição quente BC', 3, 'chegou', '06:18')], null) }),
    base({ flightNumber: 'LA 3482', expedidorNome: 'Marina Costa', startedBy: 'marina', completedBy: 'marina', status: 'completo', createdAt: at(0, 6, 10), categories: cats() }),
    base({ flightNumber: 'LA 3001', expedidorNome: 'Rafael Lima', startedBy: 'rafael', completedBy: 'rafael', status: 'completo', createdAt: at(1, 9, 5),
      categories: cats([item('Fornos sem gaveta', 1, 'chegou', '09:40')], [item('Pasta vegetariana', 4, 'chegou', '09:31')], null) }),
    base({ flightNumber: 'LA 3290', expedidorNome: 'Camila Rocha', startedBy: 'camila', completedBy: 'camila', status: 'completo', createdAt: at(1, 11, 25),
      categories: cats(null, [item('Lanche HLD2', 8, 'chegou', '11:58')], null) }),
    base({ flightNumber: 'LA 3518', expedidorNome: 'João Pereira', startedBy: 'joao', completedBy: 'joao', status: 'completo', createdAt: at(2, 14, 0),
      categories: cats(null, [item('Peixe — Business', 2, 'chegou', '14:22')], [item('Sorvete', 6, 'chegou', '14:30')]) }),
    base({ flightNumber: 'LA 3061', expedidorNome: 'Bruno Alves', startedBy: 'bruno', completedBy: 'bruno', status: 'completo', createdAt: at(3, 16, 40),
      categories: cats(null, [item('Especial KSML / Kosher', 1, 'chegou', '17:02')], null) }),
    base({ flightNumber: 'LA 3330', expedidorNome: 'Marina Costa', startedBy: 'marina', completedBy: 'marina', status: 'completo', createdAt: at(5, 10, 10),
      categories: cats([item('Gaveta de água', 3, 'chegou', '10:44')], [item('Lanche HLD2', 10, 'chegou', '10:39')], null) }),
    base({ flightNumber: 'LA 3402', expedidorNome: 'Rafael Lima', startedBy: 'rafael', completedBy: 'rafael', status: 'completo', createdAt: at(8, 7, 0), categories: cats() }),
    base({ flightNumber: 'LA 3150', expedidorNome: 'Camila Rocha', startedBy: 'camila', completedBy: 'camila', status: 'completo', createdAt: at(12, 13, 15),
      categories: cats(null, [item('Lanche', 5, 'chegou', '13:40')], null) }),
    base({ flightNumber: 'LA 3208', expedidorNome: 'João Pereira', startedBy: 'joao', completedBy: 'joao', status: 'completo', createdAt: at(16, 18, 30), categories: cats() }),
  ];
  // mês passado: mais pendências (pra tendência "este mês vs mês passado")
  for (let i = 0; i < 16; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 3 + i, 9, 0);
    seed.push(base({ flightNumber: 'LA ' + (3600 + i * 7), expedidorNome: ['Marina Costa', 'Rafael Lima', 'Camila Rocha', 'João Pereira'][i % 4],
      startedBy: 'equipe', completedBy: 'equipe', status: 'completo', createdAt: new Timestamp(d),
      categories: i % 3 === 0 ? cats() : cats(i % 4 === 0 ? [item('Trolleys', 1, 'chegou', '09:30')] : null, [item(i % 2 ? 'Lanche HLD2' : 'Carne', 4, 'chegou', '09:40')], i % 5 === 0 ? [item('Chocolate', 2, 'chegou', '09:50')] : null) }));
  }

  const store = { registros: new Map(), usuarios: new Map() };
  let nextId = 1;
  seed.forEach((d) => store.registros.set('demo' + nextId++, d));
  store.usuarios.set('uid-alex', { user: 'alex', role: 'admin' });
  const listeners = [];
  const notify = () => listeners.forEach((l) => l());

  const clone = (o) => JSON.parse(JSON.stringify(o, (k, v) => v), (k, v) => v);
  const materialize = (data) => {
    const out = {};
    Object.keys(data).forEach((k) => {
      const v = data[k];
      out[k] = v && v.__serverTs ? new Timestamp(new Date()) : v instanceof Timestamp ? v : (v && typeof v === 'object' ? clone(v) : v);
    });
    return out;
  };
  const snapDoc = (coll, id) => {
    const data = store[coll].get(id);
    return { id, exists: !!data, data: () => (data ? Object.assign({}, data) : undefined), ref: { id } };
  };

  function query(coll, filters, order, lim) {
    const api = {
      where: (f, op, v) => query(coll, filters.concat([[f, op, v]]), order, lim),
      orderBy: (f, dir) => query(coll, filters, [f, dir], lim),
      limit: (n) => query(coll, filters, order, n),
      startAfter: () => query(coll, filters.concat([['__none__']]), order, lim),
      run() {
        let ids = Array.from(store[coll].keys());
        ids = ids.filter((id) => {
          const d = store[coll].get(id);
          return filters.every(([f, op, v]) => {
            if (f === '__none__') return false;
            const a = toVal(d[f]), b = toVal(v);
            if (op === 'in') return b.includes(a);
            if (op === '>=') return a >= b;
            if (op === '<') return a < b;
            if (op === '==') return a === b;
            return true;
          });
        });
        if (order) ids.sort((x, y) => (toVal(store[coll].get(y)[order[0]]) - toVal(store[coll].get(x)[order[0]])) * (order[1] === 'desc' ? 1 : -1));
        if (lim) ids = ids.slice(0, lim);
        return { docs: ids.map((id) => snapDoc(coll, id)) };
      },
      get: () => Promise.resolve(api.run()),
      onSnapshot(cb) { const l = () => cb(api.run()); listeners.push(l); setTimeout(l, 0); return () => { const i = listeners.indexOf(l); if (i >= 0) listeners.splice(i, 1); }; },
      add(payload) { const id = 'demo' + nextId++; store[coll].set(id, materialize(payload)); notify(); return Promise.resolve({ id }); },
      doc(id) {
        return {
          id,
          get: () => Promise.resolve(snapDoc(coll, id)),
          set(payload, opts) { const prev = (opts && opts.merge && store[coll].get(id)) || {}; store[coll].set(id, Object.assign({}, prev, materialize(payload))); notify(); return Promise.resolve(); },
          update(payload) { store[coll].set(id, Object.assign({}, store[coll].get(id), materialize(payload))); notify(); return Promise.resolve(); },
          delete() { store[coll].delete(id); notify(); return Promise.resolve(); },
        };
      },
    };
    return api;
  }

  let authCb = null;
  const auth = {
    currentUser: null,
    onAuthStateChanged(cb) { authCb = cb; setTimeout(() => cb(auth.currentUser), 0); return () => {}; },
    signInWithEmailAndPassword(email) {
      return new Promise((res) => setTimeout(() => {
        auth.currentUser = { uid: 'uid-alex', email, getIdToken: () => Promise.resolve('demo-token') };
        res({ user: auth.currentUser }); authCb && authCb(auth.currentUser);
      }, 350));
    },
    signOut() { auth.currentUser = null; authCb && authCb(null); return Promise.resolve(); },
  };

  const firestoreFn = () => ({ collection: (name) => { if (!store[name]) store[name] = new Map(); return query(name, [], null, null); } });
  firestoreFn.FieldValue = { serverTimestamp: () => SERVER_TS };
  firestoreFn.Timestamp = Timestamp;
  window.firebase = { initializeApp: () => ({}), firestore: firestoreFn, auth: () => auth };
})();
