import { NextRequest, NextResponse } from "next/server";
import { JiraClient } from "@/lib/jira";

export async function POST(req: NextRequest) {
  try {
    const { issueKey, comment } = await req.json();

    if (!issueKey || !comment) {
      return NextResponse.json(
        { error: "Issue key and comment are required" },
        { status: 400 }
      );
    }

    const client = new JiraClient();
    const result = await client.addComment(issueKey, comment);

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Error adding comment to Jira:", error);
    return NextResponse.json(
      { error: "Failed to add comment to Jira" },
      { status: 500 }
    );
  }
}