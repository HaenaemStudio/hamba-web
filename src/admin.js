/* src/admin.js - 함바여지도 관리자 콘솔 대시보드 로직 */
import { HambaStorage } from './services/storage.js';
import { auth, googleProvider } from './services/firebase.js';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

class AdminDashboard {
    constructor() {
        this.storage = new HambaStorage();
        this.placesService = null;
        this.searchTimeout = null;
        this.selectedCoords = null;
        this.selectedImageData = null;
        this.editingHambaId = null;

        this.initAuth();
        this.initKakaoPlaces();
        this.initEvents();
        this.renderTable();
        this.renderReviewTable();

        // Firebase 실시간 동기화
        this.storage.onChange(() => {
            this.renderTable();
            this.renderReviewTable();
        });
    }

    /* 1. 관리자 구글 2단계 보안 인증 처리 (공인 관리자 이메일만 허용) */
    initAuth() {
        const modal = document.getElementById('admin-login-modal');
        const googleLoginBtn = document.getElementById('btn-google-login');
        const statusMsg = document.getElementById('auth-status-msg');
        const logoutBtn = document.getElementById('btn-admin-logout');

        // 공인된 관리자 이메일 화이트리스트
        const ADMIN_EMAILS = [
            'universen4@gmail.com'
        ];

        // Firebase Auth 상태 실시간 감지 (자동 로그인 세션 유지)
        onAuthStateChanged(auth, (user) => {
            if (user && user.email) {
                const userEmail = user.email.toLowerCase();
                if (ADMIN_EMAILS.includes(userEmail)) {
                    modal.style.display = 'none';
                    if (statusMsg) statusMsg.textContent = '';
                } else {
                    modal.style.display = 'flex';
                    if (statusMsg) statusMsg.textContent = `❌ 접근 권한 없음: '${user.email}'은 등록된 관리자 이메일이 아닙니다.`;
                    signOut(auth);
                }
            } else {
                modal.style.display = 'flex';
            }
        });

        // 구글 로그인 팝업 버튼 클릭 핸들러
        if (googleLoginBtn) {
            googleLoginBtn.addEventListener('click', async () => {
                try {
                    if (statusMsg) statusMsg.textContent = 'Google 인증 창을 여는 중...';
                    const result = await signInWithPopup(auth, googleProvider);
                    const user = result.user;
                    const email = user?.email?.toLowerCase();

                    if (ADMIN_EMAILS.includes(email)) {
                        modal.style.display = 'none';
                        if (statusMsg) statusMsg.textContent = '';
                        this.showToast(`🔓 ${user.displayName || email} 관리자님 인증 완료!`);
                        this.renderTable();
                        this.renderReviewTable();
                    } else {
                        if (statusMsg) statusMsg.textContent = `❌ 접근 권한 없음: '${user.email}'은 관리자가 아닙니다.`;
                        await signOut(auth);
                        alert(`접근 권한이 없습니다. (${user.email})\n관리자 전용 구글 계정으로 로그인해 주세요.`);
                    }
                } catch (error) {
                    console.error('Google Auth Error:', error);
                    if (error.code === 'auth/popup-closed-by-user') {
                        if (statusMsg) statusMsg.textContent = '인증 창이 닫혔습니다.';
                    } else if (error.code === 'auth/unauthorized-domain') {
                        if (statusMsg) statusMsg.textContent = 'Firebase 승인된 도메인에 현재 사이트가 등록되지 않았습니다.';
                    } else {
                        if (statusMsg) statusMsg.textContent = `인증 오류: ${error.message}`;
                    }
                }
            });
        }

        // 로그아웃 버튼 핸들러
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                if (confirm('관리자 세션을 종료하시겠습니까?')) {
                    await signOut(auth);
                    window.location.reload();
                }
            });
        }
    }

    /* 2. 카카오 장소 검색 API 초기화 */
    initKakaoPlaces() {
        if (window.kakao && window.kakao.maps) {
            kakao.maps.load(() => {
                if (kakao.maps.services && kakao.maps.services.Places) {
                    this.placesService = new kakao.maps.services.Places();
                }
            });
        }
    }

    /* 3. 이벤트 바인딩 */
    initEvents() {
        // 주소 키워드 자동완성 검색
        const addressInput = document.getElementById('form-address');
        const dropdown = document.getElementById('address-dropdown');

        if (addressInput) {
            addressInput.addEventListener('input', (e) => {
                const query = e.target.value.trim();
                clearTimeout(this.searchTimeout);

                if (!query || query.length < 2) {
                    if (dropdown) dropdown.style.display = 'none';
                    return;
                }

                this.searchTimeout = setTimeout(() => {
                    this.searchPlaces(query);
                }, 280);
            });
        }

        // 바깥 클릭 시 검색창 닫기
        document.addEventListener('click', (e) => {
            if (dropdown && !dropdown.contains(e.target) && e.target !== addressInput) {
                dropdown.style.display = 'none';
            }
        });

        // 사진 파일 업로드 & 미리보기
        const imageFileInput = document.getElementById('form-image-file');
        const uploadBox = document.getElementById('image-upload-box');
        const uploadPlaceholder = document.getElementById('upload-placeholder');
        const previewContainer = document.getElementById('upload-preview-container');
        const previewImg = document.getElementById('preview-image');
        const removePreviewBtn = document.getElementById('btn-remove-preview');

        if (uploadBox && imageFileInput) {
            uploadBox.addEventListener('click', (e) => {
                if (e.target !== removePreviewBtn) {
                    imageFileInput.click();
                }
            });
        }

        if (imageFileInput) {
            imageFileInput.addEventListener('change', (e) => {
                const file = e.target.files && e.target.files[0];
                if (file) {
                    if (file.size > 8 * 1024 * 1024) {
                        alert("사진 크기는 8MB 이하만 가능합니다.");
                        imageFileInput.value = '';
                        return;
                    }

                    const reader = new FileReader();
                    reader.onload = (event) => {
                        this.selectedImageData = event.target.result;
                        if (previewImg) previewImg.src = this.selectedImageData;
                        if (uploadPlaceholder) uploadPlaceholder.style.display = 'none';
                        if (previewContainer) previewContainer.style.display = 'block';
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        if (removePreviewBtn) {
            removePreviewBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.clearImagePreview();
            });
        }

        // 폼 제출 (등록 또는 수정)
        const form = document.getElementById('hamba-admin-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSave();
            });
        }

        // 수정 취소
        const cancelEditBtn = document.getElementById('btn-cancel-edit');
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', () => {
                this.resetForm();
            });
        }

        // 테이블 목록 실시간 검색
        const searchListInput = document.getElementById('search-table-input');
        if (searchListInput) {
            searchListInput.addEventListener('input', () => {
                this.renderTable(searchListInput.value.trim());
            });
        }

        // 데이터 백업 (JSON 다운로드)
        const btnExportJson = document.getElementById('btn-export-json');
        if (btnExportJson) {
            btnExportJson.addEventListener('click', () => this.exportJson());
        }

        // 소스코드 복사 (hambaList.js 영구 반영용)
        const btnCopyCode = document.getElementById('btn-copy-code');
        if (btnCopyCode) {
            btnCopyCode.addEventListener('click', () => this.copyCodeForSource());
        }

        // 탭 전환 (식당 목록 vs 리뷰 관리)
        const tabHambas = document.getElementById('tab-btn-hambas');
        const tabReviews = document.getElementById('tab-btn-reviews');
        const viewHambas = document.getElementById('view-hamba-management');
        const viewReviews = document.getElementById('view-review-management');

        if (tabHambas && tabReviews && viewHambas && viewReviews) {
            tabHambas.addEventListener('click', () => {
                tabHambas.classList.add('active');
                tabReviews.classList.remove('active');
                viewHambas.style.display = 'block';
                viewReviews.style.display = 'none';
            });

            tabReviews.addEventListener('click', () => {
                tabReviews.classList.add('active');
                tabHambas.classList.remove('active');
                viewReviews.style.display = 'block';
                viewHambas.style.display = 'none';
                this.renderReviewTable();
            });
        }

        // 리뷰 실시간 검색
        const searchReviewInput = document.getElementById('search-review-input');
        if (searchReviewInput) {
            searchReviewInput.addEventListener('input', () => {
                this.renderReviewTable(searchReviewInput.value.trim());
            });
        }
    }

    /* 4. 카카오 장소 검색 */
    searchPlaces(keyword) {
        const dropdown = document.getElementById('address-dropdown');
        if (!this.placesService || !dropdown) return;

        this.placesService.keywordSearch(keyword, (results, status) => {
            if (status === kakao.maps.services.Status.OK && results.length > 0) {
                dropdown.innerHTML = '';
                results.slice(0, 6).forEach(place => {
                    const item = document.createElement('div');
                    item.className = 'search-item';
                    item.innerHTML = `
                        <div class="search-item-title">${place.place_name}</div>
                        <div class="search-item-address">${place.road_address_name || place.address_name}</div>
                    `;

                    item.addEventListener('click', () => {
                        const nameInput = document.getElementById('form-name');
                        const addressInput = document.getElementById('form-address');
                        const latInput = document.getElementById('form-lat');
                        const lngInput = document.getElementById('form-lng');

                        if (addressInput) addressInput.value = place.road_address_name || place.address_name;
                        if (nameInput && !nameInput.value.trim()) nameInput.value = place.place_name;
                        if (latInput) latInput.value = parseFloat(place.y);
                        if (lngInput) lngInput.value = parseFloat(place.x);

                        this.selectedCoords = {
                            lat: parseFloat(place.y),
                            lng: parseFloat(place.x)
                        };

                        dropdown.style.display = 'none';
                        this.showToast(`📍 '${place.place_name}' 좌표가 입력되었습니다.`);
                    });

                    dropdown.appendChild(item);
                });
                dropdown.style.display = 'block';
            } else {
                dropdown.innerHTML = `<div style="padding:12px; font-size:13px; color:var(--text-muted); text-align:center;">검색 결과가 없습니다.</div>`;
                dropdown.style.display = 'block';
            }
        });
    }

    clearImagePreview() {
        const fileInput = document.getElementById('form-image-file');
        const uploadPlaceholder = document.getElementById('upload-placeholder');
        const previewContainer = document.getElementById('upload-preview-container');
        const previewImg = document.getElementById('preview-image');

        this.selectedImageData = null;
        if (fileInput) fileInput.value = '';
        if (previewImg) previewImg.src = '';
        if (previewContainer) previewContainer.style.display = 'none';
        if (uploadPlaceholder) uploadPlaceholder.style.display = 'block';
    }

    /* 5. 식당 저장 (신규 등록 or 수정) */
    handleSave() {
        const name = document.getElementById('form-name')?.value.trim();
        const category = document.getElementById('form-category')?.value || '한식';
        const address = document.getElementById('form-address')?.value.trim();
        const lat = parseFloat(document.getElementById('form-lat')?.value) || 37.5665;
        const lng = parseFloat(document.getElementById('form-lng')?.value) || 126.9780;
        const lunchPrice = parseInt(document.getElementById('form-lunch-price')?.value) || 7000;
        const dinnerPrice = parseInt(document.getElementById('form-dinner-price')?.value) || lunchPrice;
        const openTime = document.getElementById('form-open-time')?.value || "06:00";
        const closeTime = document.getElementById('form-close-time')?.value || "19:00";
        const description = document.getElementById('form-description')?.value.trim();
        const customUrl = document.getElementById('form-image-url')?.value.trim();

        if (!name || !address) {
            alert('식당 이름과 주소는 필수입니다!');
            return;
        }

        // 이미지 우선순위: 업로드한 Base64 > 직접 입력한 URL > 기본 샘플 한식 이미지
        let finalImage = this.selectedImageData || customUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";

        const restaurantData = {
            name,
            category,
            address,
            latitude: lat,
            longitude: lng,
            lunchPrice,
            dinnerPrice,
            openTime,
            closeTime,
            description: description || "매일 바뀌는 정갈하고 푸짐한 한식 뷔페 식당입니다.",
            imageUrls: [finalImage]
        };

        if (this.editingHambaId) {
            // 수정
            this.storage.updateHamba(this.editingHambaId, restaurantData);
            this.showToast(`✅ '${name}' 정보가 성공적으로 수정되었습니다!`);
        } else {
            // 신규 등록
            this.storage.addHamba(restaurantData);
            this.showToast(`🎉 '${name}' 식당이 정식 등록되었습니다!`);
        }

        this.resetForm();
        this.renderTable();
    }

    /* 6. 수정 모드 시작 */
    startEdit(id) {
        const hamba = this.storage.getHambaById(id);
        if (!hamba) return;

        this.editingHambaId = id;

        document.getElementById('form-name').value = hamba.name;
        const categorySelect = document.getElementById('form-category');
        if (categorySelect) categorySelect.value = hamba.category || '한식';
        document.getElementById('form-address').value = hamba.address;
        document.getElementById('form-lat').value = hamba.latitude;
        document.getElementById('form-lng').value = hamba.longitude;
        document.getElementById('form-lunch-price').value = hamba.lunchPrice;
        document.getElementById('form-dinner-price').value = hamba.dinnerPrice || hamba.lunchPrice;
        document.getElementById('form-open-time').value = hamba.openTime || "06:00";
        document.getElementById('form-close-time').value = hamba.closeTime || "19:00";
        document.getElementById('form-description').value = hamba.description || "";

        if (hamba.imageUrls && hamba.imageUrls[0]) {
            const previewImg = document.getElementById('preview-image');
            const previewContainer = document.getElementById('upload-preview-container');
            const uploadPlaceholder = document.getElementById('upload-placeholder');
            
            this.selectedImageData = hamba.imageUrls[0];
            if (previewImg) previewImg.src = hamba.imageUrls[0];
            if (previewContainer) previewContainer.style.display = 'block';
            if (uploadPlaceholder) uploadPlaceholder.style.display = 'none';
        }

        const submitBtn = document.getElementById('btn-submit-form');
        const cancelBtn = document.getElementById('btn-cancel-edit');
        const formTitle = document.getElementById('form-card-title');

        if (submitBtn) submitBtn.textContent = '💾 수정 사항 저장하기';
        if (cancelBtn) cancelBtn.style.display = 'block';
        if (formTitle) formTitle.textContent = `✏️ '${hamba.name}' 정보 수정`;

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /* 7. 폼 초기화 */
    resetForm() {
        this.editingHambaId = null;
        const form = document.getElementById('hamba-admin-form');
        if (form) form.reset();

        const categorySelect = document.getElementById('form-category');
        if (categorySelect) categorySelect.value = '한식';

        document.getElementById('form-lunch-price').value = '7000';
        document.getElementById('form-dinner-price').value = '7000';
        document.getElementById('form-open-time').value = '06:00';
        document.getElementById('form-close-time').value = '19:00';

        this.clearImagePreview();

        const submitBtn = document.getElementById('btn-submit-form');
        const cancelBtn = document.getElementById('btn-cancel-edit');
        const formTitle = document.getElementById('form-card-title');

        if (submitBtn) submitBtn.textContent = '➕ 식당 정식 등록하기';
        if (cancelBtn) cancelBtn.style.display = 'none';
        if (formTitle) formTitle.textContent = '🥘 신규 식당 등록 (제보 반영)';
    }

    /* 8. 식당 삭제 */
    deleteHamba(id, name) {
        if (confirm(`정말로 '${name}' 식당을 지도에서 삭제하시겠습니까?`)) {
            this.storage.deleteHamba(id);
            if (this.editingHambaId === id) this.resetForm();
            this.renderTable();
            this.showToast(`🗑️ '${name}' 식당이 삭제되었습니다.`);
        }
    }

    /* 9. 테이블 렌더링 */
    renderTable(filterKeyword = '') {
        const tbody = document.getElementById('hamba-table-body');
        const countBadge = document.getElementById('total-hamba-count');
        if (!tbody) return;

        let list = this.storage.getAllHambas();

        if (filterKeyword) {
            const kw = filterKeyword.toLowerCase();
            list = list.filter(item => 
                item.name.toLowerCase().includes(kw) || 
                item.address.toLowerCase().includes(kw) ||
                (item.category && item.category.toLowerCase().includes(kw))
            );
        }

        if (countBadge) countBadge.textContent = `${list.length}개`;

        if (list.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center; padding:30px; color:var(--text-muted);">
                        등록된 식당이 없거나 검색 결과가 없습니다.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = list.map(item => {
            const thumb = (item.imageUrls && item.imageUrls[0]) || '';
            return `
                <tr>
                    <td>
                        <img src="${thumb}" alt="${item.name}" class="table-thumb" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=120&q=80';">
                    </td>
                    <td>
                        <span class="table-badge" style="background:var(--primary-light); color:var(--primary); font-weight:700;">${item.category || '한식'}</span>
                    </td>
                    <td>
                        <div style="font-weight:700; color:var(--text-primary); font-size:14px;">${item.name}</div>
                        <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">${item.address}</div>
                    </td>
                    <td>
                        <span class="table-badge badge-price">${(item.lunchPrice || 7000).toLocaleString()}원</span>
                    </td>
                    <td style="font-size:12.5px; color:var(--text-secondary);">
                        ${item.openTime || '06:00'} ~ ${item.closeTime || '19:00'}
                    </td>
                    <td style="font-size:12px; color:var(--text-muted);">
                        ⭐ ${item.rating || 5.0} (<span class="badge-review-link" data-filter-hamba="${item.name}" style="cursor:pointer; color:var(--primary); font-weight:700; text-decoration:underline;" title="이 식당 리뷰 모아보기">${item.reviewCount || 0}개</span>)
                    </td>
                    <td style="white-space:nowrap;">
                        <button class="btn-action edit" data-edit-id="${item.id}">수정</button>
                        <button class="btn-action delete" data-delete-id="${item.id}" data-name="${item.name}">삭제</button>
                    </td>
                </tr>
            `;
        }).join('');

        // 버튼 이벤트 바인딩
        tbody.querySelectorAll('.btn-action.edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-edit-id'));
                this.startEdit(id);
            });
        });

        tbody.querySelectorAll('.btn-action.delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-delete-id'));
                const name = btn.getAttribute('data-name');
                this.deleteHamba(id, name);
            });
        });

        // 리뷰 개수 클릭 시 해당 식당 리뷰 탭으로 이동
        tbody.querySelectorAll('.badge-review-link').forEach(link => {
            link.addEventListener('click', () => {
                const hambaName = link.getAttribute('data-filter-hamba');
                const tabReviews = document.getElementById('tab-btn-reviews');
                const searchReviewInput = document.getElementById('search-review-input');
                if (tabReviews) tabReviews.click();
                if (searchReviewInput) {
                    searchReviewInput.value = hambaName;
                    this.renderReviewTable(hambaName);
                }
            });
        });
    }

    /* 10. 방문자 리뷰 목록 렌더링 및 삭제 관리 */
    renderReviewTable(filterKeyword = '') {
        const tbody = document.getElementById('review-table-body');
        const countBadge = document.getElementById('total-review-count');
        if (!tbody) return;

        let reviews = this.storage.getAllReviews();
        const hambas = this.storage.getAllHambas();
        const hambaMap = {};
        hambas.forEach(h => { hambaMap[h.id] = h.name; });

        if (countBadge) countBadge.textContent = `${reviews.length}개`;

        if (filterKeyword) {
            const kw = filterKeyword.toLowerCase();
            reviews = reviews.filter(r => {
                const hName = (hambaMap[r.hambaId] || '').toLowerCase();
                const author = (r.author || '').toLowerCase();
                const content = (r.content || '').toLowerCase();
                return hName.includes(kw) || author.includes(kw) || content.includes(kw);
            });
        }

        if (reviews.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center; padding:30px; color:var(--text-muted);">
                        등록된 방문자 리뷰가 없거나 검색 결과가 없습니다.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = reviews.map(r => {
            const hambaName = hambaMap[r.hambaId] || `식당 #${r.hambaId}`;
            const dateStr = r.createdAt ? new Date(r.createdAt).toLocaleDateString('ko-KR') : '-';

            return `
                <tr>
                    <td>
                        <span class="table-badge badge-price" style="font-size:12px;">${hambaName}</span>
                    </td>
                    <td style="font-weight:700; color:var(--text-primary); font-size:13px;">
                        ${r.author || '익명'}
                    </td>
                    <td style="color:#FF9500; font-weight:700; font-size:13px;">
                        ⭐ ${r.rating || 5.0}
                    </td>
                    <td style="font-size:13px; color:var(--text-secondary); max-width:280px; word-break:break-all;">
                        ${r.content || '-'}
                    </td>
                    <td style="font-size:12px; color:var(--text-muted); white-space:nowrap;">
                        ${dateStr}
                    </td>
                    <td style="white-space:nowrap;">
                        <button class="btn-action delete" data-delete-review-id="${r.id}" data-author="${r.author || '익명'}">삭제</button>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.querySelectorAll('.btn-action.delete[data-delete-review-id]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-delete-review-id'));
                const author = btn.getAttribute('data-author');
                this.deleteReview(id, author);
            });
        });
    }

    /* 11. 방문자 리뷰 삭제 */
    deleteReview(reviewId, author) {
        if (confirm(`'${author}' 님의 리뷰를 정말 삭제하시겠습니까?\n(삭제 시 해당 식당의 평점과 리뷰 수가 자동으로 재계산됩니다)`)) {
            const success = this.storage.deleteReview(reviewId);
            if (success) {
                const searchReviewInput = document.getElementById('search-review-input');
                this.renderReviewTable(searchReviewInput ? searchReviewInput.value.trim() : '');
                this.renderTable();
                this.showToast("🗑️ 리뷰가 삭제되었으며, 식당 평점이 갱신되었습니다.");
            }
        }
    }

    /* 10. 전체 데이터 JSON 다운로드 */
    exportJson() {
        const list = this.storage.getAllHambas();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(list, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `hamba_data_backup_${new Date().toISOString().slice(0,10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        this.showToast("📥 전체 식당 백업 JSON 파일이 다운로드되었습니다.");
    }

    /* 11. 소스코드 복사 (hambaList.js / initialData.js 반영용) */
    copyCodeForSource() {
        const list = this.storage.getAllHambas();
        const code = `/* src/data/initialData.js - 관리자 콘솔에서 내보낸 최신 식당 데이터 */\n\nexport const INITIAL_HAMBA_DATA = ${JSON.stringify(list, null, 4)};\n`;

        navigator.clipboard.writeText(code).then(() => {
            alert("📋 'INITIAL_HAMBA_DATA' 소스코드가 클립보드에 복사되었습니다!\n\n'src/data/initialData.js' 파일에 붙여넣기 하시면 Git 커밋 및 영구 기본 데이터로 저장됩니다.");
            this.showToast("📋 소스코드가 클립보드에 복사되었습니다!");
        }).catch(() => {
            prompt("아래 코드를 복사하여 'src/data/initialData.js'에 붙여넣으세요:", code);
        });
    }

    /* 12. 토스트 팝업 */
    showToast(message) {
        const toast = document.getElementById('admin-toast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2800);
    }
}

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    new AdminDashboard();
});
