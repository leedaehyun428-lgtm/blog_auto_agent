import crypto from 'crypto';

export default async function handler(req, res) {
  // 1. .env.local에서 키 가져오기
  const CUSTOMER_ID = process.env.NAVER_CUSTOMER_ID;
  const ACCESS_LICENSE = process.env.NAVER_ACCESS_LICENSE;
  const SECRET_KEY = process.env.NAVER_SECRET_KEY;

  // 🕵️‍♂️ [디버깅] 터미널에 키가 잘 읽히는지 출력해봅니다. (보안주의: 나중에 지우세요)
  console.log("============== SEO API DEBUG ==============");
  console.log("Customer ID:", CUSTOMER_ID ? "✅ Loaded" : "❌ Missing");
  console.log("License:", ACCESS_LICENSE ? "✅ Loaded" : "❌ Missing");
  console.log("Secret:", SECRET_KEY ? "✅ Loaded" : "❌ Missing");
  console.log("===========================================");

  if (!CUSTOMER_ID || !ACCESS_LICENSE || !SECRET_KEY) {
    console.error("🚨 API Key Missing!"); // 에러 로그 추가
    return res.status(500).json({ error: "네이버 API 키가 설정되지 않았습니다." });
  }

  // ... (아래 코드는 그대로 유지) ...
  const { keyword } = req.body;
  if (!keyword) {
    return res.status(400).json({ error: "키워드가 없습니다." });
  }

  try {
    // 2. 네이버 API 호출을 위한 서명(Signature) 생성
    // (네이버가 요구하는 까다로운 보안 절차입니다)
    const timestamp = Date.now().toString();
    const method = 'GET';
    const uri = '/keywordstool';
    
    const hmac = crypto.createHmac('sha256', SECRET_KEY);
    hmac.update(timestamp + '.' + method + '.' + uri);
    const signature = hmac.digest('base64');

    // 3. 네이버 서버에 요청 보내기
    const baseUrl = 'https://api.naver.com';
    const query = new URLSearchParams({
      hintKeywords: keyword.replace(/\s+/g, ''), // 공백 제거 후 요청
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

    // 4. [알짜배기 필터링 로직] 가동!
    // 우리가 정의한 '좋은 키워드'만 남깁니다.
    const processed = keywordList.map(item => {
      // "< 10" 같은 문자열을 숫자로 변환
      const parseMetric = (val) => (typeof val === 'string' && val.includes('<')) ? 0 : Number(val);
      
      const pcSearch = parseMetric(item.monthlyPcQcCnt);
      const moSearch = parseMetric(item.monthlyMobileQcCnt);
      const totalSearch = pcSearch + moSearch;
      
      const pcClick = parseMetric(item.monthlyAvePcClkCnt);
      const moClick = parseMetric(item.monthlyAveMobileClkCnt);
      const totalClick = (pcClick + moClick).toFixed(1);

      return {
        keyword: item.relKeyword,
        totalSearch,
        totalClick,
        compIdx: item.compIdx // 경쟁정도 (HIGH, MID, LOW)
      };
    });

    // 🎯 메인 키워드 (사용자가 입력한 것) 찾기
    const mainKeywordData = processed.find(k => k.keyword.replace(/\s+/g, '') === keyword.replace(/\s+/g, '')) || {
      keyword: keyword,
      totalSearch: 0,
      totalClick: 0,
      compIdx: 'NONE' // 데이터 없음
    };

    // 💎 황금 키워드 5개 추천 로직
    const recommendations = processed
      .filter(item => {
        // 조건 1: 검색량이 너무 적으면 제외 (1,000 미만)
        if (item.totalSearch < 1000) return false;
        // 조건 2: 검색량이 너무 많으면 경쟁 치열 (50,000 초과) -> 제외
        if (item.totalSearch > 50000) return false;
        // 조건 3: 이미 선택한 메인 키워드는 추천에서 제외
        if (item.keyword === mainKeywordData.keyword) return false;
        return true;
      })
      // 정렬: 검색량 많은 순서 (트래픽 확보용)
      .sort((a, b) => b.totalSearch - a.totalSearch)
      .slice(0, 5); // 상위 5개만

    return res.status(200).json({
      main: mainKeywordData,
      recommendations: recommendations
    });

  } catch (error) {
    console.error("SEO API Error:", error);
    return res.status(500).json({ error: "키워드 분석 중 오류가 발생했습니다." });
  }
}