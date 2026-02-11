// ✅ 1. 대기 함수
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default async function handler(req, res) {
  const API_KEY = process.env.VITE_GEMINI_API_KEY;
  const { keyword, rawInfo, theme, guide } = req.body;

  if (!API_KEY) {
    return res.status(500).json({ error: "Server Error: API Key is missing." });
  }

  let persona = "";
  let structure = "";
  
  // 테마별 페르소나 및 구조 설정
  switch (theme) {
    case 'restaurant':
      persona = "감성적이고 섬세한 미식가 (말투: ~했어요, ~더라고요)";
      structure = "매장 분위기/인테리어 -> 대표 메뉴 및 맛 상세 묘사 -> 가격 및 서비스 -> 총평/재방문 의사";
      break;
    case 'travel':
      persona = "여행 정보를 꼼꼼하게 정리해주는 가이드 (말투: ~입니다, ~하세요)";
      structure = "여행지 개요/위치 -> 주요 볼거리/포토존 -> 주차 및 편의시설 -> 주변 맛집/팁";
      break;
    case 'fashion':
      persona = "센스 있는 패션 에디터 (말투: ~에요, ~추천드려요)";
      structure = "제품 디테일/소재 -> 실제 착용 핏/사이즈 팁 -> 코디 추천 -> 총평";
      break;
    case 'finance':
      persona = "똑똑한 금융 전문가 (말투: ~입니다, ~해야 합니다)";
      structure = "상품/정책 개요 -> 주요 혜택 및 장점 -> 주의사항/단점 -> 가입/신청 방법";
      break;
    case 'review':
      persona = "얼리어답터 성향의 IT/제품 전문 리뷰어 (말투: ~입니다, ~같아요, 장단점 명확히)";
      structure = "제품 스펙 요약 -> 언박싱 및 디자인 -> 실제 사용 장점 -> 아쉬운 점(단점) -> 이런 분께 추천";
      break;
    default:
      persona = "따뜻한 시선의 에세이 작가 (말투: ~했어요, ~같아요)";
      structure = "동기/생각 -> 주요 경험 및 내용 -> 감상 및 마무리";
      break;
  }

  // 사용자 가이드 프롬프트
  const guidePrompt = guide 
    ? `
      🚨 **[사용자 특별 지침 (MUST FOLLOW)]**: 
      사용자가 다음 사항을 반드시 반영해달라고 요청했습니다. 이 내용을 최우선으로 준수하여 글을 작성하세요:
      "${guide}"
      ` 
    : "";

  const MAX_RETRIES = 3;
  
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      console.log(`📡 요청 시도 ${i + 1}/${MAX_RETRIES}... (Model: gemini-flash-latest)`);

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `
                당신은 네이버의 **C-RANK(출처 신뢰도)**와 DIA+(문서 품질 및 검색 의도) 로직을 완벽히 이해하는 **'네이버 통합 검색 상위 노출 전문 고스트 라이터'**입니다.

                ${guidePrompt}

                아래의 1. C-RANK / 2. DIA+는 배경 지식 학습을 위한 해석이며, 설명을 이해해서 ## [핵심 작성 전략 & 알고리즘] 글에 녹여내세요. 

                ** 설명 시작
                1. C-RANK (Creator Rank): 블로그 자체의 신뢰도란?
                • 핵심: 특정 주제에 대한 전문성을 드러내어 블로그 지수를 높일 수 있는 맥락 있는 글쓰기 지향.

                2. DIA+ (Deep Intent Analysis+): 문서의 품질과 검색 의도 평가란?
                • 핵심: 검색자가 진짜 궁금해하는 정보(가격, 위치, 찐후기 등)를 상세히 담아 체류시간 확보.
                • 작성 전략: '소주제-이미지-문단' 순의 문단형 스니펫 구조 활용.
                3. C-RANK / 2. DIA+ 설명 끝, 여기는 이해를 위한 설명일 뿐, 본문 안에는 C-RANK 와 DIA+ 단어가 절대로 들어가면 안됩니다.**
                  
                실행: 제목에는 검색량이 높은 키워드를 전략적으로 조합하고, 본문은 알고리즘이 인식하기 쉬운 '문단형 스니펫' 구조로 작성하세요.
                단지 고스트라이터에게 학습을 위한 설명을 했을 뿐입니다. 
                본문 내에 C-RANK와 DIA+ 용어를 절대 직접 언급하지 마세요.
              
                사용자가 이미 사진을 배치해두었으므로, 사진 사이사이에 들어갈 **고품질의 텍스트 원고**를 작성해야 합니다.

                ## [핵심 작성 전략 & 알고리즘]
                1. **스마트블록 대응**: 제목과 본문에 메인/세부 키워드를 자연스럽게 섞으세요.
                2. **문단형 스니펫 구조**: 
                    - [소주제 -> 3~5줄 문단] 형식을 반복하세요.
                    - 1인칭 시점의 구체적인 경험("제가 직접 써보니...", "가보니...")을 반드시 포함하세요.
                3. **디테일 표기**: 가격은 '9.0' 대신 '9,000원'으로 명확히. 모호한 표현 지양.
                4. **체류시간 확보**: 핵심 꿀팁이나 결론은 하단에 배치하여 끝까지 읽게 유도.
                5. **모바일 가독성**: 문단은 짧게 끊고, 불릿 포인트(•)를 적절히 활용하세요.

                ## [작성 정보]
                - **주제:** ${keyword}
                - **기초 정보:** ${rawInfo}
                - **테마/페르소나:** ${persona}
                - **글의 구조(Flow):** ${structure}  <-- ✨ [중요] 여기가 추가되었습니다!
                - **(중요) 사용자 가이드:** ${guide ? guide : "없음 (알아서 작성)"}

                ## [출력 양식 (Strict Format)]
                1. **[제목 후보]**: 클릭을 부르는 제목 3개 (메인+세부키워드 조합)
                2. **[본문]**: 
                    - 위 **[글의 구조(Flow)]**에 정의된 흐름을 따라 작성하세요.
                    - 서론 (방문/구매 계기)
                    - **## 소제목 1**
                    - 내용...
                    - **## 소제목 2**
                    - 내용...
                    - **## 소제목 3**
                    - 내용...
                    - **## 총평/마무리**
                    - 내용...
                3. **분량**: 공백 포함 약 1,500자 ~ 2,000자.
                4. **형식**: 마크다운 문법을 사용하되, 특수문자는 과하지 않게 사용하세요.
                5. **[추천 태그]**: #키워드 10개 (한 줄로)
                6. **말투**: ${persona}의 톤앤매너 유지.
                7. **SEO**: 메인 키워드 '${keyword}'를 본문에 5~7회 자연스럽게 포함.
                8. **경험 강조**: 기초정보 '${rawInfo}'를 단순 요약하지 말고, 직접 겪은 것처럼 생생하게 표현하세요.

                🚨 **절대 준수 사항**: 이모지는 제목/본문에 절대 사용 금지. 오직 텍스트로만 작성.
              `
            }]
          }],
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
          ]
        })
      });

      const data = await response.json();
      
      // 503(과부하) 또는 429(Limit) 에러 처리
      if (data.error && (data.error.code === 503 || data.error.message.includes('overloaded'))) {
        console.warn(`⚠️ 서버 과부하 감지. 3초 후 재시도합니다... (${i + 1}/${MAX_RETRIES})`);
        await wait(3000); 
        continue;
      }

      if (data.error) {
        throw new Error(data.error.message);
      }

      return res.status(200).json(data);

    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error.message);
      if (i === MAX_RETRIES - 1) {
        return res.status(500).json({ error: "Generation failed", details: error.message });
      }
      await wait(3000);
    }
  }
}