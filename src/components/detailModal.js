/* src/components/detailModal.js - 식당 상세 정보 및 리뷰 목록 모달 컴포넌트 */
import { openModal } from '../utils/modal.js';
import { showToast } from '../utils/toast.js';

export class DetailModalComponent {
    constructor(storage, mapService, onFavoriteChange) {
        this.storage = storage;
        this.mapService = mapService;
        this.onFavoriteChange = onFavoriteChange;
        this.currentSelectedHambaId = null;

        this.initEvents();
    }

    initEvents() {
        const detailBookmarkBtn = document.getElementById('detail-bookmark');
        if (detailBookmarkBtn) {
            detailBookmarkBtn.addEventListener('click', () => {
                if (this.currentSelectedHambaId) {
                    const isFav = this.storage.toggleFavorite(this.currentSelectedHambaId);
                    detailBookmarkBtn.className = `bookmark-btn ${isFav ? 'active' : ''}`;
                    detailBookmarkBtn.textContent = isFav ? '♥' : '♡';
                    if (this.onFavoriteChange) this.onFavoriteChange();
                    showToast(isFav ? "♥ 즐겨찾기에 추가되었습니다." : "즐겨찾기에서 해제되었습니다.");
                }
            });
        }
    }

    open(id) {
        const hamba = this.storage.getHambaById(id);
        if (!hamba) return;

        this.currentSelectedHambaId = hamba.id;

        const nameEl = document.getElementById('detail-name');
        const titleEl = document.getElementById('detail-title');
        const categoryEl = document.getElementById('detail-category');
        const addressEl = document.getElementById('detail-address');
        const lunchPriceEl = document.getElementById('detail-lunch-price');
        const dinnerPriceEl = document.getElementById('detail-dinner-price');
        const hoursEl = document.getElementById('detail-hours');
        const descEl = document.getElementById('detail-desc');
        const imgEl = document.getElementById('detail-image');
        const favBtn = document.getElementById('detail-bookmark');

        if (nameEl) nameEl.textContent = hamba.name;
        if (titleEl) titleEl.textContent = hamba.name;
        if (categoryEl) categoryEl.textContent = hamba.category || '한식';
        if (addressEl) addressEl.textContent = hamba.address;
        if (lunchPriceEl) lunchPriceEl.textContent = `${hamba.lunchPrice.toLocaleString()}원`;
        if (dinnerPriceEl) dinnerPriceEl.textContent = hamba.dinnerPrice ? `${hamba.dinnerPrice.toLocaleString()}원` : '점심과 동일';
        if (hoursEl) hoursEl.textContent = `${hamba.openTime || '06:00'} - ${hamba.closeTime || '19:30'}`;
        if (descEl) descEl.textContent = hamba.description || '등록된 상세 설명이 없습니다.';

        if (imgEl) {
            imgEl.src = (hamba.imageUrls && hamba.imageUrls.length > 0)
                ? hamba.imageUrls[0]
                : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
        }

        if (favBtn) {
            favBtn.className = `bookmark-btn ${hamba.isFavorite ? 'active' : ''}`;
            favBtn.textContent = hamba.isFavorite ? '♥' : '♡';
        }

        this.renderReviews(hamba.id);

        if (this.mapService) {
            this.mapService.panTo(hamba.latitude, hamba.longitude);
        }

        openModal('modal-detail');
    }

    renderReviews(hambaId) {
        const reviewListContainer = document.getElementById('detail-review-list');
        const countSpan = document.getElementById('detail-review-count');
        if (!reviewListContainer || !countSpan) return;

        const reviews = this.storage.getReviewsForHamba(hambaId);

        countSpan.textContent = reviews.length;
        reviewListContainer.innerHTML = '';

        if (reviews.length === 0) {
            reviewListContainer.innerHTML = `
                <div style="font-size:13px; color:var(--text-muted); padding:10px 0; text-align:center;">
                    첫 번째 방문 리뷰를 직접 남겨보세요!
                </div>
            `;
            return;
        }

        reviews.forEach(r => {
            const item = document.createElement('div');
            item.style.cssText = "background:var(--bg-main); padding:10px 12px; border-radius:var(--radius-sm); font-size:13px;";
            item.innerHTML = `
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                    <span style="font-weight:700; color:var(--text-primary);">${r.author}</span>
                    <span style="color:var(--star-color); font-weight:700;">★ ${r.rating.toFixed(1)}</span>
                </div>
                <div style="color:var(--text-secondary); line-height:1.4;">${r.content}</div>
            `;
            reviewListContainer.appendChild(item);
        });
    }

    getCurrentHambaId() {
        return this.currentSelectedHambaId;
    }
}