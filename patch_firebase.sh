sed -i 's/await fsUpdateDoc(docRef, cleaned);/await fsSetDoc(docRef, cleaned, { merge: true });/g' src/data/FirebaseProvider.ts
