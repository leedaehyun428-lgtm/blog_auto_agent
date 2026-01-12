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
              당신은 네이버 블로그 상위 노출 전문 작가입니다.
              선택된 테마인 **[${theme}]**에 맞춰 글을 작성하세요.

              ## 페르소나: ${persona}
              ## 주제: ${keyword}
              ## 정보: ${rawInfo}

              ## 🚨 절대 준수 사항 (Strict Rules):
              1. **이모지 금지**: 제목과 본문에 이모지를 **절대 사용하지 마세요.**
              2. **제목 추천**: 글 맨 위에 **[클릭을 부르는 제목 후보 3가지]**를 먼저 보여주세요.
              3. **해시태그**: 글 맨 마지막에 **[추천 해시태그 10개]**를 한 줄로 작성하세요.

              ## 작성 가이드:
              1. **구성**: ${structure}
              2. **SEO**: 메인 키워드 '${keyword}'를 본문 전체에 걸쳐 **5~7회** 자연스럽게 포함하세요.
              3. **분량**: 공백 포함 약 1,500자 ~ 2,000자.
              4. **형식**: 소제목(##) 활용, 가독성 좋은 문단 나눔.
              5. **말투**: AI 티가 나지 않는 자연스러운 한국어 구어체.
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