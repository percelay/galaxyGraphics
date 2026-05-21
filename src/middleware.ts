import { NextRequest, NextResponse } from "next/server";

const adminRealm = "Galaxy Graphics Admin";

const isPublicCatalogApi = (request: NextRequest): boolean => {
  const { pathname } = request.nextUrl;

  if (request.method === "GET" && pathname === "/api/catalog/search") {
    return true;
  }

  return (
    request.method === "GET" &&
    pathname.startsWith("/api/catalog/images/")
  );
};

const timingSafeEqual = (left: string, right: string): boolean => {
  const maxLength = Math.max(left.length, right.length);
  let mismatch = left.length === right.length ? 0 : 1;

  for (let index = 0; index < maxLength; index += 1) {
    mismatch |=
      (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }

  return mismatch === 0;
};

const isAuthorized = (request: NextRequest): boolean => {
  const expectedUsername = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedUsername || !expectedPassword) {
    return process.env.NODE_ENV !== "production";
  }

  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Basic ")) {
    return false;
  }

  try {
    const decoded = atob(authorization.slice("Basic ".length));
    const separatorIndex = decoded.indexOf(":");

    if (separatorIndex === -1) {
      return false;
    }

    const username = decoded.slice(0, separatorIndex);
    const password = decoded.slice(separatorIndex + 1);

    return (
      timingSafeEqual(username, expectedUsername) &&
      timingSafeEqual(password, expectedPassword)
    );
  } catch {
    return false;
  }
};

const unauthorizedResponse = (): NextResponse => {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${adminRealm}", charset="UTF-8"`
    }
  });
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/catalog") && isPublicCatalogApi(request)) {
    return NextResponse.next();
  }

  if (!isAuthorized(request)) {
    return unauthorizedResponse();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/catalog/:path*"]
};
