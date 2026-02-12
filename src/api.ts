import axios from 'axios';

// ✨ [변경 1] 'review' 테마가 추가되었습니다.
export type ThemeType = 'restaurant' | 'travel' | 'fashion' | 'finance' | 'daily' | 'review';
export type GenerateMode = 'basic' | 'pro';

// basic 모드는 검색 API를 타지 않고, 내부 문맥만으로 작성합니다.
export const buildBasicContext = (keyword: string, theme: ThemeType) =>
  `[기본 문맥]
키워드: ${keyword}
테마: ${theme}
모드: basic
주의: 실시간 검색 없이 작성하는 초안 모드입니다.`;

// 1. 통합 검색 (Perplexity API -> 내 서버 /api/search)
export const searchInfo = async (keyword: string, mode: GenerateMode, theme: ThemeType) => {
  
  if (mode === 'basic') {
    console.log(`⚡ [일반 모드] '${keyword}' 검색 생략 (Gemini 단독 작성)`);
    return buildBasicContext(keyword, theme);
  }

  try {
    const response = await axios.post('/api/search', {
      keyword,
      theme
    });
    
    // Perplexity 응답 구조 반환
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("검색 실패:", error);
    throw new Error("서버에서 정보를 가져오지 못했어요. (Backend API Error)");
  }
};

// 2. 블로그 글 작성 (Gemini API -> 내 서버 /api/generate)
export const generateBlogPost = async (
  keyword: string, 
  rawInfo: string, 
  theme: ThemeType,
  guide?: string // ✨ [변경 2] 선택적 파라미터 'guide' 추가
) => {
  try {
    // ✨ [변경 3] guide 값도 함께 서버로 전송
    const response = await axios.post('/api/generate', {
      keyword,
      rawInfo,
      theme,
      guide 
    });

    // 🕵️‍♂️ [디버깅] 서버 응답 확인 (F12 콘솔용)
    console.log("Gemini 전체 응답 데이터:", response.data);

    // 🛡️ [안전장치 1] 데이터가 비어있는지 확인
    if (!response.data) {
      throw new Error("서버에서 빈 응답이 왔습니다.");
    }

    // 🛡️ [안전장치 2] 안전 필터에 걸렸는지 확인
    if (response.data.promptFeedback && response.data.promptFeedback.blockReason) {
      console.warn("⚠️ AI 안전 필터 작동:", response.data.promptFeedback);
      throw new Error(`AI가 답변을 거부했습니다. (사유: ${response.data.promptFeedback.blockReason})`);
    }

    // 🛡️ [안전장치 3] candidates(답변 후보)가 있는지 확인
    if (!response.data.candidates || response.data.candidates.length === 0) {
      console.error("응답에 candidates가 없음:", response.data);
      // 에러 메시지가 있다면 보여주기
      if (response.data.error) {
         throw new Error(`Google API 오류: ${response.data.error.message}`);
      }
      throw new Error("AI가 답변을 생성하지 못했습니다. (응답 내용 없음)");
    }

    // ✅ 안전하게 텍스트 추출
    const textPart = response.data.candidates[0].content?.parts?.[0]?.text;
    if (!textPart) {
        throw new Error("텍스트 형식이 아닌 응답을 받았습니다.");
    }

    return textPart;

  } catch (error: unknown) {
    // Axios 에러 처리 (네트워크 오류, 429, 500 등)
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const serverMsg = error.response?.data?.error?.message || JSON.stringify(error.response?.data);
      console.error(`🚨 Axios 에러 (${status}):`, serverMsg);
      
      if (status === 429) {
        throw new Error("요청이 너무 많습니다. 잠시 후 다시 시도해주세요. (429)");
      }
      if (status === 503 || (serverMsg && serverMsg.includes('overloaded'))) {
        throw new Error("AI 서버가 혼잡합니다. 잠시 후 다시 시도해주세요. (503)");
      }
      
      throw new Error(`서버 통신 오류 (${status}): ${serverMsg}`);
    } 
    
    // 일반 로직 에러 처리
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error("🚨 로직 에러:", message);
    throw error; 
  }
};

// ✨ [신규 추가] 3. 네이버 검색광고 API 연동 (키워드 분석)
export const analyzeKeyword = async (keyword: string) => {
  try {
    const response = await axios.post('/api/searchAd', { keyword });
    return response.data;
  } catch (error) {
    console.error("키워드 분석 실패:", error);
    throw new Error("키워드 데이터를 가져오지 못했습니다.");
  }
};
