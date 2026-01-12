// api/search.js
export default async function handler(req, res) {
  const { keyword, theme } = req.body;
  const API_KEY = process.env.VITE_PERPLEXITY_API_KEY; // Vercel 환경변수에서 가져옴

  if (!API_KEY) return res.status(500).json({ error: "API Key missing" });

  let searchGuide = "";
  switch (theme) {
    case 'restaurant': searchGuide = "주차 정보, 대표 메뉴 및 가격, 실제 방문자들의 맛 평가, 가게 분위기(인테리어), 웨이팅 꿀팁, 영업시간, 위치"; break;
    case 'travel': searchGuide = "입장료, 소요 시간, 주요 포토존, 주차장 위치 및 요금, 근처 맛집, 관람 꿀팁, 필수 준비물"; break;
    case 'fashion': searchGuide = "제품 소재 및 재질, 사이즈 팁(실측), 착용감, 가격대, 구매처, 코디 추천 조합, 최신 트렌드 반영 여부"; break;
    case 'finance': searchGuide = "금리/수익률 정확한 수치, 가입 조건, 혜택 요약, 장단점 분석, 주의사항(예금자 보호 등), 신청 방법"; break;
    case 'daily': searchGuide = "관련된 최신 이슈, 사람들의 반응, 주요 내용 요약, 논란이 있다면 그 이유, 개인적인 생각 포인트"; break;
    default: searchGuide = "기본 정보 요약";
  }

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          { role: 'system', content: '당신은 전문 리서치 어시스턴트입니다. 한국어로 답변하세요.' },
          { role: 'user', content: `"${keyword}"에 대해 다음 정보를 중점적으로 조사해줘: [${searchGuide}]` }
        ]
      })
    });
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Search failed" });
  }
}