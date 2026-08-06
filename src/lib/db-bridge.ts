import { ProviderFactory } from '../data/ProviderFactory';

// Initialize the provider factory listeners
ProviderFactory.init();

// Mock types and exports to satisfy Firestore imports used throughout the app
export const db: any = { type: 'provider-driven' };
export const auth: any = {
  currentUser: { uid: 'local-user' },
  onAuthStateChanged: (cb: any) => cb({ uid: 'local-user' })
};

export const collection = (db: any, name: string) => ({ 
  type: 'collection', 
  name,
  path: name 
});

export const doc = (arg1?: any, arg2?: any, arg3?: any) => {
  const args = [arg1, arg2, arg3].filter(a => a !== undefined);
  if (args.length === 3) {
    return { type: 'doc', name: args[1], id: args[2] };
  }
  if (args.length === 2) {
    if (args[0] && args[0].type === 'collection') {
      return { type: 'doc', name: args[0].name, id: args[1] };
    }
    if (typeof args[1] === 'string') {
      const parts = args[1].split('/');
      if (parts.length > 1) {
        return { type: 'doc', name: parts[0], id: parts[1] };
      }
      return { type: 'doc', name: args[0].name || args[0], id: args[1] };
    }
  }
  if (args.length === 1 && args[0] && args[0].type === 'collection') {
    return { type: 'doc', name: args[0].name, id: Math.random().toString(36).substring(2) };
  }
  return { type: 'doc' };
};

export const query = (ref: any, ...constraints: any[]) => {
  return { ...ref, constraints };
};

export const where = (field: string, op: string, value: any) => ({ type: 'where', field, op, value });
export const orderBy = (field: string, dir: string = 'asc') => ({ type: 'orderBy', field, dir });
export const limit = (val: number) => ({ type: 'limit', value: val });
export const increment = (val: number) => ({ type: 'increment', value: val });

export const serverTimestamp = () => ({
  _isTimestamp: true,
  _date: new Date(),
  toDate: function() { return this._date; },
  toMillis: function() { return this._date.getTime(); },
  toISOString: function() { return this._date.toISOString(); },
  toJSON: function() { return this._date.toISOString(); }
});

// --- Delegation to ProviderFactory ---

const getProvider = () => ProviderFactory.getProvider();

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 4000, errorMsg: string = 'Operation timed out'): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(errorMsg)), timeoutMs))
  ]);
};

export const getDoc = async (docRef: any) => {
  return withTimeout(getProvider().getDoc(docRef.name, docRef.id), 15000, `getDoc timed out for ${docRef.name}/${docRef.id}`);
};

export const getDocs = async (queryRef: any) => {
  return withTimeout(getProvider().getDocs(queryRef.name, queryRef.constraints), 15000, `getDocs timed out for ${queryRef.name}`);
};

export const setDoc = async (docRef: any, data: any, options?: any) => {
  return getProvider().setDoc(docRef.name, docRef.id, data, options);
};

export const addDoc = async (colRef: any, data: any, more?: any) => {
  return getProvider().addDoc(colRef.name, data);
};

export const updateDoc = async (docRef: any, data: any, more?: any) => {
  return getProvider().updateDoc(docRef.name, docRef.id, data);
};

export const deleteDoc = async (docRef: any) => {
  return getProvider().deleteDoc(docRef.name, docRef.id);
};

export const onSnapshot = (queryRef: any, callback: any, errorCallback?: any) => {
  const isDoc = queryRef.type === 'doc';
  const finalErrorCallback = errorCallback || ((err: any) => {
    console.warn(`[db-bridge] Snapshot listener error on ${isDoc ? 'document' : 'collection'} "${queryRef.name}":`, err);
  });
  if (isDoc) {
    return getProvider().onSnapshotDoc(queryRef.name, queryRef.id, callback, finalErrorCallback);
  } else {
    return getProvider().onSnapshot(queryRef.name, queryRef.constraints, callback, finalErrorCallback);
  }
};

export const runTransaction = async (db: any, updateFunction: any) => {
  return getProvider().runTransaction(updateFunction);
};

export const writeBatch = (db: any) => {
  return getProvider().writeBatch();
};
