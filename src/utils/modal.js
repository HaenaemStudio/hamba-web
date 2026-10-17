/* src/utils/modal.js - 모달 팝업 열기/닫기 유틸리티 */

export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
}

export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

export function initModalCloseEvents() {
    // 닫기 버튼 ([data-close="modal-id"])
    document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetModalId = btn.getAttribute('data-close');
            closeModal(targetModalId);
        });
    });

    // 배경 클릭 시 닫기
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal(overlay.id);
            }
        });
    });
}