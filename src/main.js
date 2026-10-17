/* src/main.js - 함바여지도 메인 애플리케이션 엔트리포인트 */

// 1. 스타일시트 모듈 임포트
import './styles/variables.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/modal.css';

// 2. 서비스 및 유틸리티 임포트
import { HambaStorage } from './services/storage.js';
import { KakaoMapService } from './services/kakaoMap.js';
import { openModal, closeModal, initModalCloseEvents } from './utils/modal.js';
import { showToast } from './utils/toast.js';

// 3. 컴포넌트 임포트
import { HambaListComponent } from './components/hambaList.js';
import { DetailModalComponent } from './components/detailModal.js';
import { AddModalComponent } from './components/addModal.js';
import { ReviewModalComponent } from './components/reviewModal.js';

class HambaWebApp {
    constructor() {
        this.storage = new HambaStorage();
        this.mapService = new KakaoMapService();

        this.initApp();
    }

    initApp() {
        // 1. 스플래시 화면 닫기 (0.3초)
        setTimeout(() => {
            const splash = document.getElementById('splash-screen');
            if (splash) splash.classList.add('fade-out');
        }, 300);

        // 2. 모달 컴포넌트들 초기화
        this.detailModal = new DetailModalComponent(
            this.storage,
            this.mapService,
            () => this.listComponent.render()
        );

        this.addModal = new AddModalComponent(
            this.storage,
            () => {
                this.listComponent.render();
            }
        );

        this.reviewModal = new ReviewModalComponent(
            this.storage,
            () => this.detailModal.getCurrentHambaId(),
            (hambaId) => {
                this.detailModal.renderReviews(hambaId);
                this.listComponent.render();
            }
        );

        // 3. 식당 목록 컴포넌트 초기화 (지도 영역 연동)
        this.listComponent = new HambaListComponent(
            this.storage,
            this.mapService,
            (hambaId) => this.detailModal.open(hambaId),
            (filteredList) => {
                // 지도 마커는 사용자가 둘러볼 수 있도록 전체 식당 마커를 유지
                this.mapService.renderMapMarkers(this.storage.getAllHambas());
            }
        );

        // 4. 모달 공통 닫기 이벤트 바인딩
        initModalCloseEvents();

        // 5. 전역 UI 이벤트 바인딩
        this.bindEvents();

        // 6. 목록 첫 렌더링
        this.listComponent.render();

        // 7. 카카오 지도 초기화 (지도 팬/줌 이동 시 하단 바텀시트 실시간 자동 갱신)
        this.mapService.initKakaoMap(
            'map-container',
            (hambaId) => this.detailModal.open(hambaId),
            () => this.storage.getAllHambas(),
            () => this.listComponent.render()
        );

        // 8. Firebase 실시간 데이터 변경 감지 리스너 등록
        this.storage.onChange(() => {
            this.listComponent.render();
            if (this.mapService && this.mapService.kakaoMap) {
                this.mapService.renderMapMarkers(this.storage.getAllHambas());
            }
            if (this.detailModal && this.detailModal.currentSelectedHambaId) {
                this.detailModal.renderReviews(this.detailModal.currentSelectedHambaId);
            }
        });
    }

    bindEvents() {
        // 검색창 실시간 검색 (검색어 입력 시 해당 식당 위치로 지도 이동)
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const results = this.listComponent.setQuery(e.target.value);
                if (e.target.value.trim() && results && results.length > 0) {
                    this.mapService.panTo(results[0].latitude, results[0].longitude);
                }
            });
        }

        // 바텀시트 카테고리 필터 태그 클릭 (전체, 한식, 중식, 일식, 양식, 호텔, 종합)
        document.querySelectorAll('.category-tags .tag-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.category-tags .tag-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                const cat = e.currentTarget.getAttribute('data-category');
                this.listComponent.setCategory(cat);
                const filterCatSelect = document.getElementById('filter-category-select');
                if (filterCatSelect) filterCatSelect.value = cat;
            });
        });

        // 헤더 즐겨찾기 필터 버튼
        const favHeaderBtn = document.getElementById('btn-favorite-only');
        if (favHeaderBtn) {
            favHeaderBtn.addEventListener('click', () => {
                const onlyFav = this.listComponent.toggleFavoriteFilter();
                favHeaderBtn.classList.toggle('active', onlyFav);
                showToast(onlyFav ? "★ 즐겨찾기한 식당만 표시합니다." : "전체 식당을 표시합니다.");
            });
        }

        // 내 위치 (GPS) 버튼
        const myLocBtn = document.getElementById('btn-my-location');
        if (myLocBtn) {
            myLocBtn.addEventListener('click', () => {
                this.mapService.getCurrentLocation();
            });
        }

        // 바텀 시트 열기/닫기 토글
        const listPanel = document.getElementById('list-panel');
        const handleBtn = document.getElementById('panel-handle');
        const toggleBtn = document.getElementById('btn-toggle-panel');

        const togglePanel = () => {
            if (!listPanel) return;
            const isCollapsed = listPanel.classList.toggle('collapsed');
            if (toggleBtn) {
                toggleBtn.textContent = isCollapsed ? '목록 열기' : '목록 닫기';
            }
            const mapControls = document.querySelector('.map-controls');
            if (mapControls) {
                mapControls.classList.toggle('panel-collapsed', isCollapsed);
            }
        };

        if (handleBtn) handleBtn.addEventListener('click', togglePanel);
        if (toggleBtn) toggleBtn.addEventListener('click', togglePanel);

        // 새 식당 등록 버튼 (헤더 + 플로팅 FAB)
        const openAddBtn1 = document.getElementById('btn-open-add');
        const openAddBtn2 = document.getElementById('btn-fab-add');
        if (openAddBtn1) openAddBtn1.addEventListener('click', () => openModal('modal-add'));
        if (openAddBtn2) openAddBtn2.addEventListener('click', () => openModal('modal-add'));

        // 필터 모달 열기 버튼
        const openFilterBtn = document.getElementById('btn-open-filter');
        if (openFilterBtn) openFilterBtn.addEventListener('click', () => openModal('modal-filter'));

        // 필터 적용 버튼
        const applyFilterBtn = document.getElementById('btn-apply-filter');
        if (applyFilterBtn) {
            applyFilterBtn.addEventListener('click', () => {
                const catVal = document.getElementById('filter-category-select')?.value || 'ALL';
                const priceVal = document.getElementById('filter-price-select')?.value || 'ALL';
                const ratingVal = parseFloat(document.getElementById('filter-rating-select')?.value || '0');

                // 바텀시트 카테고리 태그 상태 동기화
                document.querySelectorAll('.category-tags .tag-btn').forEach(b => {
                    b.classList.toggle('active', b.getAttribute('data-category') === catVal);
                });

                this.listComponent.setCategory(catVal);
                this.listComponent.setPriceRange(priceVal);
                this.listComponent.setMinRating(ratingVal);
                closeModal('modal-filter');
                showToast("필터가 적용되었습니다.");
            });
        }

        // 필터 초기화 버튼
        const resetFilterBtn = document.getElementById('btn-reset-filter');
        if (resetFilterBtn) {
            resetFilterBtn.addEventListener('click', () => {
                const catSelect = document.getElementById('filter-category-select');
                const priceSelect = document.getElementById('filter-price-select');
                const ratingSelect = document.getElementById('filter-rating-select');
                if (catSelect) catSelect.value = 'ALL';
                if (priceSelect) priceSelect.value = 'ALL';
                if (ratingSelect) ratingSelect.value = '0';

                // 바텀시트 태그를 '전체'로 복구
                document.querySelectorAll('.category-tags .tag-btn').forEach(b => {
                    b.classList.toggle('active', b.getAttribute('data-category') === 'ALL');
                });

                this.listComponent.resetFilter();
                closeModal('modal-filter');
                showToast("필터가 초기화되었습니다.");
            });
        }

        // 리뷰 작성 모달 열기 버튼 (식당 상세 모달 내부)
        const writeReviewBtn = document.getElementById('btn-write-review');
        if (writeReviewBtn) {
            writeReviewBtn.addEventListener('click', () => openModal('modal-review'));
        }
    }
}

// 브라우저 DOM 로드 시 앱 기동
document.addEventListener('DOMContentLoaded', () => {
    window.app = new HambaWebApp();
});