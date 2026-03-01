function setResponseCookie(response: Response, value: string) {
  const headers = new Headers(response.headers);
  headers.set("Set-Cookie", value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export const http = {
  setResponseCookie,
};
