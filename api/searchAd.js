import crypto from 'crypto';

export default async function handler(req, res) {
  // Vercel 환경 변수 로드
  const CUSTOMER_ID = process.env.NAVER_CUSTOMER_ID;
  const ACCESS_LICENSE = process.env.NAVER_ACCESS_LICENSE;
  const SECRET_KEY = process.env.NAVER_SECRET_KEY;

  if (!CUSTOMER_ID || !ACCESS_LICENSE || !SECRET_KEY) {
    return res.status(500).json({ error: "네이버 API 키가 설정되지 않았습니다." });
  }

  const { keyword } = req.body;
  if (!keyword) {
    return res.status(400).json({ error: "키워드가 없습니다." });
  }

  try {
    const timestamp = Date.now().toString();
    const method = 'GET';
    const uri = '/keywordstool';
    
    const hmac = crypto.createHmac('sha256', SECRET_KEY);
    hmac.update(timestamp + '.' + method + '.' + uri);
    const signature = hmac.digest('base64');

    const baseUrl = 'https://api.naver.com';
    const query = new URLSearchParams({
      hintKeywords: keyword.replace(/\s+/g, ''),
      showDetail: '1'
    });

    const response = await fetch(`${baseUrl}${uri}?${query}`, {
      method: 'GET',
      headers: {
        'X-Timestamp': timestamp,
        'X-API-KEY': ACCESS_LICENSE,
        'X-Customer': CUSTOMER_ID,
        'X-Signature': signature
      }
    });

    if (!response.ok) {
      throw new Error(`Naver API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const keywordList = data.keywordList || [];

    // 1. 데이터 가공 및 점수 산출
    const processed = keywordList.map(item => {
      const parseMetric = (val) => (typeof val === 'string' && val.includes('<')) ? 0 : Number(val);
      
      const pcSearch = parseMetric(item.monthlyPcQcCnt);
      const moSearch = parseMetric(item.monthlyMobileQcCnt);
      const totalSearch = pcSearch + moSearch;
      
      const pcClick = parseMetric(item.monthlyAvePcClkCnt);
      const moClick = parseMetric(item.monthlyAveMobileClkCnt);
      const totalClick = Number((pcClick + moClick).toFixed(1));

      // CTR (클릭률) 계산
      const ctr = totalSearch > 0 ? (totalClick / totalSearch) * 100 : 0;
      
      // 가중치: 경쟁 MID(중간)에 1.5배 보너스
      let weight = 1.0;
      if (item.compIdx === 'MID') weight = 1.5; 
      
      // 🔥 스마트 점수 (Smart Score)
      const score = ctr * weight;

      return {
        keyword: item.relKeyword,
        totalSearch,
        totalClick,
        compIdx: item.compIdx,
        ctr: ctr.toFixed(2),
        score // 정렬의 기준이 됨
      };
    });

    // 메인 키워드 (제외용)
    const cleanInput = keyword.replace(/\s+/g, '');
    const mainKeywordData = processed.find(k => k.keyword.replace(/\s+/g, '') === cleanInput) || {
      keyword: keyword,
      totalSearch: 0,
      totalClick: 0,
      compIdx: 'NONE'
    };

    // 2. 기본 필터링 (체급 제한)
    const candidates = processed.filter(item => {
      // 검색량: 3,00 ~ 40,000 (대기업/테마파크 제외를 위해 상한선 조절)
      if (item.totalSearch < 300 || item.totalSearch > 40000) return false;
      // 경쟁: HIGH 제외 (안전빵)
      if (item.compIdx === 'HIGH') return false;
      // 자기 자신 제외
      if (item.keyword === mainKeywordData.keyword) return false;
      return true;
    });

    // 🔥 [그룹 A: 안전지대] 검색어가 직접 포함된 것
    // 정렬: 스마트 점수 (CTR 기반)
    const strictGroup = candidates
      .filter(item => item.keyword.replace(/\s+/g, '').includes(cleanInput))
      .sort((a, b) => b.score - a.score);

    // 🔥 [그룹 B: 확장지대] 검색어 미포함 (연관어)
    // 정렬: 🚨 여기를 '총 클릭수'에서 '스마트 점수(CTR)'로 변경!! 🚨
    // 이렇게 해야 덩치만 큰 '에버랜드'가 죽고, 알짜배기 '빕스'가 올라옵니다.
    const broadGroup = candidates
      .filter(item => !item.keyword.replace(/\s+/g, '').includes(cleanInput))
      .sort((a, b) => b.score - a.score);


    // 3. [3+2 하이브리드 병합 로직]
    // 목표: A그룹에서 3개 + B그룹에서 2개 = 총 5개
    // (만약 A가 부족하면 B에서 더 가져옴)
    
    let finalRecommendations = [];
    
    // 3-1. A그룹에서 최대 3개 가져오기
    const takeFromA = Math.min(strictGroup.length, 3);
    finalRecommendations = [...strictGroup.slice(0, takeFromA)];

    // 3-2. 남은 자리(5 - 확보된수)는 B그룹에서 채우기
    const remainingSlots = 5 - finalRecommendations.length;
    if (remainingSlots > 0) {
        const takeFromB = broadGroup.slice(0, remainingSlots);
        finalRecommendations = [...finalRecommendations, ...takeFromB];
    }

    return res.status(200).json({
      main: mainKeywordData,
      recommendations: finalRecommendations
    });

  } catch (error) {
    console.error("SEO API Error:", error);
    return res.status(500).json({ error: "키워드 분석 중 오류가 발생했습니다." });
  }
}