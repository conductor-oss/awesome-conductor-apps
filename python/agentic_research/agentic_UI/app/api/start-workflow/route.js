// app/api/status/route.js
import { NextResponse } from 'next/server';
import { startWorkflow, getWorkflowStatus } from '../../../../lib/orkesClient';

export async function POST(request) {
  try {
    const body = await request.json();

    const workflowId = await startWorkflow({
      name: 'agentic_research',
      input: body,
    });

    return NextResponse.json({ workflowId });
  } catch (err) {
    console.error('Failed to start workflow:', err);
    return NextResponse.json({ error: 'Failed to start workflow' }, { status: 500 });
  }
}

