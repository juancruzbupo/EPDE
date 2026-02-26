import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001/api/v1';

const loginDuration = new Trend('login_duration');
const refreshDuration = new Trend('refresh_duration');
const failureRate = new Rate('failures');

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    failures: ['rate<0.01'],
    login_duration: ['p(95)<1000'],
    refresh_duration: ['p(95)<300'],
  },
};

function extractCookies(res) {
  const cookies = {};
  const setCookieHeaders = res.headers['Set-Cookie'];
  if (!setCookieHeaders) return cookies;
  const headers = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
  for (const header of headers) {
    const [nameValue] = header.split(';');
    const [name, value] = nameValue.split('=');
    cookies[name.trim()] = value.trim();
  }
  return cookies;
}

export default function () {
  let accessToken = null;

  group('Login', () => {
    const loginRes = http.post(
      `${BASE_URL}/auth/login`,
      JSON.stringify({
        email: `loadtest+${__VU}@epde.com.ar`,
        password: 'LoadTest123!',
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );

    loginDuration.add(loginRes.timings.duration);

    const loginOk = check(loginRes, {
      'login status is 200 or 201': (r) => r.status === 200 || r.status === 201,
      'login returns user data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.user && body.user.email;
        } catch {
          return false;
        }
      },
    });

    if (!loginOk) {
      failureRate.add(1);
      return;
    }

    failureRate.add(0);
    const cookies = extractCookies(loginRes);
    accessToken = cookies['access_token'];
  });

  if (!accessToken) return;

  sleep(1);

  group('Authenticated requests', () => {
    const meRes = http.get(`${BASE_URL}/auth/me`, {
      headers: { Cookie: `access_token=${accessToken}` },
    });

    check(meRes, {
      'GET /me returns 200': (r) => r.status === 200,
    });

    failureRate.add(meRes.status !== 200 ? 1 : 0);
  });

  sleep(2);

  group('Token refresh', () => {
    const refreshRes = http.post(`${BASE_URL}/auth/refresh`, null, {
      headers: { Cookie: `access_token=${accessToken}` },
    });

    refreshDuration.add(refreshRes.timings.duration);

    const refreshOk = check(refreshRes, {
      'refresh status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    });

    if (refreshOk) {
      const cookies = extractCookies(refreshRes);
      if (cookies['access_token']) {
        accessToken = cookies['access_token'];
      }
    }

    failureRate.add(!refreshOk ? 1 : 0);
  });

  sleep(1);

  group('Logout', () => {
    const logoutRes = http.post(`${BASE_URL}/auth/logout`, null, {
      headers: { Cookie: `access_token=${accessToken}` },
    });

    check(logoutRes, {
      'logout status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    });

    failureRate.add(logoutRes.status !== 200 && logoutRes.status !== 201 ? 1 : 0);
  });

  sleep(1);
}
