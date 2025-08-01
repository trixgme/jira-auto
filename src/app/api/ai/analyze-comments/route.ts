import { NextRequest, NextResponse } from "next/server";
import { JiraClient } from "@/lib/jira";

function getScoreDescription(score: number): { ko: string; en: string } {
  if (score >= 9) {
    return {
      ko: "매우 건설적이고 협력적인 분위기",
      en: "Very constructive and collaborative atmosphere"
    };
  } else if (score >= 7) {
    return {
      ko: "대체로 긍정적이고 문제 해결 지향적",
      en: "Generally positive and solution-oriented"
    };
  } else if (score >= 5) {
    return {
      ko: "보통 수준의 소통, 일부 개선 필요",
      en: "Average communication level, some improvement needed"
    };
  } else if (score >= 3) {
    return {
      ko: "소통에 문제가 있으며 주의 필요",
      en: "Communication issues present, attention required"
    };
  } else {
    return {
      ko: "매우 부정적이거나 비생산적인 분위기",
      en: "Very negative or unproductive atmosphere"
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { issueKey, issueTitle, issueDescription, language = 'ko' } = await req.json();

    if (!issueKey) {
      return NextResponse.json(
        { error: "Issue key is required" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // Jira에서 댓글 가져오기
    const jiraClient = new JiraClient();
    const comments = await jiraClient.getIssueComments(issueKey);

    if (!comments || comments.length < 2) {
      return NextResponse.json(
        { error: "Not enough comments to analyze (minimum 2 required)" },
        { status: 400 }
      );
    }

    const commentsText = comments.map((comment: any, index: number) => 
      `Comment ${index + 1} (${comment.author}): ${comment.body}`
    ).join('\n\n');

    // 언어별 프롬프트 생성
    const getPromptByLanguage = (lang: string) => {
      const languageNames: { [key: string]: string } = {
        'ko': 'Korean',
        'en': 'English', 
        'ja': 'Japanese',
        'zh': 'Chinese',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'pt': 'Portuguese',
        'ru': 'Russian',
        'ar': 'Arabic',
        'hi': 'Hindi',
        'vi': 'Vietnamese',
        'it': 'Italian',
        'tr': 'Turkish',
        'pl': 'Polish',
        'nl': 'Dutch',
        'sv': 'Swedish',
        'da': 'Danish',
        'no': 'Norwegian',
        'fi': 'Finnish',
        'th': 'Thai',
        'id': 'Indonesian',
        'cs': 'Czech',
        'hu': 'Hungarian',
        'ro': 'Romanian',
        'bg': 'Bulgarian',
        'he': 'Hebrew'
      };
      
      const targetLanguage = languageNames[lang] || 'English';
      
      return `
Analyze the following Jira issue comments and evaluate the project communication quality on a scale of 1-10.

Issue Title: ${issueTitle}
Issue Description: ${issueDescription || "No description provided"}

Comments:
${commentsText}

Analyze the following aspects:
Evaluation Criteria (Score 1–10 each):
- Collaboration Quality: Are team members collaborating constructively, or is there conflict/blame?
- Problem-Solving Focus: Are discussions centered on resolving the core issue with concrete solutions, or are they going off-topic?
- Communication Tone: Is the tone generally positive/supportive, neutral/factual, or negative/frustrated?
- Discussion Coherence: Are participants engaging in the same conversation thread, or talking past each other?
- Participation Patterns: Who is contributing? Is participation balanced, or are some dominating or staying silent?
- Urgency Indicators: Are there signs of stress, time pressure, or urgency?

Scoring Guidelines:
9–10: Excellent – Very constructive, aligned, respectful, and solution-focused.
7–8: Good – Generally positive and collaborative, with minor issues.
5–6: Average – Mixed signals; some confusion or uneven participation.
3–4: Poor – Misalignment, off-topic threads, or signs of frustration/conflict.
1–2: Very Poor – Toxic, chaotic, or highly dysfunctional communication.

Please provide your analysis in ${targetLanguage} and respond with ONLY a JSON object in this format:
{
  "score": <number 1-10>,
  "analysis": "<detailed analysis in ${targetLanguage}>",
  "isHardToDetermine": <boolean>,
  "keyIssues": ["<key issue 1 in ${targetLanguage}>", "<key issue 2 in ${targetLanguage}>"],
  "recommendations": ["<recommendation 1 in ${targetLanguage}>", "<recommendation 2 in ${targetLanguage}>"]
}
`;
    };
    
    const prompt = getPromptByLanguage(language);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1",
        messages: [
          {
            role: "system",
            content: "You are an expert project manager and communication analyst who evaluates team collaboration quality based on issue comments. Always respond with valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 16384,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("OpenAI API error:", error);
      return NextResponse.json(
        { error: "Failed to analyze comments" },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("OpenAI API Response:", JSON.stringify(data, null, 2));
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Unexpected OpenAI response structure:", data);
      return NextResponse.json(
        { error: "Invalid OpenAI response structure" },
        { status: 500 }
      );
    }
    
    const content = data.choices[0].message.content;
    console.log("AI Response Content:", content);
    
    try {
      // JSON 응답에서 코드 블록이나 다른 텍스트 제거
      let cleanContent = content.trim();
      
      // JSON 코드 블록이 있다면 제거
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const result = JSON.parse(cleanContent);
      
      // 필수 필드 검증 및 기본값 설정
      const getDefaultAnalysis = (lang: string) => {
        const defaults: { [key: string]: string } = {
          'ko': '분석을 완료할 수 없습니다.',
          'en': 'Unable to complete analysis.',
          'ja': '分析を完了できませんでした。',
          'zh': '无法完成分析。',
          'es': 'No se pudo completar el análisis.',
          'fr': 'Impossible de terminer l\'analyse.',
          'de': 'Analyse konnte nicht abgeschlossen werden.',
          'pt': 'Não foi possível completar a análise.',
          'ru': 'Не удалось завершить анализ.',
          'ar': 'لا يمكن إكمال التحليل.',
          'hi': 'विश्लेषण पूरा नहीं किया जा सका।',
          'vi': 'Không thể hoàn thành phân tích.',
          'it': 'Impossibile completare l\'analisi.',
          'tr': 'Analiz tamamlanamadı.',
          'pl': 'Nie można ukończyć analizy.',
          'nl': 'Kan analyse niet voltooien.',
          'sv': 'Kan inte slutföra analysen.',
          'da': 'Kan ikke fuldføre analysen.',
          'no': 'Kan ikke fullføre analysen.',
          'fi': 'Analyysiä ei voitu suorittaa loppuun.',
          'th': 'ไม่สามารถทำการวิเคราะห์ให้เสร็จสิ้นได้',
          'id': 'Tidak dapat menyelesaikan analisis.',
          'cs': 'Nelze dokončit analýzu.',
          'hu': 'Nem sikerült befejezni az elemzést.',
          'ro': 'Nu s-a putut finaliza analiza.',
          'bg': 'Не може да се завърши анализът.',
          'he': 'לא ניתן להשלים את הניתוח.'
        };
        return defaults[lang] || defaults['en'];
      };
      
      const validatedResult = {
        score: result.score || 5,
        analysis: result.analysis || getDefaultAnalysis(language),
        isHardToDetermine: result.isHardToDetermine || false,
        keyIssues: Array.isArray(result.keyIssues) ? result.keyIssues : [],
        recommendations: Array.isArray(result.recommendations) ? result.recommendations : []
      };
      
      // 점수 설명 추가
      const scoreDescription = getScoreDescription(validatedResult.score);
      const finalResult = {
        ...validatedResult,
        scoreDescription: language === 'en' ? scoreDescription.en : scoreDescription.ko
      };
      
      return NextResponse.json(finalResult);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", content);
      console.error("Parse error:", parseError);
      
      // 파싱 실패 시 기본 응답 반환
      const getFallbackMessages = (lang: string) => {
        const messages: { [key: string]: { analysis: string; issue: string; recommendation: string } } = {
          'ko': {
            analysis: 'AI 응답 파싱에 실패했습니다. 댓글을 수동으로 검토해주세요.',
            issue: 'AI 분석 오류',
            recommendation: '댓글을 수동으로 검토하고 팀과 직접 소통하세요'
          },
          'en': {
            analysis: 'Failed to parse AI response. Please review comments manually.',
            issue: 'AI analysis error',
            recommendation: 'Review comments manually and communicate directly with the team'
          },
          'ja': {
            analysis: 'AI応答の解析に失敗しました。コメントを手動で確認してください。',
            issue: 'AI分析エラー',
            recommendation: 'コメントを手動で確認し、チームと直接コミュニケーションを取ってください'
          },
          'zh': {
            analysis: 'AI响应解析失败。请手动检查评论。',
            issue: 'AI分析错误',
            recommendation: '手动检查评论并与团队直接沟通'
          },
          'es': {
            analysis: 'Error al analizar la respuesta de IA. Revise los comentarios manualmente.',
            issue: 'Error de análisis de IA',
            recommendation: 'Revise los comentarios manualmente y comuníquese directamente con el equipo'
          },
          'fr': {
            analysis: 'Échec de l\'analyse de la réponse IA. Veuillez examiner les commentaires manuellement.',
            issue: 'Erreur d\'analyse IA',
            recommendation: 'Examinez les commentaires manuellement et communiquez directement avec l\'équipe'
          },
          'de': {
            analysis: 'KI-Antwort-Parsing fehlgeschlagen. Bitte überprüfen Sie die Kommentare manuell.',
            issue: 'KI-Analysefehler',
            recommendation: 'Überprüfen Sie die Kommentare manuell und kommunizieren Sie direkt mit dem Team'
          },
          'pt': {
            analysis: 'Falha ao analisar resposta da IA. Revise os comentários manualmente.',
            issue: 'Erro de análise da IA',
            recommendation: 'Revise os comentários manualmente e comunique-se diretamente com a equipe'
          },
          'ru': {
            analysis: 'Не удалось разобрать ответ ИИ. Пожалуйста, проверьте комментарии вручную.',
            issue: 'Ошибка анализа ИИ',
            recommendation: 'Проверьте комментарии вручную и общайтесь напрямую с командой'
          },
          'ar': {
            analysis: 'فشل في تحليل استجابة الذكاء الاصطناعي. يرجى مراجعة التعليقات يدوياً.',
            issue: 'خطأ في تحليل الذكاء الاصطناعي',
            recommendation: 'راجع التعليقات يدوياً وتواصل مباشرة مع الفريق'
          },
          'hi': {
            analysis: 'AI प्रतिक्रिया पार्सिंग विफल। कृपया टिप्पणियों की मैन्युअल समीक्षा करें।',
            issue: 'AI विश्लेषण त्रुटि',
            recommendation: 'टिप्पणियों की मैन्युअल समीक्षा करें और टीम के साथ सीधे संवाद करें'
          },
          'vi': {
            analysis: 'Phân tích phản hồi AI thất bại. Vui lòng xem xét bình luận thủ công.',
            issue: 'Lỗi phân tích AI',
            recommendation: 'Xem xét bình luận thủ công và giao tiếp trực tiếp với nhóm'
          },
          'it': {
            analysis: 'Parsing della risposta AI fallito. Si prega di rivedere i commenti manualmente.',
            issue: 'Errore di analisi AI',
            recommendation: 'Rivedere i commenti manualmente e comunicare direttamente con il team'
          },
          'tr': {
            analysis: 'AI yanıt ayrıştırması başarısız. Lütfen yorumları manuel olarak inceleyin.',
            issue: 'AI analiz hatası',
            recommendation: 'Yorumları manuel olarak inceleyin ve ekiple doğrudan iletişim kurun'
          },
          'pl': {
            analysis: 'Parsowanie odpowiedzi AI nie powiodło się. Przejrzyj komentarze ręcznie.',
            issue: 'Błąd analizy AI',
            recommendation: 'Przejrzyj komentarze ręcznie i komunikuj się bezpośrednio z zespołem'
          },
          'nl': {
            analysis: 'AI-respons parsing mislukt. Bekijk de opmerkingen handmatig.',
            issue: 'AI-analysefout',
            recommendation: 'Bekijk de opmerkingen handmatig en communiceer direct met het team'
          },
          'sv': {
            analysis: 'AI-svar parsing misslyckades. Granska kommentarerna manuellt.',
            issue: 'AI-analysfel',
            recommendation: 'Granska kommentarerna manuellt och kommunicera direkt med teamet'
          },
          'da': {
            analysis: 'AI-svar parsing mislykkedes. Gennemgå kommentarerne manuelt.',
            issue: 'AI-analysefejl',
            recommendation: 'Gennemgå kommentarerne manuelt og kommuniker direkte med teamet'
          },
          'no': {
            analysis: 'AI-svar parsing mislyktes. Gjennomgå kommentarene manuelt.',
            issue: 'AI-analysefeil',
            recommendation: 'Gjennomgå kommentarene manuelt og kommuniser direkte med teamet'
          },
          'fi': {
            analysis: 'AI-vastauksen jäsentäminen epäonnistui. Tarkista kommentit manuaalisesti.',
            issue: 'AI-analyysivirhe',
            recommendation: 'Tarkista kommentit manuaalisesti ja kommunikoi suoraan tiimin kanssa'
          },
          'th': {
            analysis: 'การแยกวิเคราะห์การตอบสนองของ AI ล้มเหลว กรุณาตรวจสอบความคิดเห็นด้วยตนเอง',
            issue: 'ข้อผิดพลาดในการวิเคราะห์ AI',
            recommendation: 'ตรวจสอบความคิดเห็นด้วยตนเองและสื่อสารโดยตรงกับทีม'
          },
          'id': {
            analysis: 'Parsing respons AI gagal. Harap tinjau komentar secara manual.',
            issue: 'Kesalahan analisis AI',
            recommendation: 'Tinjau komentar secara manual dan berkomunikasi langsung dengan tim'
          },
          'cs': {
            analysis: 'Parsování AI odpovědi selhalo. Zkontrolujte komentáře ručně.',
            issue: 'Chyba AI analýzy',
            recommendation: 'Zkontrolujte komentáře ručně a komunikujte přímo s týmem'
          },
          'hu': {
            analysis: 'AI válasz elemzése sikertelen. Kérjük, tekintse át a megjegyzéseket manuálisan.',
            issue: 'AI elemzési hiba',
            recommendation: 'Tekintse át a megjegyzéseket manuálisan és kommunikáljon közvetlenül a csapattal'
          },
          'ro': {
            analysis: 'Parsarea răspunsului AI a eșuat. Vă rugăm să revizuiți comentariile manual.',
            issue: 'Eroare de analiză AI',
            recommendation: 'Revizuiți comentariile manual și comunicați direct cu echipa'
          },
          'bg': {
            analysis: 'Парсирането на AI отговора се провали. Моля, прегледайте коментарите ръчно.',
            issue: 'Грешка в AI анализа',
            recommendation: 'Прегледайте коментарите ръчно и комуникирайте директно с екипа'
          },
          'he': {
            analysis: 'ניתוח תגובת AI נכשל. אנא בדוק את ההערות באופן ידני.',
            issue: 'שגיאת ניתוח AI',
            recommendation: 'בדוק את ההערות באופן ידני ותקשר ישירות עם הצוות'
          }
        };
        return messages[lang] || messages['en'];
      };
      
      const fallbackMessages = getFallbackMessages(language);
      const fallbackResult = {
        score: 5,
        analysis: fallbackMessages.analysis,
        isHardToDetermine: true,
        keyIssues: [fallbackMessages.issue],
        recommendations: [fallbackMessages.recommendation]
      };
      
      const scoreDescription = getScoreDescription(fallbackResult.score);
      const finalFallbackResult = {
        ...fallbackResult,
        scoreDescription: language === 'en' ? scoreDescription.en : scoreDescription.ko
      };
      
      return NextResponse.json(finalFallbackResult);
    }
  } catch (error) {
    console.error("Error analyzing comments:", error);
    return NextResponse.json(
      { error: "Failed to analyze comments" },
      { status: 500 }
    );
  }
}