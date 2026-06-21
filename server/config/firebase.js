const { initializeApp, cert, getApp, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

let db;
let isMock = false;

// Custom In-Memory Mock Firestore for local testing without credentials
class MockDocRef {
  constructor(collectionName, docId, mockDb) {
    this.collectionName = collectionName;
    this.id = docId;
    this.mockDb = mockDb;
  }

  async get() {
    const data = this.mockDb.get(this.collectionName, this.id);
    return {
      exists: !!data,
      id: this.id,
      data: () => data ? JSON.parse(JSON.stringify(data)) : null
    };
  }

  async set(data, options = {}) {
    const current = this.mockDb.get(this.collectionName, this.id) || {};
    let finalData = { ...data };
    if (options.merge) {
      finalData = { ...current, ...data };
    }
    finalData.id = this.id;
    finalData.updatedAt = new Date();
    if (!finalData.createdAt) {
      finalData.createdAt = current.createdAt || new Date();
    }
    this.mockDb.set(this.collectionName, this.id, finalData);
    return this;
  }

  async update(data) {
    const current = this.mockDb.get(this.collectionName, this.id);
    if (!current) {
      throw new Error(`Document ${this.id} does not exist in collection ${this.collectionName}`);
    }
    const finalData = { ...current, ...data };
    finalData.updatedAt = new Date();
    this.mockDb.set(this.collectionName, this.id, finalData);
    return this;
  }

  async delete() {
    this.mockDb.delete(this.collectionName, this.id);
    return this;
  }
}

class MockCollectionRef {
  constructor(collectionName, mockDb) {
    this.collectionName = collectionName;
    this.mockDb = mockDb;
    this.constraints = [];
    this.limitVal = null;
    this.orderField = null;
    this.orderDirection = 'asc';
  }

  doc(docId) {
    const id = docId || Math.random().toString(36).substring(2, 15);
    return new MockDocRef(this.collectionName, id, this.mockDb);
  }

  async add(data) {
    const id = Math.random().toString(36).substring(2, 15);
    const docRef = this.doc(id);
    await docRef.set(data);
    return docRef;
  }

  where(field, operator, value) {
    const query = new MockCollectionRef(this.collectionName, this.mockDb);
    query.constraints = [...this.constraints, { field, operator, value }];
    return query;
  }

  limit(num) {
    const query = new MockCollectionRef(this.collectionName, this.mockDb);
    query.constraints = [...this.constraints];
    query.limitVal = num;
    return query;
  }

  orderBy(field, direction = 'asc') {
    const query = new MockCollectionRef(this.collectionName, this.mockDb);
    query.constraints = [...this.constraints];
    query.orderField = field;
    query.orderDirection = direction;
    return query;
  }

  async get() {
    let docs = Object.values(this.mockDb.getAll(this.collectionName) || {});

    // Filter by constraints
    this.constraints.forEach(({ field, operator, value }) => {
      docs = docs.filter(doc => {
        const val = doc[field];
        if (operator === '==' || operator === '===') {
          return val === value;
        }
        if (operator === 'array-contains') {
          return Array.isArray(val) && val.includes(value);
        }
        if (operator === 'in') {
          return Array.isArray(value) && value.includes(val);
        }
        if (operator === '>=') return val >= value;
        if (operator === '<=') return val <= value;
        if (operator === '>') return val > value;
        if (operator === '<') return val < value;
        return true;
      });
    });

    // Order docs
    if (this.orderField) {
      docs.sort((a, b) => {
        let valA = a[this.orderField];
        let valB = b[this.orderField];
        
        // Handle dates
        if (valA instanceof Date) valA = valA.getTime();
        if (valB instanceof Date) valB = valB.getTime();

        if (valA < valB) return this.orderDirection === 'asc' ? -1 : 1;
        if (valA > valB) return this.orderDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Limit size
    if (this.limitVal !== null) {
      docs = docs.slice(0, this.limitVal);
    }

    return {
      empty: docs.length === 0,
      size: docs.length,
      docs: docs.map(doc => ({
        id: doc.id,
        exists: true,
        data: () => JSON.parse(JSON.stringify(doc))
      }))
    };
  }
}

class MockMemoryDb {
  constructor() {
    this.store = {};
  }
  get(col, id) {
    return this.store[col]?.[id] || null;
  }
  getAll(col) {
    return this.store[col] || {};
  }
  set(col, id, data) {
    if (!this.store[col]) this.store[col] = {};
    this.store[col][id] = data;
  }
  delete(col, id) {
    if (this.store[col]?.[id]) {
      delete this.store[col][id];
    }
  }
}

const mockStore = new MockMemoryDb();

const mockFirestore = {
  collection: (name) => new MockCollectionRef(name, mockStore),
};

// FieldValue helper matching standard SDK
const FieldValue = {
  arrayUnion: (...elements) => {
    // Custom marker function evaluated during update calls
    return {
      type: 'ARRAY_UNION',
      elements
    };
  },
  arrayRemove: (...elements) => {
    return {
      type: 'ARRAY_REMOVE',
      elements
    };
  }
};

// Process custom FieldValue transforms during writes
const originalSet = MockDocRef.prototype.set;
MockDocRef.prototype.set = async function(data, options) {
  const processed = processFieldValues(data, this.mockDb.get(this.collectionName, this.id) || {});
  return originalSet.call(this, processed, options);
};

const originalUpdate = MockDocRef.prototype.update;
MockDocRef.prototype.update = async function(data) {
  const processed = processFieldValues(data, this.mockDb.get(this.collectionName, this.id) || {});
  return originalUpdate.call(this, processed);
};

function processFieldValues(data, currentDoc) {
  const result = { ...data };
  for (const key in result) {
    const val = result[key];
    if (val && typeof val === 'object') {
      if (val.type === 'ARRAY_UNION') {
        const currentArr = Array.isArray(currentDoc[key]) ? currentDoc[key] : [];
        result[key] = [...new Set([...currentArr, ...val.elements])];
      } else if (val.type === 'ARRAY_REMOVE') {
        const currentArr = Array.isArray(currentDoc[key]) ? currentDoc[key] : [];
        result[key] = currentArr.filter(item => !val.elements.includes(item));
      }
    }
  }
  return result;
}

// ----------------------------------------------------
// Real vs Mock initialization — with async connectivity test
// ----------------------------------------------------
const credentialsPath = path.join(__dirname, 'firebase-credentials.json');

// Shared mutable state object — all routes read `.db` via module.exports getter
// so switching to mock AFTER module load still takes effect everywhere.
const firebaseState = {
  db: mockFirestore,
  isMock: true,
  FieldValue
};

try {
  const existingApps = getApps();
  let serviceAccount = null;

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    console.log('Firebase Admin SDK initialized successfully via Environment Credentials.');
  } else if (fs.existsSync(credentialsPath)) {
    serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    console.log('Firebase Admin SDK initialized successfully via local credentials file.');
  }

  if (serviceAccount) {
    if (!existingApps.length) {
      initializeApp({ credential: cert(serviceAccount) });
    }
    const realDb = getFirestore();
    const { FieldValue: AdminFieldValue } = require('firebase-admin/firestore');

    // Optimistically switch to real Firestore
    firebaseState.db         = realDb;
    firebaseState.isMock     = false;
    firebaseState.FieldValue = AdminFieldValue;

    // ── Async connectivity test ─────────────────────────────────────────────
    // Fires after all synchronous require() calls complete.
    // If Firestore API is disabled or lacks permissions, we auto-downgrade to mock.
    setImmediate(async () => {
      try {
        await realDb.collection('_healthcheck').limit(1).get();
        console.log('✅ Firestore connection verified — Production Firebase active.');
      } catch (testErr) {
        console.error(
          '❌ Firestore connection failed — switching to In-Memory MOCK mode.',
          '\n   Reason:', testErr.message,
          '\n   Fix: Enable Firestore at https://console.firebase.google.com/project/_/firestore'
        );
        firebaseState.db         = mockFirestore;
        firebaseState.isMock     = true;
        firebaseState.FieldValue = FieldValue;
      }
    });
  } else {
    console.warn('⚠️  No Firebase credentials found. Running in In-Memory MOCK FIRESTORE mode.');
  }
} catch (error) {
  console.error('❌ Firebase init failed. Falling back to MOCK Firestore:', error.message);
  // firebaseState already defaults to mock
}

// Export getters so routes always read the LIVE firebaseState values,
// even if they destructure at import time (const { db } = require(...))
// — because getters are evaluated at access time, not import time.
module.exports = {
  get db()         { return firebaseState.db; },
  get isMock()     { return firebaseState.isMock; },
  get FieldValue() { return firebaseState.FieldValue; }
};
