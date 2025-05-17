import http from 'k6/http';
import { check, sleep } from 'k6';

// List of your CAPS users
const users = [
  { id: '23-A-12345', password: '12345678' },
  { id: '23-A-12346', password: '12345678' },
  { id: '23-A-11111', password: '12345678' },
  { id: '23-A-22222', password: '12345678' },
  { id: '23-A-33333', password: '12345678' },
  { id: '23-A-55555', password: '12345678' },
  { id: '23-A-12347', password: '12345678' },
  { id: '23-A-11112', password: '12345678' },
  { id: '23-A-22223', password: '12345678' },
  { id: '23-A-33334', password: '12345678' },
  { id: '23-A-55556', password: '12345678' },
];

// Test configuration
export let options = {
  vus: 10,          // Virtual users
  duration: '30s',   // Duration of the test
  thresholds: {
    'http_req_duration': ['p(95)<2000'], // Set threshold
  },
};

// Each virtual user will run this function
export default function () {
  // Randomly pick a user for this iteration
  const user = users[Math.floor(Math.random() * users.length)];

  const url = 'https://caps-test2-api.coeofjrmsu.com/api/login';
  const payload = JSON.stringify({
    id_number: user.id,
    password: user.password,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Send the POST request
  const res = http.post(url, payload, params);

  // Check the response
  const isStatus200 = res.status === 200;
  const hasToken = res.json('token') !== undefined;

  // Perform checks
  check(res, {
    'is status 200': isStatus200,
    'has token': hasToken,
  });

  // Log detailed error if the check fails
  if (!isStatus200) {
    console.error(`Error for user ${user.id}: Status ${res.status}`);
    console.error(`Response body: ${res.body}`);
  }

  if (!hasToken) {
    console.error(`Error for user ${user.id}: Missing token in response`);
    console.error(`Response body: ${res.body}`);
  }

  sleep(1); // Simulate user wait time
}
