import { NextRequest, NextResponse } from "next/server";
import { JiraClient } from "@/lib/jira";

function getDifficultyDescription(level: number): string {
  switch (level) {
    case 1:
      return "매우 간단한 작업 - 경험이 적은 개발자도 쉽게 처리 가능";
    case 2:
      return "간단한 작업 - 기본적인 이해만 있으면 처리 가능";
    case 3:
      return "중간 복잡도 - 어느 정도의 경험과 설계 필요";
    case 4:
      return "복잡한 작업 - 숙련된 개발자와 신중한 계획 필요";
    case 5:
      return "매우 복잡한 작업 - 아키텍처 변경이나 광범위한 영향";
    default:
      return "알 수 없는 난이도";
  }
}

export async function POST(req: NextRequest) {
  try {
    const { 
      title, 
      description, 
      issueType, 
      labels, 
      issueKey,
      priority,
      components,
      fixVersions,
      commentCount,
      storyPoints,
      timeEstimate,
      status
    } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const prompt = `
Analyze the following Jira issue and estimate its difficulty level on a scale of 1-5:
1 = Very Easy (simple bug fix, typo, minor UI change)
2 = Easy (small feature, straightforward bug fix)
3 = Medium (moderate feature, requires some design)
4 = Hard (complex feature, multiple components)
5 = Very Hard (architectural changes, major feature)

Issue Details:
- Title: ${title}
- Type: ${issueType || "Unknown"}
- Priority: ${priority || "Not specified"}
- Status: ${status || "Unknown"}
- Description: ${description || "No description provided"}
- Labels: ${labels?.join(", ") || "None"}
- Components: ${components?.join(", ") || "None"}
- Fix Versions: ${fixVersions?.join(", ") || "None"}
- Comment Count: ${commentCount || 0}
- Story Points: ${storyPoints || "Not estimated"}
- Time Estimate: ${timeEstimate || "Not estimated"}

Consider all available information including:
- Issue type and priority level
- Number of comments (may indicate complexity or issues)
- Story points if available
- Components affected
- Labels and fix versions
- Description content and technical details

Respond with ONLY a JSON object in this format:
{
  "difficulty": <number 1-5>,
  "reasoning": "<detailed explanation in English>",
  "reasoningKo": "<detailed explanation in Korean>",
  "estimatedHours": <estimated hours to complete>
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
            content: "You are an expert software engineer who estimates task difficulty based on Jira issues. You must respond with valid JSON only, no additional text or formatting.",
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
        { error: "Failed to analyze difficulty" },
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
      
      // Jira에 댓글 추가
      if (issueKey) {
        try {
          const jiraClient = new JiraClient();
          const commentText = `🤖 AI 난이도 분석 결과

난이도: ${'⭐'.repeat(result.difficulty)} (${result.difficulty}/5)
예상 소요 시간: ${result.estimatedHours}시간

📊 분석 근거 (English):
${result.reasoning}

📊 분석 근거 (한국어):
${result.reasoningKo || result.reasoning}

난이도 설명:
${getDifficultyDescription(result.difficulty)}

_이 댓글은 AI에 의해 자동으로 생성되었습니다._`;
          
          await jiraClient.addComment(issueKey, commentText);
          result.commentAdded = true;
        } catch (commentError) {
          console.error("Failed to add comment to Jira:", commentError);
          result.commentAdded = false;
        }
      }
      
      return NextResponse.json(result);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", content);
      return NextResponse.json(
        { error: "Invalid response format from AI" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error analyzing difficulty:", error);
    return NextResponse.json(
      { error: "Failed to analyze difficulty" },
      { status: 500 }
    );
  }
}