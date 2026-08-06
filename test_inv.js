import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, deleteDoc } from "firebase/firestore";
// Cannot do this without config... Wait, let's just create a script that queries sqlite?
