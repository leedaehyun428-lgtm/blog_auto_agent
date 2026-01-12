import axios from 'axios';

// ThemeType 내보내기 (App.tsx에서 사용)
export type ThemeType = 'restaurant' | 'travel' | 'fashion' | 'finance' | 'daily';

// 1. 통합 검색 엔진
export const searchInfo = async (keyword: string, isTestMode: boolean, theme: ThemeType) => {
  
  if (isTestMode) {
    console.log(`💰 [절약 모드] '${keyword}' 검색 생략`);
    return `[테스트 데이터] ${keyword}에 대한 가상 정보입니다. (테마: ${theme}) \n이 내용은 테스트용입니다.`;
  }

  const PERPLEXITY_API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY;
  if (!PERPLEXITY_API_KEY) {
    console.warn("⚠️ Perplexity 키가 없습니다.");
    return `API 키가 없습니다. .env 파일을 확인해주세요.`;
  }

  // 테마별 검색 포인트
  let searchGuide = "";
  switch (theme) {
    case 'restaurant': searchGuide = "주차 정보, 대표 메뉴 및 가격, 실제 방문자들의 맛 평가, 가게 분위기(인테리어), 웨이팅 꿀팁, 영업시간, 위치"; break;
    case 'travel': searchGuide = "입장료, 소요 시간, 주요 포토존, 주차장 위치 및 요금, 근처 맛집, 관람 꿀팁, 필수 준비물"; break;
    case 'fashion': searchGuide = "제품 소재 및 재질, 사이즈 팁(실측), 착용감, 가격대, 구매처, 코디 추천 조합, 최신 트렌드 반영 여부"; break;
    case 'finance': searchGuide = "금리/수익률 정확한 수치, 가입 조건, 혜택 요약, 장단점 분석, 주의사항(예금자 보호 등), 신청 방법"; break;
    case 'daily': searchGuide = "관련된 최신 이슈, 사람들의 반응, 주요 내용 요약, 논란이 있다면 그 이유, 개인적인 생각 포인트"; break;
  }

  try {
    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: 'sonar-pro', 
        messages: [
          { role: 'system', content: '당신은 전문 리서치 어시스턴트입니다. 한국어로 답변하세요.' },
          { role: 'user', content: `"${keyword}"에 대해 다음 정보를 중점적으로 조사해줘: [${searchGuide}]` }
        ]
      },
      {
        headers: { 'Authorization': `Bearer ${PERPLEXITY_API_KEY}`, 'Content-Type': 'application/json' }
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("검색 실패:", error);
    throw new Error("정보를 찾아오는데 실패했어요. (Perplexity API 오류)");
  }
};

// 2. 만능 블로그 작가 (이모지 금지 & 기능 추가됨)
export const generateBlogPost = async (keyword: string, rawInfo: string, theme: ThemeType) => {
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  if (!GEMINI_API_KEY) throw new Error("Gemini API 키가 설정되지 않았어요!");

  let persona = "";
  let structure = "";
  
  switch (theme) {
    case 'restaurant':
      persona = "감성적이고 섬세한 미식가 (말투: ~했어요, ~더라고요)";
      structure = "공간 분위기 -> 메뉴/맛 묘사 -> 총평";
      break;
    case 'travel':
      persona = "여행 정보를 꼼꼼하게 정리해주는 가이드 (말투: ~입니다, ~하세요)";
      structure = "가는 법 -> 볼거리 -> 꿀팁";
      break;
    case 'fashion':
      persona = "센스 있는 패션 에디터 (말투: ~에요, ~추천드려요)";
      structure = "디테일 -> 착용샷 -> 코디 추천";
      break;
    case 'finance':
      persona = "똑똑한 금융 전문가 (말투: ~입니다, ~해야 합니다)";
      structure = "혜택 분석 -> 장단점 -> 가입 가이드";
      break;
    default:
      persona = "따뜻한 시선의 에세이 작가 (말투: ~했어, ~같아)";
      structure = "생각 -> 내용 -> 마무리";
      break;
  }

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: `
              당신은 네이버 블로그 상위 노출 전문 작가입니다.
              선택된 테마인 **[${theme}]**에 맞춰 글을 작성하세요.

              ## 페르소나: ${persona}
              ## 주제: ${keyword}
              ## 정보: ${rawInfo}

              ## 🚨 절대 준수 사항 (Strict Rules):
              1. **이모지 금지**: 제목과 본문에 이모지를 **절대 사용하지 마세요.** (특수문자도 최소화)
              2. **제목 추천**: 글 맨 위에 **[클릭을 부르는 제목 후보 3가지]**를 먼저 보여주세요.
              3. **해시태그**: 글 맨 마지막에 **[추천 해시태그 10개]**를 한 줄로 작성하세요. (#맛집 #연남동 등)

              ## 작성 가이드:
              1. **구성**: ${structure}
              2. **SEO**: 메인 키워드 '${keyword}'를 본문 전체에 걸쳐 **5~7회** 자연스럽게 포함하세요.
              3. **분량**: 공백 포함 약 1,500자 ~ 2,000자.
              4. **형식**: 소제목(##) 활용, 가독성 좋은 문단 나눔.
              5. **말투**: AI 티가 나지 않는 자연스러운 한국어 구어체.
            `
          }]
        }]
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data.candidates[0].content.parts[0].text;
  } catch (error: any) {
    console.error("Gemini 글쓰기 실패:", error);
    const reason = error.response?.data?.error?.message || "알 수 없는 오류";
    throw new Error(`글쓰기 실패! 이유: ${reason}`);
  }
};