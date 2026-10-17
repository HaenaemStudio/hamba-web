/* src/services/kakaoMap.js - 카카오 지도 API 연동, 마커/오버레이 및 폴백 지도 서비스 */
import { showToast } from '../utils/toast.js';

export class KakaoMapService {
    constructor() {
        this.kakaoMap = null;
        this.markers = [];
        this.useFallbackMap = false;
        this.onHambaClick = null;
    }

    initKakaoMap(containerId = 'map-container', onHambaClick = null, getListFn = null, onBoundsChange = null) {
        const container = document.getElementById(containerId);
        if (!container) return;

        this.onHambaClick = onHambaClick;
        this.getListFn = getListFn;
        this.onBoundsChange = onBoundsChange;

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

                            // 지도 영역 이동 시(화면 팬/줌) 리스트 자동 갱신 이벤트
                            kakao.maps.event.addListener(this.kakaoMap, 'idle', () => {
                                if (this.onBoundsChange) {
                                    this.onBoundsChange();
                                }
                            });

                            this.getCurrentLocation();
                            if (this.getListFn) {
                                this.renderMapMarkers(this.getListFn());
                            }
                            console.log("✅ 카카오 지도 실시간 연동 성공!");
                            showToast("🗺️ 카카오 지도가 성공적으로 연동되었습니다.");
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

                        // 지도 영역 이동 시(화면 팬/줌) 리스트 자동 갱신 이벤트
                        kakao.maps.event.addListener(this.kakaoMap, 'idle', () => {
                            if (this.onBoundsChange) {
                                this.onBoundsChange();
                            }
                        });

                        this.getCurrentLocation();
                        if (this.getListFn) {
                            this.renderMapMarkers(this.getListFn());
                        }
                        console.log("✅ 카카오 지도 실시간 연동 성공!");
                        showToast("🗺️ 카카오 지도가 성공적으로 연동되었습니다.");
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

        const list = this.getListFn ? this.getListFn() : [];

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
                showToast("🔄 카카오 지도 연결을 다시 시도합니다...");
                this.initKakaoMap('map-container', this.onHambaClick, this.getListFn);
            });
        }

        // 핀 클릭 이벤트 바인딩
        container.querySelectorAll('.fallback-pin').forEach(pin => {
            pin.addEventListener('click', () => {
                const id = pin.getAttribute('data-id');
                if (this.onHambaClick) this.onHambaClick(id);
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
                    showToast("📍 내 위치로 지도가 이동되었습니다.");
                },
                () => {
                    console.log("GPS 위치 획득 불가");
                }
            );
        } else {
            showToast("📍 내 위치 탐색 완료");
        }
    }

    renderMapMarkers(list) {
        if (!this.kakaoMap) {
            if (this.useFallbackMap) {
                this.renderFallbackMap();
            }
            return;
        }

        // 기존 마커 및 오버레이 제거
        this.markers.forEach(m => m.setMap(null));
        this.markers = [];

        list.forEach(hamba => {
            const position = new kakao.maps.LatLng(hamba.latitude, hamba.longitude);

            // 기본 마커 생성
            const marker = new kakao.maps.Marker({
                position: position,
                clickable: true
            });
            marker.setMap(this.kakaoMap);
            this.markers.push(marker);

            // 커스텀 오버레이 (식당 이름 & 가격 표출)
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
                if (this.onHambaClick) this.onHambaClick(hamba.id);
            });

            const customOverlay = new kakao.maps.CustomOverlay({
                position: position,
                content: content,
                yAnchor: 1
            });

            customOverlay.setMap(this.kakaoMap);
            this.markers.push(customOverlay);

            kakao.maps.event.addListener(marker, 'click', () => {
                if (this.onHambaClick) this.onHambaClick(hamba.id);
            });
        });
    }

    panTo(lat, lng) {
        if (this.kakaoMap && window.kakao && window.kakao.maps) {
            const moveLoc = new kakao.maps.LatLng(lat, lng);
            this.kakaoMap.panTo(moveLoc);
        }
    }

    isWithinBounds(lat, lng) {
        if (!this.kakaoMap || !window.kakao || !window.kakao.maps) return true;
        try {
            const bounds = this.kakaoMap.getBounds();
            if (!bounds) return true;
            const point = new kakao.maps.LatLng(lat, lng);
            return bounds.contain(point);
        } catch (e) {
            return true;
        }
    }

    fitAllMarkers(list) {
        if (!this.kakaoMap || !window.kakao || !window.kakao.maps || !list || list.length === 0) return;
        try {
            const bounds = new kakao.maps.LatLngBounds();
            list.forEach(h => {
                bounds.extend(new kakao.maps.LatLng(h.latitude, h.longitude));
            });
            this.kakaoMap.setBounds(bounds);
            showToast("🗺️ 등록된 전체 식당 위치로 지도를 이동했습니다.");
        } catch (e) {
            console.warn(e);
        }
    }
}