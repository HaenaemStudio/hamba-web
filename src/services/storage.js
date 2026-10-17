/* src/services/storage.js - Firebase Firestore 실시간 클라우드 DB 연동 서비스 */
import { db } from './firebase.js';
import { 
    collection, 
    doc, 
    setDoc, 
    deleteDoc, 
    onSnapshot, 
    writeBatch 
} from 'firebase/firestore';
import { INITIAL_HAMBA_DATA, INITIAL_REVIEWS } from '../data/initialData.js';

export class HambaStorage {
    constructor() {
        this.KEY_LOCAL_HAMBA = 'hamba_standalone_data_list';
        this.KEY_LOCAL_REVIEWS = 'hamba_standalone_review_list';
        this.KEY_FAVORITES = 'hamba_user_favorites';

        // 1. 빠른 초기 렌더링을 위한 로컬 캐시 초기화
        this.cachedHambas = this.loadInitialHambas();
        this.cachedReviews = this.loadInitialReviews();
        this.listeners = [];
        this.isInitialized = false;

        // 2. Firebase 실시간 리스너 구독 시작
        this.initFirebaseListeners();
    }

    /* 로컬 캐시 로드 (오프라인 및 즉시 렌더링용) */
    loadInitialHambas() {
        try {
            const raw = localStorage.getItem(this.KEY_LOCAL_HAMBA);
            return raw ? JSON.parse(raw) : INITIAL_HAMBA_DATA;
        } catch (e) {
            return INITIAL_HAMBA_DATA;
        }
    }

    loadInitialReviews() {
        try {
            const raw = localStorage.getItem(this.KEY_LOCAL_REVIEWS);
            return raw ? JSON.parse(raw) : INITIAL_REVIEWS;
        } catch (e) {
            return INITIAL_REVIEWS;
        }
    }

    /* 변경 감지 리스너 등록 */
    onChange(callback) {
        if (typeof callback === 'function') {
            this.listeners.push(callback);
        }
    }

    notifyListeners() {
        this.listeners.forEach(cb => {
            try {
                cb();
            } catch (err) {
                console.error("Listener error:", err);
            }
        });
    }

    /* 사용자 즐겨찾기 (개인 브라우저 LocalStorage에 보관) */
    getFavoriteIds() {
        try {
            const raw = localStorage.getItem(this.KEY_FAVORITES);
            return new Set(raw ? JSON.parse(raw) : []);
        } catch (e) {
            return new Set();
        }
    }

    saveFavoriteIds(favSet) {
        try {
            localStorage.setItem(this.KEY_FAVORITES, JSON.stringify(Array.from(favSet)));
        } catch (e) {
            console.error(e);
        }
    }

    toggleFavorite(id) {
        const numId = parseInt(id);
        const favSet = this.getFavoriteIds();
        let isFav = false;

        if (favSet.has(numId)) {
            favSet.delete(numId);
            isFav = false;
        } else {
            favSet.add(numId);
            isFav = true;
        }

        this.saveFavoriteIds(favSet);
        this.notifyListeners();
        return isFav;
    }

    /* Firebase Firestore 실시간 리스너 */
    initFirebaseListeners() {
        try {
            const hambasCol = collection(db, 'hambas');
            const reviewsCol = collection(db, 'reviews');

            // 1. 식당 데이터 실시간 동기화
            onSnapshot(hambasCol, (snapshot) => {
                if (snapshot.empty && !this.isInitialized) {
                    console.log("Firestore hambas is empty. Seeding initial data...");
                    this.seedInitialData();
                    return;
                }

                this.isInitialized = true;
                const items = [];
                snapshot.forEach(docSnap => {
                    items.push(docSnap.data());
                });

                // ID 순 정렬
                items.sort((a, b) => (b.id || 0) - (a.id || 0));

                this.cachedHambas = items;
                localStorage.setItem(this.KEY_LOCAL_HAMBA, JSON.stringify(items));
                this.notifyListeners();
            }, (error) => {
                console.warn("Firestore hambas listener error (using cache):", error);
            });

            // 2. 리뷰 데이터 실시간 동기화
            onSnapshot(reviewsCol, (snapshot) => {
                const reviews = [];
                snapshot.forEach(docSnap => {
                    reviews.push(docSnap.data());
                });

                reviews.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                this.cachedReviews = reviews;
                localStorage.setItem(this.KEY_LOCAL_REVIEWS, JSON.stringify(reviews));
                this.notifyListeners();
            }, (error) => {
                console.warn("Firestore reviews listener error (using cache):", error);
            });

        } catch (err) {
            console.error("Failed to connect Firebase Firestore:", err);
        }
    }

    /* 최초 1회: 기존 기본 식당 및 리뷰를 Firestore에 자동 업로드 */
    async seedInitialData() {
        try {
            const batch = writeBatch(db);

            // 기본 식당 데이터 업로드
            INITIAL_HAMBA_DATA.forEach(item => {
                const docRef = doc(db, 'hambas', String(item.id));
                batch.set(docRef, item);
            });

            // 기본 리뷰 데이터 업로드
            INITIAL_REVIEWS.forEach(review => {
                const docRef = doc(db, 'reviews', String(review.id));
                batch.set(docRef, review);
            });

            await batch.commit();
            console.log("Successfully seeded initial data to Firestore!");
        } catch (e) {
            console.error("Error seeding initial data to Firestore:", e);
        }
    }

    /* 전체 식당 조회 (평점/리뷰수/즐겨찾기 결합) */
    getAllHambas() {
        const favSet = this.getFavoriteIds();
        const allReviews = this.cachedReviews;

        return this.cachedHambas.map(item => {
            const itemReviews = allReviews.filter(r => r.hambaId === item.id);
            const count = itemReviews.length;
            let rating = 5.0;
            if (count > 0) {
                const avg = itemReviews.reduce((sum, r) => sum + r.rating, 0) / count;
                rating = parseFloat(avg.toFixed(1));
            }

            return {
                ...item,
                category: item.category || "한식",
                reviewCount: count,
                rating: rating,
                isFavorite: favSet.has(item.id)
            };
        });
    }

    getHambaById(id) {
        return this.getAllHambas().find(item => item.id === parseInt(id));
    }

    /* 식당 추가 */
    async addHamba(data) {
        const currentMaxId = this.cachedHambas.reduce((max, h) => Math.max(max, h.id || 0), 4);
        const nextId = currentMaxId + 1;

        const newHamba = {
            ...data,
            id: nextId,
            category: data.category || "한식",
            rating: 5.0,
            reviewCount: 0,
            createdAt: Date.now()
        };

        // 로컬 캐시 즉시 반영
        this.cachedHambas.unshift(newHamba);
        this.notifyListeners();

        // Firebase Firestore에 저장
        try {
            await setDoc(doc(db, 'hambas', String(nextId)), newHamba);
        } catch (e) {
            console.error("Failed to add hamba to Firestore:", e);
        }

        return newHamba;
    }

    /* 식당 수정 */
    async updateHamba(id, updateData) {
        const numId = parseInt(id);
        const index = this.cachedHambas.findIndex(h => h.id === numId);
        if (index !== -1) {
            this.cachedHambas[index] = { ...this.cachedHambas[index], ...updateData };
            this.notifyListeners();
        }

        try {
            await setDoc(doc(db, 'hambas', String(numId)), updateData, { merge: true });
            return this.cachedHambas[index];
        } catch (e) {
            console.error("Failed to update hamba in Firestore:", e);
            return null;
        }
    }

    /* 식당 삭제 */
    async deleteHamba(id) {
        const numId = parseInt(id);
        this.cachedHambas = this.cachedHambas.filter(h => h.id !== numId);
        this.notifyListeners();

        try {
            await deleteDoc(doc(db, 'hambas', String(numId)));
            return true;
        } catch (e) {
            console.error("Failed to delete hamba from Firestore:", e);
            return false;
        }
    }

    /* 전체 리뷰 조회 */
    getAllReviews() {
        return this.cachedReviews;
    }

    /* 특정 식당 리뷰 조회 */
    getReviewsForHamba(hambaId) {
        const numId = parseInt(hambaId);
        return this.cachedReviews
            .filter(r => r.hambaId === numId)
            .sort((a, b) => b.createdAt - a.createdAt);
    }

    /* 리뷰 추가 */
    async addReview(hambaId, reviewData) {
        const reviewId = Date.now();
        const newReview = {
            id: reviewId,
            hambaId: parseInt(hambaId),
            author: reviewData.author || "익명 손님",
            rating: parseFloat(reviewData.rating),
            content: reviewData.content,
            createdAt: reviewId
        };

        this.cachedReviews.unshift(newReview);
        this.notifyListeners();

        try {
            await setDoc(doc(db, 'reviews', String(reviewId)), newReview);
        } catch (e) {
            console.error("Failed to add review to Firestore:", e);
        }

        return newReview;
    }

    /* 리뷰 삭제 */
    async deleteReview(reviewId) {
        const numId = parseInt(reviewId);
        this.cachedReviews = this.cachedReviews.filter(r => r.id !== numId);
        this.notifyListeners();

        try {
            await deleteDoc(doc(db, 'reviews', String(numId)));
            return true;
        } catch (e) {
            console.error("Failed to delete review from Firestore:", e);
            return false;
        }
    }
}