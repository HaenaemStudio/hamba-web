/* src/components/reviewModal.js - 리뷰 작성 모달 컴포넌트 */
import { closeModal } from '../utils/modal.js';
import { showToast } from '../utils/toast.js';

export class ReviewModalComponent {
    constructor(storage, getCurrentHambaIdFn, onReviewSubmitted) {
        this.storage = storage;
        this.getCurrentHambaIdFn = getCurrentHambaIdFn;
        this.onReviewSubmitted = onReviewSubmitted;

        this.initEvents();
    }

    initEvents() {
        const submitReviewBtn = document.getElementById('btn-submit-review');
        if (submitReviewBtn) {
            submitReviewBtn.addEventListener('click', () => this.handleSubmit());
        }
    }

    handleSubmit() {
        const currentHambaId = this.getCurrentHambaIdFn ? this.getCurrentHambaIdFn() : null;
        if (!currentHambaId) return;

        const ratingEl = document.getElementById('review-rating');
        const authorEl = document.getElementById('review-author');
        const contentEl = document.getElementById('review-content');

        const rating = parseFloat(ratingEl?.value || '5');
        const author = authorEl?.value.trim() || "식사 손님";
        const content = contentEl?.value.trim();

        if (!content) {
            alert("리뷰 내용을 입력해 주세요!");
            return;
        }

        this.storage.addReview(currentHambaId, { author, rating, content });

        closeModal('modal-review');
        if (contentEl) contentEl.value = '';

        if (this.onReviewSubmitted) {
            this.onReviewSubmitted(currentHambaId);
        }

        showToast("⭐ 리뷰가 성공적으로 등록되었습니다!");
    }
}