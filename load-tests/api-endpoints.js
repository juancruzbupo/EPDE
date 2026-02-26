import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001/api/v1';

const failureRate = new Rate('failures');
const dashboardDuration = new Trend('dashboard_duration');
const propertiesDuration = new Trend('properties_duration');
const notificationsDuration = new Trend('notifications_duration');

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
    dashboard_duration: ['p(95)<500'],
    properties_duration: ['p(95)<500'],
    notifications_duration: ['p(95)<300'],
  },
};

function login(vu) {
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({
      email: `loadtest+${vu}@epde.com.ar`,
      password: 'LoadTest123!',
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  if (res.status !== 200 && res.status !== 201) return null;

  const setCookie = res.headers['Set-Cookie'];
  if (!setCookie) return null;
  const headers = Array.isArray(setCookie) ? setCookie : [setCookie];
  for (const header of headers) {
    const [nameValue] = header.split(';');
    const [name, value] = nameValue.split('=');
    if (name.trim() === 'access_token') return value.trim();
  }
  return null;
}

export function setup() {
  // Verify API is reachable
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'API is healthy': (r) => r.status === 200,
  });
}

export default function () {
  const accessToken = login(__VU);
  if (!accessToken) {
    failureRate.add(1);
    return;
  }

  const headers = { Cookie: `access_token=${accessToken}` };

  group('Dashboard', () => {
    const statsRes = http.get(`${BASE_URL}/dashboard/client-stats`, { headers });
    dashboardDuration.add(statsRes.timings.duration);

    check(statsRes, {
      'dashboard stats returns 200': (r) => r.status === 200,
    });
    failureRate.add(statsRes.status !== 200 ? 1 : 0);

    const upcomingRes = http.get(`${BASE_URL}/dashboard/client-upcoming`, { headers });
    check(upcomingRes, {
      'upcoming tasks returns 200': (r) => r.status === 200,
    });
    failureRate.add(upcomingRes.status !== 200 ? 1 : 0);
  });

  sleep(1);

  group('Properties', () => {
    const listRes = http.get(`${BASE_URL}/properties`, { headers });
    propertiesDuration.add(listRes.timings.duration);

    const listOk = check(listRes, {
      'properties list returns 200': (r) => r.status === 200,
    });
    failureRate.add(!listOk ? 1 : 0);

    // If properties exist, fetch the first one
    if (listOk) {
      try {
        const body = JSON.parse(listRes.body);
        const items = body.data || body.items || body;
        if (Array.isArray(items) && items.length > 0) {
          const detailRes = http.get(`${BASE_URL}/properties/${items[0].id}`, { headers });
          check(detailRes, {
            'property detail returns 200': (r) => r.status === 200,
          });
          failureRate.add(detailRes.status !== 200 ? 1 : 0);
        }
      } catch {
        // skip detail check
      }
    }
  });

  sleep(1);

  group('Notifications', () => {
    const notifRes = http.get(`${BASE_URL}/notifications`, { headers });
    notificationsDuration.add(notifRes.timings.duration);

    check(notifRes, {
      'notifications returns 200': (r) => r.status === 200,
    });
    failureRate.add(notifRes.status !== 200 ? 1 : 0);

    const countRes = http.get(`${BASE_URL}/notifications/unread-count`, { headers });
    check(countRes, {
      'unread count returns 200': (r) => r.status === 200,
    });
    failureRate.add(countRes.status !== 200 ? 1 : 0);
  });

  sleep(1);

  group('Service Requests', () => {
    const srRes = http.get(`${BASE_URL}/service-requests`, { headers });
    check(srRes, {
      'service requests returns 200': (r) => r.status === 200,
    });
    failureRate.add(srRes.status !== 200 ? 1 : 0);
  });

  sleep(1);

  group('Budgets', () => {
    const budgetsRes = http.get(`${BASE_URL}/budgets`, { headers });
    check(budgetsRes, {
      'budgets list returns 200': (r) => r.status === 200,
    });
    failureRate.add(budgetsRes.status !== 200 ? 1 : 0);
  });

  sleep(1);

  group('Categories', () => {
    const catRes = http.get(`${BASE_URL}/categories`, { headers });
    check(catRes, {
      'categories returns 200': (r) => r.status === 200,
    });
    failureRate.add(catRes.status !== 200 ? 1 : 0);
  });

  sleep(0.5);
}
