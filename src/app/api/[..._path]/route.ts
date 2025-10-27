import { NextRequest, NextResponse } from 'next/server';

// Custom API passthrough that properly handles Authorization headers
async function handleRequest(
  request: NextRequest,
  method: string
) {
  try {
    const apiUrl = process.env.LANGGRAPH_API_URL;
    const apiKey = process.env.LANGSMITH_API_KEY;

    if (!apiUrl) {
      throw new Error("LANGGRAPH_API_URL environment variable is required");
    }

    // Extract the path from the request URL
    const path = request.nextUrl.pathname.replace(/^\/?api\//, "");

    // Build the target URL
    const url = new URL(request.url);
    const searchParams = new URLSearchParams(url.search);
    searchParams.delete("_path");
    searchParams.delete("nxtP_path");
    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : "";
    const targetUrl = `${apiUrl}/${path}${queryString}`;

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add API key if available
    if (apiKey) {
      headers['x-api-key'] = apiKey;
    }

    // Forward Authorization header from client request
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
      console.log('Forwarding Authorization header:', authHeader.substring(0, 20) + '...');
    }

    // Prepare request options
    const options: RequestInit = {
      method,
      headers,
    };

    // Add body for methods that support it
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      options.body = await request.text();
    }

    console.log(`Proxying ${method} request to: ${targetUrl}`);
    console.log('Request headers:', headers);

    // Make the request to LangGraph server
    const response = await fetch(targetUrl, options);

    // Return the response with CORS headers
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      },
    });
  } catch (error) {
    console.error('API passthrough error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return handleRequest(request, 'GET');
}

export async function POST(request: NextRequest) {
  return handleRequest(request, 'POST');
}

export async function PUT(request: NextRequest) {
  return handleRequest(request, 'PUT');
}

export async function PATCH(request: NextRequest) {
  return handleRequest(request, 'PATCH');
}

export async function DELETE(request: NextRequest) {
  return handleRequest(request, 'DELETE');
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  });
}

export const runtime = 'edge';
