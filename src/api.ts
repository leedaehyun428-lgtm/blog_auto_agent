import axios from 'axios';

export type ThemeType = 'restaurant' | 'travel' | 'fashion' | 'finance' | 'daily';

// 1. 통합 검색 (우리 서버인 /api/search 로 요청)
export const searchInfo = async (keyword: string, isTestMode: boolean, theme: ThemeType) => {
  
  if (isTestMode) {
    console.log(`💰 [절약 모드] '${keyword}' 검색 생략`);
    return `[테스트 데이터] ${keyword}에 대한 가상 정보입니다. (테마: ${theme}) \n이 내용은 테스트용입니다.`;
  }

  try {
    // ✨ 변경점: 외부 URL이 아니라 내 서버(/api/search)로 보냄
    // 이제 여기서 API Key를 쓰지 않음!
    const response = await axios.post('/api/search', {
      keyword,
      theme
    });
    
    // Vercel Function이 보내준 응답 구조에 맞게 수정
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("검색 실패:", error);
    throw new Error("서버에서 정보를 가져오지 못했어요. (Backend API Error)");
  }
};

// 2. 블로그 글 작성 (우리 서버인 /api/generate 로 요청)
export const generateBlogPost = async (keyword: string, rawInfo: string, theme: ThemeType) => {
  
  // ✨ 변경점: 여기도 API Key 확인 로직 삭제 (서버가 알아서 함)
  
  try {
    const response = await axios.post('/api/generate', {
      keyword,
      rawInfo,
      theme
    });

    // Vercel Function이 보내준 응답 반환
    return response.data.candidates[0].content.parts[0].text;
  } catch (error: any) {
    console.error("글쓰기 실패:", error);
    throw new Error("글쓰기 서버 오류 발생");
  }
};