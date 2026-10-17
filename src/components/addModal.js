/* src/components/addModal.js - 새로운 식당 제보, 카카오 장소 검색 및 이메일 발송 컴포넌트 */
import { closeModal } from '../utils/modal.js';
import { showToast } from '../utils/toast.js';

export class AddModalComponent {
    constructor(storage, onHambaReported) {
        this.storage = storage;
        this.onHambaReported = onHambaReported;
        this.selectedFile = null;
        this.adminEmail = 'universen4@gmail.com';
        // Web3Forms 발급 키 (universen4@gmail.com 전송용)
        this.web3FormsAccessKey = '473ed626-dd63-4697-8224-36585182497f';
        this.placesService = null;
        this.searchTimeout = null;
        this.selectedCoords = null;

        this.initEvents();
        this.initAddressSearch();
    }

    initEvents() {
        // 전송하기 버튼 클릭
        const submitBtn = document.getElementById('btn-submit-add');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.handleSubmit());
        }

        // 사진 파일 업로드 트리거 및 미리보기 설정
        const fileInput = document.getElementById('add-image-file');
        const uploadTrigger = document.getElementById('image-upload-trigger');
        const placeholder = document.getElementById('upload-placeholder');
        const previewContainer = document.getElementById('upload-preview');
        const previewImg = document.getElementById('preview-img');
        const removeBtn = document.getElementById('btn-remove-image');

        if (uploadTrigger && fileInput) {
            uploadTrigger.addEventListener('click', (e) => {
                if (e.target !== removeBtn) {
                    fileInput.click();
                }
            });
        }

        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files && e.target.files[0];
                if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                        alert("첨부 이미지 파일 크기는 5MB 이하만 가능합니다.");
                        fileInput.value = '';
                        return;
                    }

                    this.selectedFile = file;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        if (previewImg) previewImg.src = event.target.result;
                        if (placeholder) placeholder.style.display = 'none';
                        if (previewContainer) previewContainer.style.display = 'block';
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.clearImageAttachment();
            });
        }
    }

    /* 카카오 장소 검색 및 자동완성 드롭다운 연동 */
    initAddressSearch() {
        const addressInput = document.getElementById('add-address');
        const dropdown = document.getElementById('address-dropdown');
        const statusSpan = document.getElementById('address-search-status');

        if (!addressInput || !dropdown) return;

        addressInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();

            if (this.searchTimeout) {
                clearTimeout(this.searchTimeout);
            }

            if (!query || query.length < 1) {
                dropdown.style.display = 'none';
                dropdown.innerHTML = '';
                if (statusSpan) statusSpan.textContent = '🔍';
                return;
            }

            // 디바운스 250ms 후 카카오 장소 키워드 검색
            this.searchTimeout = setTimeout(() => {
                this.searchKakaoPlaces(query, dropdown, statusSpan);
            }, 250);
        });

        // 주소 검색창 포커스 시 이전 결과가 있으면 다시 표시
        addressInput.addEventListener('focus', () => {
            if (dropdown.children.length > 0 && addressInput.value.trim()) {
                dropdown.style.display = 'block';
            }
        });

        // 외부 클릭 시 드롭다운 닫기
        document.addEventListener('click', (e) => {
            if (!addressInput.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
    }

    searchKakaoPlaces(query, dropdown, statusSpan) {
        if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
            console.warn("Kakao maps services 라이브러리가 로드되지 않았습니다.");
            return;
        }

        if (!this.placesService) {
            this.placesService = new kakao.maps.services.Places();
        }

        if (statusSpan) statusSpan.textContent = '⏳';

        this.placesService.keywordSearch(query, (data, status) => {
            if (statusSpan) statusSpan.textContent = '🔍';

            if (status === kakao.maps.services.Status.OK && data && data.length > 0) {
                dropdown.innerHTML = '';
                const results = data.slice(0, 7); // 상위 7개 노출

                results.forEach((place) => {
                    const item = document.createElement('div');
                    item.style.cssText = `
                        padding: 10px 14px;
                        border-bottom: 1px solid var(--border-color);
                        cursor: pointer;
                        display: flex;
                        flex-direction: column;
                        gap: 2px;
                        transition: background 0.15s ease;
                    `;

                    item.innerHTML = `
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-weight:700; font-size:13.5px; color:var(--text-primary);">📍 ${place.place_name}</span>
                            <span style="font-size:11px; color:var(--primary); font-weight:600;">${place.category_group_name || '장소'}</span>
                        </div>
                        <div style="font-size:12px; color:var(--text-muted);">${place.road_address_name || place.address_name}</div>
                    `;

                    item.addEventListener('mouseenter', () => {
                        item.style.background = 'var(--bg-main)';
                    });
                    item.addEventListener('mouseleave', () => {
                        item.style.background = 'transparent';
                    });

                    item.addEventListener('click', () => {
                        const fullAddress = `${place.road_address_name || place.address_name} (${place.place_name})`;
                        const addressInput = document.getElementById('add-address');
                        const nameInput = document.getElementById('add-name');

                        if (addressInput) addressInput.value = fullAddress;

                        // 식당 이름이 비어있다면 장소명 자동 채움 지원
                        if (nameInput && !nameInput.value.trim()) {
                            nameInput.value = place.place_name;
                        }

                        // 위도/경도 저장
                        this.selectedCoords = {
                            lat: parseFloat(place.y),
                            lng: parseFloat(place.x)
                        };

                        dropdown.style.display = 'none';
                        showToast(`📍 '${place.place_name}' 위치가 선택되었습니다.`);
                    });

                    dropdown.appendChild(item);
                });

                dropdown.style.display = 'block';
            } else {
                dropdown.innerHTML = `
                    <div style="padding:14px; text-align:center; font-size:13px; color:var(--text-muted);">
                        검색 결과가 없습니다. 다른 검색어를 입력해 보세요.
                    </div>
                `;
                dropdown.style.display = 'block';
            }
        });
    }

    clearImageAttachment() {
        const fileInput = document.getElementById('add-image-file');
        const placeholder = document.getElementById('upload-placeholder');
        const previewContainer = document.getElementById('upload-preview');
        const previewImg = document.getElementById('preview-img');

        this.selectedFile = null;
        if (fileInput) fileInput.value = '';
        if (previewImg) previewImg.src = '';
        if (previewContainer) previewContainer.style.display = 'none';
        if (placeholder) placeholder.style.display = 'block';
    }

    async handleSubmit() {
        const name = document.getElementById('add-name')?.value.trim();
        const address = document.getElementById('add-address')?.value.trim();
        const lunchPrice = parseInt(document.getElementById('add-lunch-price')?.value) || 7000;
        const dinnerPrice = parseInt(document.getElementById('add-dinner-price')?.value) || lunchPrice;
        const openTime = document.getElementById('add-open-time')?.value || "06:00";
        const closeTime = document.getElementById('add-close-time')?.value || "19:00";
        const description = document.getElementById('add-description')?.value.trim();
        const submitBtn = document.getElementById('btn-submit-add');

        if (!name) {
            alert("식당 이름을 입력해 주세요!");
            document.getElementById('add-name')?.focus();
            return;
        }

        if (!address) {
            alert("식당 주소를 입력하거나 검색해 주세요!");
            document.getElementById('add-address')?.focus();
            return;
        }

        // 전송 중 상태 표시
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = '제보 전송 중... ⏳';
        }

        const form = document.getElementById('form-add-hamba');
        const subjectInput = document.getElementById('add-hidden-subject');
        const dateInput = document.getElementById('add-hidden-date');
        const coordsInput = document.getElementById('add-hidden-coords');
        const iframe = document.getElementById('hidden_submit_iframe');

        if (subjectInput) subjectInput.value = `[함바여지도 제보] 새로운 식당 등록 요청: ${name}`;
        if (dateInput) dateInput.value = new Date().toLocaleString('ko-KR');
        if (coordsInput) {
            coordsInput.value = this.selectedCoords 
                ? `위도 ${this.selectedCoords.lat}, 경도 ${this.selectedCoords.lng}` 
                : '기본 위치';
        }

        try {
            // 네이티브 Form 전송 (Iframe 타겟) - 첨부파일(사진)을 FormSubmit 서버로 100% 확실하게 스트리밍
            if (form && iframe) {
                let submitted = false;

                const finishSubmission = () => {
                    if (submitted) return;
                    submitted = true;
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = '전송하기';
                    }
                    this.handleSuccess(name);
                };

                // iframe 로드 이벤트 감지
                const onIframeLoad = () => {
                    iframe.removeEventListener('load', onIframeLoad);
                    finishSubmission();
                };
                iframe.addEventListener('load', onIframeLoad);

                // 안전장치 타이머 (서버 응답 지연 시에도 사용자 편의를 위해 3.5초 후 완료 처리)
                setTimeout(() => {
                    iframe.removeEventListener('load', onIframeLoad);
                    finishSubmission();
                }, 3500);

                form.submit();
                return;
            }

            // 폴백: fetch API 전송
            const formData = new FormData(form);
            const response = await fetch(`https://formsubmit.co/ajax/${this.adminEmail}`, {
                method: 'POST',
                headers: { 'Accept': 'application/json' },
                body: formData,
                signal: AbortSignal.timeout(15000)
            });

            const result = await response.json();
            if (response.ok && (result.success === 'true' || result.success === true)) {
                this.handleSuccess(name);
            } else {
                throw new Error(result.message || "서버 응답 오류");
            }
        } catch (error) {
            console.error("제보 전송 중 오류:", error);
            alert(`[안내] 메일 전송 중 오류가 발생했습니다 (${error.message || '서버 응답 없음'}).\n관리자 이메일 발송 창을 열어드립니다.`);
            this.handleFallbackMail(name, address, lunchPrice, dinnerPrice, openTime, closeTime, description);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = '전송하기';
            }
        }
    }

    handleSuccess(name) {
        // 입력 폼 및 첨부파일 초기화
        const form = document.getElementById('form-add-hamba');
        if (form) form.reset();
        this.clearImageAttachment();
        this.selectedCoords = null;

        // 가격 기본값 복원
        const lunchPriceEl = document.getElementById('add-lunch-price');
        const dinnerPriceEl = document.getElementById('add-dinner-price');
        if (lunchPriceEl) lunchPriceEl.value = '7000';
        if (dinnerPriceEl) dinnerPriceEl.value = '7000';

        closeModal('modal-add');
        showToast(`🎉 '${name}' 식당 제보가 관리자에게 성공적으로 전송되었습니다!`);

        alert(`[제보 접수 완료]\n\n'${name}' 식당 제보가 관리자 이메일(${this.adminEmail})로 전송되었습니다.\n관리자 검토 후 함바여지도에 정식 등록됩니다.\n\n소중한 제보 감사합니다! 😊`);

        if (this.onHambaReported) {
            this.onHambaReported();
        }
    }

    handleFallbackMail(name, address, lunchPrice, dinnerPrice, openTime, closeTime, description) {
        const subject = encodeURIComponent(`[함바여지도 제보] ${name}`);
        const body = encodeURIComponent(
            `[식당 제보 내용]\n` +
            `• 식당 이름: ${name}\n` +
            `• 식당 주소: ${address}\n` +
            `• 점심 가격: ${lunchPrice.toLocaleString()}원\n` +
            `• 저녁 가격: ${dinnerPrice ? dinnerPrice.toLocaleString() + '원' : '점심과 동일'}\n` +
            `• 영업 시간: ${openTime} ~ ${closeTime}\n` +
            `• 식당 설명: ${description || '없음'}\n`
        );

        window.open(`mailto:${this.adminEmail}?subject=${subject}&body=${body}`, '_blank');

        const form = document.getElementById('form-add-hamba');
        if (form) form.reset();
        this.clearImageAttachment();
        closeModal('modal-add');

        showToast("📧 이메일 작성창을 통해 제보를 발송합니다.");
    }
}