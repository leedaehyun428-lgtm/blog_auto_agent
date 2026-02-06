// api/analyze.js
import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  // 1. 프론트엔드에서 보낸 키워드 받기
  const { keyword } = req.body;

  if (!keyword) {
    return res.status(400).json({ error: '키워드가 없습니다.' });
  }

  try {
    // 2. 네이버 검색 API 호출 (상위 5개 블로그 조회)
    // sort: 'sim' (정확도순)으로 해야 상위 노출된 글들을 분석할 수 있습니다.
    const searchResponse = await axios.get('https://openapi.naver.com/v1/search/blog.json', {
      params: { query: keyword, display: 5, sort: 'sim' },
      headers: {
        'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET,
      },
    });

    const items = searchResponse.data.items;
    
    // 분석 결과를 담을 변수들
    let totalTextLength = 0;
    let totalImageCount = 0;
    let successCount = 0;

    // 3. 상위 5개 블로그 크롤링 (Promise.all로 병렬 처리해서 속도 빠름)
    const promises = items.map(async (item) => {
      try {
        // 🚨 [핵심 기술] PC 주소는 iframe으로 막혀 있어서 내용이 안 보입니다.
        // 강제로 모바일 주소(m.blog.naver.com)로 바꿔서 접속해야 본문을 뜯을 수 있습니다.
        const mobileUrl = item.link.replace('https://blog.naver.com', 'https://m.blog.naver.com');
        
        // HTML 가져오기
        const htmlResponse = await axios.get(mobileUrl, { timeout: 5000 }); // 5초 타임아웃
        
        // Cheerio로 HTML 로드
        const $ = cheerio.load(htmlResponse.data);

        // 네이버 스마트에디터 본문 영역 (.se-main-container) 찾기
        // 띄어쓰기를 제외한 순수 글자 수만 카운트 (공백제외)
        const contentText = $('.se-main-container').text().replace(/\s+/g, ''); 
        
        // 이미지 태그 개수 세기
        const imageCount = $('.se-main-container img').length;

        // 구버전 에디터거나 본문을 못 찾은 경우 패스
        if (!contentText || contentText.length < 10) {
            return null; 
        }

        return { textLength: contentText.length, imageCount };
      } catch (e) {
        console.error(`크롤링 실패 (${item.link}):`, e.message);
        return null;
      }
    });

    // 모든 크롤링이 끝날 때까지 기다림
    const results = await Promise.all(promises);

    // 4. 평균 계산하기
    results.forEach(r => {
      if (r) {
        totalTextLength += r.textLength;
        totalImageCount += r.imageCount;
        successCount++;
      }
    });

    // 만약 크롤링에 다 실패했다면? (안전장치)
    if (successCount === 0) {
        return res.status(200).json({
            averageCharCount: 1500, // 기본값
            averageImageCount: 10,
            keywordCount: 5,
            strategy: "데이터 수집 실패 (기본값 제공)"
        });
    }

    const avgChar = Math.round(totalTextLength / successCount);
    const avgImg = Math.round(totalImageCount / successCount);

    // 5. 분석 결과 반환 (JSON)
    return res.status(200).json({
      averageCharCount: avgChar,
      averageImageCount: avgImg,
      // 키워드 반복 횟수 추천 로직 (보통 200~300자당 1회 추천)
      keywordCount: Math.max(3, Math.round(avgChar / 300)), 
      strategy: `상위 ${successCount}개 블로그 데이터 기반 분석`
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: '서버 내부 오류 발생' });
  }
}