import { NextResponse } from 'next/server';
import { getWorkflowStatus } from '../../../lib/orkesClient'; // Adjust path if needed

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('workflowId');

    if (!workflowId) {
      return NextResponse.json({ error: 'Missing workflowId' }, { status: 400 });
    }

    const status = await getWorkflowStatus(workflowId);

    return NextResponse.json({ status }); // 👈 This matches what your frontend expects
  } catch (error) {
    console.error('Error in /api/status route:', error);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}
