/* app.js - 함바여지도 웹 전용 메인 스크립트 (file:// 프로토콜 및 Kakao SDK 도메인 제한 완벽 방어형) */

// 1. 초기 샘플 데이터
const INITIAL_HAMBA_DATA = [
    {
        id: 1,
        name: "해냄 한식 뷔페",
        address: "서울특별시 구로구 디지털로 300 (구로동)",
        latitude: 37.4851,
        longitude: 126.9015,
        lunchPrice: 8000,
        dinnerPrice: 8500,
        openTime: "06:00",
        closeTime: "19:30",
        rating: 4.8,
        reviewCount: 14,
        description: "매일 바뀌는 12가지 한식 반찬과 직화 제육볶음, 가마솥 제철 국 제공! 건설 현장 및 직장인 대표 추천 맛집입니다.",
        imageUrls: ["https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80"],
        isFavorite: true,
        createdAt: Date.now() - 86400000 * 5
    },
    {
        id: 2,
        name: "성수 대박 함바식당",
        address: "서울특별시 성동구 성수이로 118",
        latitude: 37.5445,
        longitude: 127.0560,
        lunchPrice: 7500,
        dinnerPrice: 7500,
        openTime: "05:30",
        closeTime: "19:00",
        rating: 4.6,
        reviewCount: 9,
        description: "신선한 가성비 한식 뷔페! 갓 튀긴 수제 돈가스와 따뜻한 숭늉이 항시 준비되어 있습니다.",
        imageUrls: ["https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80"],
        isFavorite: false,
        createdAt: Date.now() - 86400000 * 3
    },
    {
        id: 3,
        name: "강남 빌딩 함바 한식뷔페",
        address: "서울특별시 강남구 테헤란로 152",
        latitude: 37.5000,
        longitude: 127.0360,
        lunchPrice: 9500,
        dinnerPrice: 10000,
        openTime: "06:30",
        closeTime: "20:00",
        rating: 4.9,
        reviewCount: 28,
        description: "강남 직장인들의 성지! 셀프 한강라면 머신과 계란후라이 무한리필 코너 운영 중.",
        imageUrls: ["https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80"],
        isFavorite: true,
        createdAt: Date.now() - 86400000 * 10
    },
    {
        id: 4,
        name: "여의도 프리미엄 뷔페 식당",
        address: "서울특별시 영등포구 여의나루로 60",
        latitude: 37.5250,
        longitude: 126.9240,
        lunchPrice: 11000,
        dinnerPrice: 12000,
        openTime: "07:00",
        closeTime: "19:00",
        rating: 4.5,
        reviewCount: 6,
        description: "깔끔하고 세련된 분위기의 고급 한식 뷔페. 샐러드 바와 후식 디저트 제공.",
        imageUrls: ["https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=80"],
        isFavorite: false,
        createdAt: Date.now() - 86400000 * 2
    }
];

const INITIAL_REVIEWS = [
    {
        id: 101,
        hambaId: 1,
        author: "현장소장킴",
        rating: 5,
        content: "제육볶음 간도 딱 맞고 반찬이 매일 바뀌어서 질리지 않고 아주 맛있습니다!",
        createdAt: Date.now() - 86400000 * 2
    },
    {
        id: 102,
        hambaId: 1,
        author: "구로디지털직장인",
        rating: 4.5,
        content: "8000원에 이 정도 퀄리티면 근처 점심 식당 중 단연 최고입니다.",
        createdAt: Date.now() - 86400000 * 1
    }
];

// 2. 로컬 스토리지 클래스 (HambaStorage)
class HambaStorage {
    constructor() {
        this.KEY_HAMBA = 'hamba_standalone_data_list';
        this.KEY_REVIEWS = 'hamba_standalone_review_list';
        this.KEY_NEXT_ID = 'hamba_standalone_next_id';

        this.initStorage();
    }

    initStorage() {
        if (!localStorage.getItem(this.KEY_HAMBA)) {
            localStorage.setItem(this.KEY_HAMBA, JSON.stringify(INITIAL_HAMBA_DATA));
            localStorage.setItem(this.KEY_NEXT_ID, '5');
        }
        if (!localStorage.getItem(this.KEY_REVIEWS)) {
            localStorage.setItem(this.KEY_REVIEWS, JSON.stringify(INITIAL_REVIEWS));
        }
    }

    getAllHambas() {
        try {
            return JSON.parse(localStorage.getItem(this.KEY_HAMBA)) || INITIAL_HAMBA_DATA;
        } catch (e) {
            return INITIAL_HAMBA_DATA;
        }
    }

    saveAllHambas(list) {
        try {
            localStorage.setItem(this.KEY_HAMBA, JSON.stringify(list));
        } catch(e) {
            console.error(e);
        }
    }

    getHambaById(id) {
        return this.getAllHambas().find(item => item.id === parseInt(id));
    }

    addHamba(data) {
        const list = this.getAllHambas();
        let nextId = parseInt(localStorage.getItem(this.KEY_NEXT_ID) || '5');
        const newHamba = {
            ...data,
            id: nextId,
            rating: 5.0,
            reviewCount: 0,
            isFavorite: false,
            createdAt: Date.now()
        };
        list.unshift(newHamba);
        this.saveAllHambas(list);
        localStorage.setItem(this.KEY_NEXT_ID, (nextId + 1).toString());
        return newHamba;
    }

    toggleFavorite(id) {
        const list = this.getAllHambas();
        const item = list.find(h => h.id === parseInt(id));
        if (item) {
            item.isFavorite = !item.isFavorite;
            this.saveAllHambas(list);
            return item.isFavorite;
        }
        return false;
    }

    getAllReviews() {
        try {
            return JSON.parse(localStorage.getItem(this.KEY_REVIEWS)) || INITIAL_REVIEWS;
        } catch (e) {
            return INITIAL_REVIEWS;
        }
    }

    getReviewsForHamba(hambaId) {
        return this.getAllReviews()
            .filter(r => r.hambaId === parseInt(hambaId))
            .sort((a, b) => b.createdAt - a.createdAt);
    }

    addReview(hambaId, reviewData) {
        const reviews = this.getAllReviews();
        const newReview = {
            id: Date.now(),
            hambaId: parseInt(hambaId),
            author: reviewData.author || "익명 손님",
            rating: parseFloat(reviewData.rating),
            content: reviewData.content,
            createdAt: Date.now()
        };
        reviews.unshift(newReview);
        try {
            localStorage.setItem(this.KEY_REVIEWS, JSON.stringify(reviews));
        } catch(e) {}
        this.updateHambaRating(hambaId);
        return newReview;
    }

    updateHambaRating(hambaId) {
        const reviews = this.getReviewsForHamba(hambaId);
        if (reviews.length === 0) return;
        const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        
        const list = this.getAllHambas();
        const target = list.find(h => h.id === parseInt(hambaId));
        if (target) {
            target.rating = parseFloat(avg.toFixed(1));
            target.reviewCount = reviews.length;
            this.saveAllHambas(list);
        }
    }
}

// 3. 메인 앱 애플리케이션 클래스 (HambaWebApp)
class HambaWebApp {
    constructor() {
        this.storage = new HambaStorage();
        this.kakaoMap = null;
        this.markers = [];
        this.currentSelectedHambaId = null;

        this.filterState = {
            query: '',
            priceRange: 'ALL',
            minRating: 0,
            onlyFavorites: false
        };

        this.initApp();
    }

    initApp() {
        // 1. 스플래시 화면 닫기 (0.3초)
        setTimeout(() => {
            const splash = document.getElementById('splash-screen');
            if (splash) splash.classList.add('fade-out');
        }, 300);

        // 2. 이벤트 바인딩 & 리스트 렌더링 먼저 수행 (에러 방어)
        try {
            this.bindEvents();
        } catch (e) {
            console.error("이벤트 바인딩 중 예외:", e);
        }

        try {
            this.renderHambaList();
        } catch (e) {
            console.error("리스트 렌더링 중 예외:", e);
        }

        // 3. 카카오 지도 안전 초기화 (예외 발생 시 폴백 인터랙티브 지도 작동)
        try {
            this.initKakaoMap();
        } catch (e) {
            console.warn("카카오 지도 초기화 예외 발생, 폴백 인터랙티브 지도를 생성합니다:", e);
            this.renderFallbackMap();
        }
    }

    initKakaoMap() {
        const container = document.getElementById('map-container');
        if (!container) return;

        let attempts = 0;
        const maxAttempts = 30; // 3초간 시도 (100ms * 30)
        let isLoaded = false;

        const tryInitMap = () => {
            attempts++;

            if (window.kakao && window.kakao.maps) {
                if (typeof kakao.maps.load === 'function' && !isLoaded) {
                    isLoaded = true;

                    // kakao.maps.load 콜백 타임아웃 방어 (2.5초 이내 미응답 시 도메인/키 인증 오류 판단)
                    const loadTimeout = setTimeout(() => {
                        console.warn("kakao.maps.load 콜백 타임아웃 (카카오 도메인 미승인 또는 AppKey 불일치)");
                        this.useFallbackMap = true;
                        this.renderFallbackMap("카카오 디벨로퍼스 웹 도메인(http://localhost:3000) 등록/저장 확인 필요");
                    }, 2500);

                    kakao.maps.load(() => {
                        clearTimeout(loadTimeout);
                        try {
                            container.innerHTML = '';
                            const defaultPosition = new kakao.maps.LatLng(37.4851, 126.9015);
                            const options = {
                                center: defaultPosition,
                                level: 5
                            };

                            this.kakaoMap = new kakao.maps.Map(container, options);
                            this.useFallbackMap = false;
                            this.getCurrentLocation();
                            this.renderMapMarkers();
                            console.log("✅ 카카오 지도 실시간 연동 성공!");
                            this.showToast("🗺️ 카카오 지도가 성공적으로 연동되었습니다.");
                        } catch (err) {
                            console.warn("카카오 지도 인스턴스 생성 실패 (도메인 미인증 등):", err);
                            this.useFallbackMap = true;
                            this.renderFallbackMap("Kakao API 인증 실패 (도메인/키 확인 필요)");
                        }
                    });
                    return;
                } else if (window.kakao.maps.Map) {
                    try {
                        container.innerHTML = '';
                        const defaultPosition = new kakao.maps.LatLng(37.4851, 126.9015);
                        const options = {
                            center: defaultPosition,
                            level: 5
                        };

                        this.kakaoMap = new kakao.maps.Map(container, options);
                        this.useFallbackMap = false;
                        this.getCurrentLocation();
                        this.renderMapMarkers();
                        console.log("✅ 카카오 지도 실시간 연동 성공!");
                        this.showToast("🗺️ 카카오 지도가 성공적으로 연동되었습니다.");
                        return;
                    } catch (err) {
                        console.warn("카카오 지도 생성 중 오류:", err);
                        this.useFallbackMap = true;
                        this.renderFallbackMap("Kakao API 생성 오류: " + (err.message || "도메인 미인증"));
                        return;
                    }
                }
            }

            if (attempts < maxAttempts) {
                setTimeout(tryInitMap, 100);
            } else {
                console.warn("카카오 지도 SDK 로드 타임아웃, 폴백 지도를 렌더링합니다.");
                this.useFallbackMap = true;
                const isFile = window.location.protocol === 'file:';
                const reason = isFile ? "로컬 파일(file://) 프로토콜 탐지" : "Kakao Developers 도메인(http://localhost:3000) 승인 필요";
                this.renderFallbackMap(reason);
            }
        };

        tryInitMap();
    }

    renderFallbackMap(reason = "") {
        const container = document.getElementById('map-container');
        if (!container) return;

        const list = this.getFilteredList();

        let pinsHtml = '';
        list.forEach((hamba, idx) => {
            const leftPercent = 20 + ((idx * 22 + hamba.id * 15) % 65);
            const topPercent = 25 + ((idx * 18 + hamba.id * 12) % 55);

            pinsHtml += `
                <div class="fallback-pin" data-id="${hamba.id}" style="position:absolute; left:${leftPercent}%; top:${topPercent}%; transform:translate(-50%, -100%); cursor:pointer; z-index:10; transition:transform 0.2s ease;">
                    <div style="background:var(--surface); border:2px solid var(--primary); padding:6px 12px; border-radius:14px; box-shadow:0 6px 16px rgba(0,0,0,0.15); display:flex; align-items:center; gap:6px; white-space:nowrap;">
                        <span style="font-size:16px;">🍱</span>
                        <span style="font-weight:800; font-size:13px; color:var(--text-primary);">${hamba.name}</span>
                        <span style="font-weight:800; font-size:13px; color:var(--primary);">${hamba.lunchPrice.toLocaleString()}원</span>
                    </div>
                    <div style="width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-top:8px solid var(--primary); margin:0 auto;"></div>
                </div>
            `;
        });

        const isFile = window.location.protocol === 'file:';
        const displayMessage = isFile 
            ? "🌐 로컬 파일(file://) 인터랙티브 지도 모드" 
            : `⚠️ 카카오 지도 API 대기 중 (${reason || '도메인 승인 확인 필요'})`;

        container.innerHTML = `
            <div style="position:relative; width:100%; height:100%; background:#E5E9F0; overflow:hidden; user-select:none;">
                <!-- 안내 배너 -->
                <div style="position:absolute; top:80px; left:50%; transform:translateX(-50%); background:rgba(25,31,40,0.9); color:#FFF; padding:10px 20px; border-radius:24px; font-size:13px; font-weight:600; z-index:50; backdrop-filter:blur(8px); display:flex; align-items:center; gap:12px; box-shadow:0 8px 24px rgba(0,0,0,0.2); max-width:90%; text-align:center;">
                    <span>${displayMessage}</span>
                    <button id="btn-retry-kakao" style="background:var(--primary); color:#fff; border:none; padding:4px 10px; border-radius:12px; font-size:12px; font-weight:700; cursor:pointer; font-family:inherit;">🔄 지도 재연동</button>
                </div>

                <!-- 그래픽 지도 배경 -->
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#D8DEE9" stroke-width="1"/>
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="#E5E9F0" />
                    <rect width="100%" height="100%" fill="url(#grid)" />
                    <!-- 가상 도로 및 강 라인 -->
                    <path d="M-100 250 Q 300 180 800 320 T 1500 200" stroke="#88C0D0" stroke-width="24" fill="none" opacity="0.6"/>
                    <path d="M 200 -50 L 350 800" stroke="#FFFFFF" stroke-width="16" fill="none"/>
                    <path d="M 600 -50 L 500 800" stroke="#FFFFFF" stroke-width="12" fill="none"/>
                    <path d="M -50 400 L 1200 450" stroke="#FFFFFF" stroke-width="20" fill="none"/>
                </svg>

                ${pinsHtml}
            </div>
        `;

        // 지도 재연동 버튼 이벤트
        const retryBtn = document.getElementById('btn-retry-kakao');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                this.showToast("🔄 카카오 지도 연결을 다시 시도합니다...");
                this.initKakaoMap();
            });
        }

        // 핀 클릭 이벤트 바인딩
        container.querySelectorAll('.fallback-pin').forEach(pin => {
            pin.addEventListener('click', () => {
                const id = pin.getAttribute('data-id');
                this.openDetailModal(id);
            });
            pin.addEventListener('mouseenter', () => {
                pin.style.transform = 'translate(-50%, -108%) scale(1.08)';
            });
            pin.addEventListener('mouseleave', () => {
                pin.style.transform = 'translate(-50%, -100%) scale(1)';
            });
        });
    }

    getCurrentLocation() {
        if (navigator.geolocation && this.kakaoMap) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    const locPosition = new kakao.maps.LatLng(lat, lng);
                    this.kakaoMap.setCenter(locPosition);
                    this.showToast("📍 내 위치로 지도가 이동되었습니다.");
                },
                () => {
                    console.log("GPS 위치 획득 불가");
                }
            );
        } else {
            this.showToast("📍 내 위치 탐색 완료");
        }
    }

    renderMapMarkers() {
        if (!this.kakaoMap) return;

        // 기존 마커 및 오버레이 제거
        this.markers.forEach(m => m.setMap(null));
        this.markers = [];

        const list = this.getFilteredList();

        list.forEach(hamba => {
            const position = new kakao.maps.LatLng(hamba.latitude, hamba.longitude);

            // 기본 마커 생성
            const marker = new kakao.maps.Marker({
                position: position,
                clickable: true
            });
            marker.setMap(this.kakaoMap);
            this.markers.push(marker);

            // 커스텀 커스텀 오버레이 (식당 이름 & 가격 표출)
            const content = document.createElement('div');
            content.className = 'kakao-custom-overlay';
            content.style.cssText = 'cursor:pointer; transform:translateY(-48px);';
            content.innerHTML = `
                <div style="background:#FFFFFF; border:2px solid var(--primary, #F15A24); padding:5px 11px; border-radius:16px; box-shadow:0 4px 14px rgba(0,0,0,0.2); font-family:Pretendard, sans-serif; display:flex; align-items:center; gap:6px; white-space:nowrap;">
                    <span style="font-size:14px;">🍱</span>
                    <span style="font-weight:700; font-size:13px; color:#191F28;">${hamba.name}</span>
                    <span style="font-weight:800; font-size:13px; color:var(--primary, #F15A24);">${hamba.lunchPrice.toLocaleString()}원</span>
                </div>
                <div style="width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-top:8px solid var(--primary, #F15A24); margin:0 auto;"></div>
            `;

            content.addEventListener('click', () => {
                this.openDetailModal(hamba.id);
            });

            const customOverlay = new kakao.maps.CustomOverlay({
                position: position,
                content: content,
                yAnchor: 1
            });

            customOverlay.setMap(this.kakaoMap);
            this.markers.push(customOverlay);

            kakao.maps.event.addListener(marker, 'click', () => {
                this.openDetailModal(hamba.id);
            });
        });
    }

    getFilteredList() {
        let list = this.storage.getAllHambas();

        if (this.filterState.query.trim()) {
            const q = this.filterState.query.toLowerCase();
            list = list.filter(h => 
                h.name.toLowerCase().includes(q) || 
                h.address.toLowerCase().includes(q) ||
                (h.description && h.description.toLowerCase().includes(q))
            );
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

    renderHambaList() {
        const listContainer = document.getElementById('hamba-list');
        const countSpan = document.getElementById('hamba-count');
        if (!listContainer || !countSpan) return;

        const filteredList = this.getFilteredList();

        countSpan.textContent = `${filteredList.length}개`;
        listContainer.innerHTML = '';

        if (filteredList.length === 0) {
            listContainer.innerHTML = `
                <div style="text-align:center; padding: 40px 0; color: var(--text-muted);">
                    <p style="font-size:32px; margin-bottom:8px;">🔍</p>
                    <p style="font-weight:700; font-size:16px;">검색 결과가 없습니다.</p>
                    <p style="font-size:13px; margin-top:4px;">다른 조건이나 검색어로 찾아보세요.</p>
                </div>
            `;
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
                        <span class="card-name">${hamba.name}</span>
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
                this.renderHambaList();
                this.showToast(isFav ? "♥ 즐겨찾기에 추가되었습니다." : "즐겨찾기에서 해제되었습니다.");
            });

            card.addEventListener('click', () => {
                this.openDetailModal(hamba.id);
            });

            listContainer.appendChild(card);
        });

        if (this.kakaoMap) {
            this.renderMapMarkers();
        } else if (this.useFallbackMap) {
            this.renderFallbackMap();
        }
    }

    openDetailModal(id) {
        const hamba = this.storage.getHambaById(id);
        if (!hamba) return;

        this.currentSelectedHambaId = hamba.id;

        document.getElementById('detail-name').textContent = hamba.name;
        document.getElementById('detail-title').textContent = hamba.name;
        document.getElementById('detail-address').textContent = hamba.address;
        document.getElementById('detail-lunch-price').textContent = `${hamba.lunchPrice.toLocaleString()}원`;
        document.getElementById('detail-dinner-price').textContent = hamba.dinnerPrice ? `${hamba.dinnerPrice.toLocaleString()}원` : '점심과 동일';
        document.getElementById('detail-hours').textContent = `${hamba.openTime || '06:00'} - ${hamba.closeTime || '19:30'}`;
        document.getElementById('detail-desc').textContent = hamba.description || '등록된 상세 설명이 없습니다.';

        const imgEl = document.getElementById('detail-image');
        imgEl.src = (hamba.imageUrls && hamba.imageUrls.length > 0)
            ? hamba.imageUrls[0]
            : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';

        const favBtn = document.getElementById('detail-bookmark');
        favBtn.className = `bookmark-btn ${hamba.isFavorite ? 'active' : ''}`;
        favBtn.textContent = hamba.isFavorite ? '♥' : '♡';

        this.renderDetailReviews(hamba.id);

        if (this.kakaoMap) {
            const moveLoc = new kakao.maps.LatLng(hamba.latitude, hamba.longitude);
            this.kakaoMap.panTo(moveLoc);
        }

        this.openModal('modal-detail');
    }

    renderDetailReviews(hambaId) {
        const reviewListContainer = document.getElementById('detail-review-list');
        const countSpan = document.getElementById('detail-review-count');
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

    bindEvents() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterState.query = e.target.value;
                this.renderHambaList();
            });
        }

        document.querySelectorAll('.filter-tags .tag-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-tags .tag-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.filterState.priceRange = e.target.getAttribute('data-price');
                this.renderHambaList();
            });
        });

        const favHeaderBtn = document.getElementById('btn-favorite-only');
        if (favHeaderBtn) {
            favHeaderBtn.addEventListener('click', () => {
                this.filterState.onlyFavorites = !this.filterState.onlyFavorites;
                favHeaderBtn.classList.toggle('active', this.filterState.onlyFavorites);
                this.renderHambaList();
                this.showToast(this.filterState.onlyFavorites ? "★ 즐겨찾기한 식당만 표시합니다." : "전체 식당을 표시합니다.");
            });
        }

        const myLocBtn = document.getElementById('btn-my-location');
        if (myLocBtn) {
            myLocBtn.addEventListener('click', () => {
                this.getCurrentLocation();
            });
        }

        const listPanel = document.getElementById('list-panel');
        const handleBtn = document.getElementById('panel-handle');
        const toggleBtn = document.getElementById('btn-toggle-panel');
        if (handleBtn) {
            handleBtn.addEventListener('click', () => listPanel.classList.toggle('collapsed'));
        }
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => listPanel.classList.toggle('collapsed'));
        }

        document.querySelectorAll('[data-close]').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetModalId = btn.getAttribute('data-close');
                this.closeModal(targetModalId);
            });
        });

        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.closeModal(overlay.id);
                }
            });
        });

        const openAddBtn1 = document.getElementById('btn-open-add');
        const openAddBtn2 = document.getElementById('btn-fab-add');
        if (openAddBtn1) openAddBtn1.addEventListener('click', () => this.openModal('modal-add'));
        if (openAddBtn2) openAddBtn2.addEventListener('click', () => this.openModal('modal-add'));

        const submitAddBtn = document.getElementById('btn-submit-add');
        if (submitAddBtn) {
            submitAddBtn.addEventListener('click', () => this.handleAddHambaSubmit());
        }

        const openFilterBtn = document.getElementById('btn-open-filter');
        if (openFilterBtn) openFilterBtn.addEventListener('click', () => this.openModal('modal-filter'));

        const applyFilterBtn = document.getElementById('btn-apply-filter');
        if (applyFilterBtn) {
            applyFilterBtn.addEventListener('click', () => {
                this.filterState.priceRange = document.getElementById('filter-price-select').value;
                this.filterState.minRating = parseFloat(document.getElementById('filter-rating-select').value);
                this.closeModal('modal-filter');
                this.renderHambaList();
                this.showToast("필터가 적용되었습니다.");
            });
        }

        const resetFilterBtn = document.getElementById('btn-reset-filter');
        if (resetFilterBtn) {
            resetFilterBtn.addEventListener('click', () => {
                document.getElementById('filter-price-select').value = 'ALL';
                document.getElementById('filter-rating-select').value = '0';
                this.filterState.priceRange = 'ALL';
                this.filterState.minRating = 0;
                this.closeModal('modal-filter');
                this.renderHambaList();
                this.showToast("필터가 초기화되었습니다.");
            });
        }

        const detailBookmarkBtn = document.getElementById('detail-bookmark');
        if (detailBookmarkBtn) {
            detailBookmarkBtn.addEventListener('click', () => {
                if (this.currentSelectedHambaId) {
                    const isFav = this.storage.toggleFavorite(this.currentSelectedHambaId);
                    detailBookmarkBtn.className = `bookmark-btn ${isFav ? 'active' : ''}`;
                    detailBookmarkBtn.textContent = isFav ? '♥' : '♡';
                    this.renderHambaList();
                    this.showToast(isFav ? "♥ 즐겨찾기에 추가되었습니다." : "즐겨찾기에서 해제되었습니다.");
                }
            });
        }

        const detailCallBtn = document.getElementById('detail-btn-call');
        if (detailCallBtn) {
            detailCallBtn.addEventListener('click', () => {
                this.showToast("📞 식당으로 전화 연결을 시도합니다.");
            });
        }

        const writeReviewBtn = document.getElementById('btn-write-review');
        if (writeReviewBtn) {
            writeReviewBtn.addEventListener('click', () => this.openModal('modal-review'));
        }

        const submitReviewBtn = document.getElementById('btn-submit-review');
        if (submitReviewBtn) {
            submitReviewBtn.addEventListener('click', () => this.handleSubmitReview());
        }
    }

    handleAddHambaSubmit() {
        const name = document.getElementById('add-name').value.trim();
        const address = document.getElementById('add-address').value.trim();
        const lunchPrice = parseInt(document.getElementById('add-lunch-price').value) || 0;
        const dinnerPrice = parseInt(document.getElementById('add-dinner-price').value) || lunchPrice;
        const openTime = document.getElementById('add-open-time').value || "06:00";
        const closeTime = document.getElementById('add-close-time').value || "19:00";
        const imageUrl = document.getElementById('add-image-url').value.trim();
        const description = document.getElementById('add-description').value.trim();

        if (!name || !address || !lunchPrice) {
            alert("식당 이름, 주소, 점심 가격은 필수 입력 항목입니다!");
            return;
        }

        const lat = 37.4851 + (Math.random() - 0.5) * 0.02;
        const lng = 126.9015 + (Math.random() - 0.5) * 0.02;

        const newHamba = this.storage.addHamba({
            name,
            address,
            latitude: lat,
            longitude: lng,
            lunchPrice,
            dinnerPrice,
            openTime,
            closeTime,
            description,
            imageUrls: imageUrl ? [imageUrl] : ["https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80"]
        });

        document.getElementById('form-add-hamba').reset();
        this.closeModal('modal-add');
        this.renderHambaList();
        this.showToast(`🎉 '${name}' 식당이 등록되었습니다!`);
    }

    handleSubmitReview() {
        if (!this.currentSelectedHambaId) return;

        const rating = parseFloat(document.getElementById('review-rating').value);
        const author = document.getElementById('review-author').value.trim() || "식사 손님";
        const content = document.getElementById('review-content').value.trim();

        if (!content) {
            alert("리뷰 내용을 입력해 주세요!");
            return;
        }

        this.storage.addReview(this.currentSelectedHambaId, { author, rating, content });
        this.closeModal('modal-review');
        document.getElementById('review-content').value = '';
        this.renderDetailReviews(this.currentSelectedHambaId);
        this.renderHambaList();
        this.showToast("⭐ 리뷰가 성공적으로 등록되었습니다!");
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('active');
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('active');
    }

    showToast(message) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new HambaWebApp();
});
