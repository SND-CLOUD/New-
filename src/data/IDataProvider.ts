/**
 * Unified Data Provider Interface
 * Supports both generic document database methods and specific domain-driven actions.
 */

export interface IDataProvider {
  // --- Generic Document API ---
  getDoc(collectionName: string, id: string): Promise<any>;
  getDocs(collectionName: string, constraints?: any[]): Promise<any>;
  setDoc(collectionName: string, id: string, data: any, options?: any, txGroupId?: string): Promise<void>;
  addDoc(collectionName: string, data: any): Promise<{ id: string }>;
  updateDoc(collectionName: string, id: string, data: any, txGroupId?: string): Promise<void>;
  deleteDoc(collectionName: string, id: string, txGroupId?: string): Promise<void>;
  onSnapshot(
    collectionName: string,
    constraints: any[] | undefined,
    callback: (snapshot: any) => void,
    errorCallback?: any
  ): () => void;
  onSnapshotDoc(
    collectionName: string,
    id: string,
    callback: (snapshot: any) => void,
    errorCallback?: any
  ): () => void;
  runTransaction(updateFunction: (transaction: any) => Promise<any>): Promise<any>;
  writeBatch(): any;

  // --- Specific Domain Methods ---
  addInvoice(invoice: any): Promise<{ id: string }>;
  getInvoices(): Promise<any[]>;
  getCustomer(id: string): Promise<any>;
  savePayment(payment: any): Promise<void>;
}
