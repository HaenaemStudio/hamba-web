/* src/components/hambaList.js - 식당 목록 렌더링 및 필터링 컴포넌트 */
import { showToast } from '../utils/toast.js';

export class HambaListComponent {
    constructor(storage, mapService, onSelectHamba, onUpdateMap) {
        this.storage = storage;
        this.mapService = mapService;
        this.onSelectHamba = onSelectHamba;
        this.onUpdateMap = onUpdateMap;

        this.filterState = {
            query: '',
            category: 'ALL',
            priceRange: 'ALL',
            minRating: 0,
            onlyFavorites: false
        };
    }

    getFilteredList() {
        let list = this.storage.getAllHambas();

        // 1. 검색어가 있을 때는 전체 식당 중 검색
        if (this.filterState.query.trim()) {
            const q = this.filterState.query.toLowerCase();
            list = list.filter(h => 
                h.name.toLowerCase().includes(q) || 
                h.address.toLowerCase().includes(q) ||
                (h.description && h.description.toLowerCase().includes(q))
            );
        } else if (this.mapService && this.mapService.kakaoMap) {
            // 2. 검색어가 없을 때는 현재 지도 화면 영역(Bounds) 안에 있는 식당만 표시!
            list = list.filter(h => this.mapService.isWithinBounds(h.latitude, h.longitude));
        }

        // 카테고리 필터링 (한식, 중식, 일식, 양식, 호텔, 종합)
        if (this.filterState.category && this.filterState.category !== 'ALL') {
            list = list.filter(h => (h.category || '한식') === this.filterState.category);
        }

        if (this.filterState.priceRange !== 'ALL') {
            list = list.filter(h => {
                const avgPrice = (h.lunchPrice + (h.dinnerPrice || h.lunchPrice)) / 2;
                if (this.filterState.priceRange === 'UNDER_10K') return avgPrice <= 10000;
                if (this.filterState.priceRange === 'RANGE_10K_20K') return avgPrice > 10000 && avgPrice <= 20000;
                if (this.filterState.priceRange === 'OVER_20K') return avgPrice > 20000;
                return true;
            });
        }

        if (this.filterState.minRating > 0) {
            list = list.filter(h => h.rating >= this.filterState.minRating);
        }

        if (this.filterState.onlyFavorites) {
            list = list.filter(h => h.isFavorite);
        }

        return list;
    }

    render() {
        const listContainer = document.getElementById('hamba-list');
        const countSpan = document.getElementById('hamba-count');
        if (!listContainer || !countSpan) return;

        const filteredList = this.getFilteredList();

        countSpan.textContent = `${filteredList.length}개`;
        listContainer.innerHTML = '';

        if (filteredList.length === 0) {
            listContainer.innerHTML = `
                <div style="text-align:center; padding: 36px 16px; color: var(--text-muted);">
                    <p style="font-size:32px; margin-bottom:8px;">🗺️</p>
                    <p style="font-weight:700; font-size:15px; color:var(--text-primary); margin-bottom:4px;">현재 지도 화면에 등록된 식당이 없습니다</p>
                    <p style="font-size:12.5px; margin-bottom:16px; line-height:1.5;">지도를 식당이 있는 지역으로 이동하거나<br>등록된 전체 식당을 한눈에 확인해 보세요.</p>
                    <button id="btn-fit-all-hambas" class="tag-btn active" style="margin:0 auto; padding:8px 18px; font-size:13px; font-weight:700; border-radius:999px;">🗺️ 등록된 전체 식당 모아보기</button>
                </div>
            `;
            const fitBtn = document.getElementById('btn-fit-all-hambas');
            if (fitBtn && this.mapService) {
                fitBtn.addEventListener('click', () => {
                    this.mapService.fitAllMarkers(this.storage.getAllHambas());
                });
            }
            return;
        }

        filteredList.forEach(hamba => {
            const card = document.createElement('div');
            card.className = 'hamba-card';
            const imgUrl = (hamba.imageUrls && hamba.imageUrls.length > 0) 
                ? hamba.imageUrls[0] 
                : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';

            card.innerHTML = `
                <img src="${imgUrl}" class="card-img" alt="${hamba.name}">
                <div class="card-info">
                    <div class="card-header">
                        <span class="card-name">
                            <span class="card-badge-category">${hamba.category || '한식'}</span>
                            ${hamba.name}
                        </span>
                        <button class="bookmark-btn ${hamba.isFavorite ? 'active' : ''}" data-id="${hamba.id}">
                            ${hamba.isFavorite ? '♥' : '♡'}
                        </button>
                    </div>
                    <div class="card-address">${hamba.address}</div>
                    <div class="card-meta">
                        <div class="meta-rating">
                            <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                            <span>${hamba.rating.toFixed(1)}</span>
                            <span style="color:var(--text-muted); font-weight:400;">(${hamba.reviewCount})</span>
                        </div>
                        <div class="meta-price">${hamba.lunchPrice.toLocaleString()}원</div>
                    </div>
                </div>
            `;

            card.querySelector('.bookmark-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                const isFav = this.storage.toggleFavorite(hamba.id);
                this.render();
                showToast(isFav ? "♥ 즐겨찾기에 추가되었습니다." : "즐겨찾기에서 해제되었습니다.");
            });

            card.addEventListener('click', () => {
                if (this.onSelectHamba) this.onSelectHamba(hamba.id);
            });

            listContainer.appendChild(card);
        });

        if (this.onUpdateMap) {
            this.onUpdateMap(filteredList);
        }
    }

    setCategory(category) {
        this.filterState.category = category;
        this.render();
    }

    setQuery(query) {
        this.filterState.query = query;
        this.render();
    }

    setPriceRange(range) {
        this.filterState.priceRange = range;
        this.render();
    }

    setMinRating(rating) {
        this.filterState.minRating = rating;
        this.render();
    }

    toggleFavoriteFilter() {
        this.filterState.onlyFavorites = !this.filterState.onlyFavorites;
        this.render();
        return this.filterState.onlyFavorites;
    }

    resetFilter() {
        this.filterState.category = 'ALL';
        this.filterState.priceRange = 'ALL';
        this.filterState.minRating = 0;
        this.render();
    }
}