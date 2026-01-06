import { NextRequest, NextResponse } from 'next/server';

// Get backend URL from environment variable
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://3.1.6.249';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params, 'PUT');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params, 'PATCH');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params, 'DELETE');
}

async function handleRequest(
  request: NextRequest,
  params: { path: string[] },
  method: string
) {
  try {
    // Reconstruct the path
    const path = '/' + params.path.join('/');
    
    // Get query string
    const searchParams = request.nextUrl.searchParams.toString();
    const queryString = searchParams ? `?${searchParams}` : '';
    
    // Construct backend URL
    const backendUrl = `${BACKEND_URL}${path}${queryString}`;
    
    // Get request body for POST, PUT, PATCH
    let body: any = null;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        const contentType = request.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          body = await request.json();
        } else if (contentType?.includes('multipart/form-data')) {
          // For FormData, we need to get it as FormData
          body = await request.formData();
        } else {
          body = await request.text();
        }
      } catch (e) {
        // Body might be empty, that's okay
        body = null;
      }
    }
    
    // Forward headers (exclude host and connection headers)
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      // Skip headers that shouldn't be forwarded
      if (
        !['host', 'connection', 'content-length'].includes(key.toLowerCase())
      ) {
        headers[key] = value;
      }
    });
    
    // Make request to backend
    const fetchOptions: RequestInit = {
      method,
      headers,
    };
    
    if (body) {
      if (body instanceof FormData) {
        // For FormData, don't set Content-Type header (browser will set it with boundary)
        fetchOptions.body = body;
        // Remove Content-Type from headers to let fetch set it automatically
        delete headers['content-type'];
      } else if (typeof body === 'string') {
        fetchOptions.body = body;
      } else {
        fetchOptions.body = JSON.stringify(body);
        headers['content-type'] = 'application/json';
      }
    }
    
    const response = await fetch(backendUrl, fetchOptions);
    
    // Get response data
    const contentType = response.headers.get('content-type');
    let responseData: any;
    
    if (contentType?.includes('application/json')) {
      responseData = await response.json();
    } else if (contentType?.includes('text/')) {
      responseData = await response.text();
    } else {
      // For binary data (images, files, etc.)
      responseData = await response.arrayBuffer();
    }
    
    // Create response with same status and headers
    const nextResponse = new NextResponse(
      typeof responseData === 'string' || responseData instanceof ArrayBuffer
        ? responseData
        : JSON.stringify(responseData),
      {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
    
    return nextResponse;
  } catch (error: any) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      {
        message: 'Proxy request failed',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

