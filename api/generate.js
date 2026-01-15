// api/generate.js
export default async function handler(req, res) {
  const { keyword, rawInfo, theme } = req.body;
  const API_KEY = process.env.VITE_GEMINI_API_KEY;

  if (!API_KEY) return res.status(500).json({ error: "API Key missing" });

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
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `
              당신은 네이버의 **C-RANK(출처 신뢰도)**와 DIA+(문서 품질 및 검색 의도) 로직을 완벽히 이해하는 **'네이버 통합 검색 상위 노출 전문 고스트 라이터'** 전문가입니다.
                1. C-RANK 관점: 특정 주제에 대한 전문성을 드러내어 블로그 지수를 높일 수 있는 맥락 있는 글쓰기를 지향하세요.
                2. DIA+ 관점: 검색자가 검색창에 특정 키워드를 쳤을 때 얻고자 하는 핵심 정보(가격, 후기, 팁 등)를 본문 상단부터 하단까지 논리적으로 배치하여 체류 시간을 극대화하세요.
                3. 실행: 제목에는 검색량이 높은 키워드를 전략적으로 조합하고, 본문은 알고리즘이 인식하기 쉬운 '문단형 스니펫' 구조(소주제 중심)로 작성하여 상위 노출 확률을 높이세요."
              
                사용자가 이미 사진을 배치해두었으므로, 사진 사이사이에 들어갈 **고품질의 텍스트 원고**를 작성해야 합니다.

              ## [핵심 작성 전략 & 알고리즘]
              1. **스마트블록 대응 (제목 & 키워드)**: 
                 - 제목과 본문에 메인 키워드뿐만 아니라 연관된 세부 키워드(예: 가격, 주차, 예약, 웨이팅, 꿀팁 등)를 자연스럽게 섞어 작성하세요.
                 - 제목은 "남들이 검색할 만한" 매력적인 문구여야 합니다.

              2. **문단형 스니펫 구조 (DIA+ 로직)**:
                 - 글의 구조를 **[소주제(인용구 스타일) -> 3~5줄의 깊이 있는 문단]** 형식으로 반복하세요.
                 - 이렇게 해야 사용자가 문단 사이에 사진을 배치하기 좋습니다.
                 - 내용은 단순 나열이 아니라, 독자의 궁금증을 해소하는 '구체적인 경험/정보' 위주여야 합니다.

              3. **디테일 표기 원칙**:
                 - 가격은 '9.0' 대신 **'9,000원'**으로 화폐 단위를 명확히 적으세요. (알고리즘 인식용)
                 - 모호한 표현보다는 정확한 수치나 명칭을 사용하세요.

              4. **체류시간 확보**:
                 - 도입부에서 이탈하지 않도록 흥미를 유발하고, 핵심 꿀팁이나 총평은 글 하단부에 배치하여 끝까지 읽게 만드세요.

              ## [작성 정보]
              - **주제:** ${keyword}
              - **기초 정보:** ${rawInfo}
              - **테마/페르소나:** ${persona}

              ## [출력 양식 (Strict Format)]
              1. **[제목 후보]**: 클릭을 부르는 제목 3개 (메인+세부키워드 조합)
              2. **[본문]**: 
                 - 서론 (방문 계기 등)
                 - **## 소제목 1** (특징/분위기 등)
                 - 내용...
                 - **## 소제목 2** (메뉴/맛/정보 등)
                 - 내용...
                 - **## 소제목 3** (주차/웨이팅/꿀팁)
                 - 내용...
                 - **## 총평/마무리**
                 - 내용...
              3. **분량**: 공백 포함 약 1,500자 ~ 2,000자.
              4. **형식**: 소제목(##) 활용, 가독성 좋은 문단 나눔.
              5. **[추천 태그]**: #키워드 10개 (한 줄로, # 다음에 공백 하나로 구분하고 공백 외 다른 특수문자나 문자 절대 넣지 말 것) 
                    [ex) #키워드1 #키워드2 #키워드3 #키워드4 #키워드5 ]
              6. **말투**: AI 티가 나지 않는 자연스러운 한국어 구어체.
              7. **SEO**: 메인 키워드 '${keyword}'를 본문 전체에 걸쳐 **5~7회** 자연스럽게 포함하세요.

              🚨 **절대 준수 사항 (Strict Rules)**: 이모지는 제목과 본문에 절대 사용하지 마세요. 오직 텍스트로만 승부합니다.
            `
          }]
        }]
      })
    });
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Generation failed" });
  }
}