import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { endpoint: string[] } }
) {
  try {
    const { endpoint } = params;
    const endpointPath = endpoint.join('/');

    // 验证endpoint参数
    if (!endpointPath || endpoint.length === 0) {
      return NextResponse.json(
        { code: 400, msg: '缺少endpoint参数', data: null, success: false },
        { status: 400 }
      );
    }

    const authBaseUrl = process.env.AUTH_BASE_URL;
    if (!authBaseUrl) {
      return NextResponse.json(
        { code: 500, msg: '认证服务配置错误', data: null, success: false },
        { status: 500 }
      );
    }

    const body = await request.json();

    // 构建完整的API URL
    const apiUrl = `${authBaseUrl}/gw/chatweb/user/${endpointPath}`;

    console.log(`Proxying request to: ${apiUrl}`);
    console.log('Request body:', body);

    // 代理请求到认证服务
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    console.log(`Response from ${apiUrl}:`, data);

    if (!response.ok) {
      return NextResponse.json(
        {
          code: response.status,
          msg: data.msg || '请求失败',
          data: data.data || null,
          success: false
        },
        { status: response.status }
      );
    }

    const res = NextResponse.json(data);

    if (endpointPath === 'email/regLogin') {
      res.cookies.set('token', data.data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
    }
    return res;
  } catch (error) {
    console.error('Auth proxy error:', error);
    return NextResponse.json(
      { code: 500, msg: '服务器内部错误', data: null, success: false },
      { status: 500 }
    );
  }
}

// 支持其他HTTP方法
export async function GET(
  request: NextRequest,
  { params }: { params: { endpoint: string[] } }
) {
  return handleRequest(request, params, 'GET');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { endpoint: string[] } }
) {
  return handleRequest(request, params, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { endpoint: string[] } }
) {
  return handleRequest(request, params, 'DELETE');
}

async function handleRequest(
  request: NextRequest,
  { endpoint }: { endpoint: string[] },
  method: string
) {
  try {
    const endpointPath = endpoint.join('/');

    if (!endpointPath || endpoint.length === 0) {
      return NextResponse.json(
        { code: 400, msg: '缺少endpoint参数', data: null, success: false },
        { status: 400 }
      );
    }

    const authBaseUrl = process.env.AUTH_BASE_URL;
    if (!authBaseUrl) {
      return NextResponse.json(
        { code: 500, msg: '认证服务配置错误', data: null, success: false },
        { status: 500 }
      );
    }

    const apiUrl = `${authBaseUrl}/gw/chatweb/user/${endpointPath}`;
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    console.log(`Proxying ${method} request to: ${apiUrl}`);

    // 构建查询参数
    const queryString = searchParams.toString();
    const fullUrl = queryString ? `${apiUrl}?${queryString}` : apiUrl;

    const response = await fetch(fullUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    console.log(`Response from ${apiUrl}:`, data);

    if (!response.ok) {
      return NextResponse.json(
        {
          code: response.status,
          msg: data.msg || '请求失败',
          data: data.data || null,
          success: false
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Auth proxy error:', error);
    return NextResponse.json(
      { code: 500, msg: '服务器内部错误', data: null, success: false },
      { status: 500 }
    );
  }
}
