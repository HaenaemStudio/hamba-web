/* src/data/initialData.js - 초기 샘플 식당 및 리뷰 데이터 */

export const INITIAL_HAMBA_DATA = [
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
        reviewCount: 2,
        category: "한식",
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
        rating: 5.0,
        reviewCount: 0,
        category: "한식",
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
        rating: 5.0,
        reviewCount: 0,
        category: "종합",
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
        rating: 5.0,
        reviewCount: 0,
        category: "호텔",
        description: "깔끔하고 세련된 분위기의 고급 한식 뷔페. 샐러드 바와 후식 디저트 제공.",
        imageUrls: ["https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=80"],
        isFavorite: false,
        createdAt: Date.now() - 86400000 * 2
    }
];

export const INITIAL_REVIEWS = [
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