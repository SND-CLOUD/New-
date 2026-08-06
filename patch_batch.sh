sed -i 's/batch.update(ref, this.prepareDataForFirestore(data));/batch.set(ref, this.prepareDataForFirestore(data), { merge: true });/g' src/data/FirebaseProvider.ts
