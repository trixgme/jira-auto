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
    const { issueKey, issueTitle, issueDescription } = await req.json();

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

    const commentsText = comments.map((comment, index) => 
      `Comment ${index + 1} (${comment.author}): ${comment.body}`
    ).join('\n\n');

    const prompt = `
Analyze the following Jira issue comments and evaluate the project communication quality on a scale of 1-10:

Issue Title: ${issueTitle}
Issue Description: ${issueDescription || "No description provided"}

Comments:
${commentsText}

Analyze the following aspects:
Evaluation Criteria (Score 1–10 each):
Collaboration Quality
Are team members collaborating constructively, or is there conflict/blame?

Problem-Solving Focus
Are discussions centered on resolving the core issue with concrete solutions, or are they going off-topic?

Communication Tone
Is the tone generally positive/supportive, neutral/factual, or negative/frustrated?

Discussion Coherence
Are participants engaging in the same conversation thread, or talking past each other?

Participation Patterns
Who is contributing? Is participation balanced, or are some dominating or staying silent?

Urgency Indicators
Are there signs of stress, time pressure, or urgency (e.g., after-hours work, repeated nudges)?

Scoring Guidelines:
9–10: Excellent – Very constructive, aligned, respectful, and solution-focused.

7–8: Good – Generally positive and collaborative, with minor issues.

5–6: Average – Mixed signals; some confusion or uneven participation.

3–4: Poor – Misalignment, off-topic threads, or signs of frustration/conflict.

1–2: Very Poor – Toxic, chaotic, or highly dysfunctional communication.

Final Summary:
Key Strengths: What aspects of the communication or collaboration are working well?

Main Concerns: What issues should the team be aware of?

Immediate Actions: What should be addressed right now?

Project Health: Overall risk level based on the above (Low / Medium / High)

Respond with ONLY a JSON object in this format:
{
  "score": <number 1-10>,
  "analysisKo": "<detailed analysis in Korean>",
  "analysisEn": "<detailed analysis in English>",
  "isHardToDetermine": <boolean>,
  "keyIssues": ["<key issue 1>", "<key issue 2>"],
  "recommendations": ["<recommendation 1>", "<recommendation 2>"]
}
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert project manager and communication analyst who evaluates team collaboration quality based on issue comments.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
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
      const result = JSON.parse(content);
      
      // 점수 설명 추가
      const scoreDescription = getScoreDescription(result.score);
      result.scoreDescriptionKo = scoreDescription.ko;
      result.scoreDescriptionEn = scoreDescription.en;
      
      return NextResponse.json(result);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", content);
      return NextResponse.json(
        { error: "Invalid response format from AI" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error analyzing comments:", error);
    return NextResponse.json(
      { error: "Failed to analyze comments" },
      { status: 500 }
    );
  }
}