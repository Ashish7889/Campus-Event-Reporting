const request = require('supertest');
const { v4: uuidv4 } = require('uuid');
const app = require('../src/app');
const db = require('../src/db');

describe('Campus Event Reporting System API', () => {
  let collegeId;
  let studentId;
  let eventId;
  let registrationId;
  const adminToken = 'test-admin-token';

  beforeAll(async () => {
    // Set up database schema
    await db.migrate.latest();
    
    // Create test data
    collegeId = 'TEST_COLLEGE';
    studentId = 'TEST_STUDENT';
    eventId = 'TEST_EVENT';
    
    // Insert test college
    await db('colleges').insert({
      id: collegeId,
      name: 'Test University',
      created_at: new Date().toISOString()
    });

    // Insert test student
    await db('students').insert({
      id: studentId,
      college_id: collegeId,
      name: 'Test Student',
      email: 'test@example.com',
      roll_no: 'TEST001',
      created_at: new Date().toISOString()
    });
  });

  afterAll(async () => {
    await db.destroy();
  });

  describe('Health Check', () => {
    test('GET /api/health - should return OK status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
      expect(response.body.message).toContain('Campus Event Reporting System');
    });
  });

  describe('Admin Event Management', () => {
    test('POST /api/admin/events - should create new event with admin token', async () => {
      const eventData = {
        college_id: collegeId,
        title: 'Test Workshop',
        type: 'Workshop',
        description: 'A test workshop event',
        start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
        capacity: 50
      };

      const response = await request(app)
        .post('/api/admin/events')
        .set('x-admin-token', adminToken)
        .send(eventData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.event.title).toBe(eventData.title);
      expect(response.body.event.type).toBe(eventData.type);
      
      eventId = response.body.event.id; // Store for later tests
    });

    test('POST /api/admin/events - should fail without admin token', async () => {
      const eventData = {
        college_id: collegeId,
        title: 'Unauthorized Event',
        type: 'Workshop',
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      };

      await request(app)
        .post('/api/admin/events')
        .send(eventData)
        .expect(401);
    });

    test('GET /api/admin/events - should list events for admin', async () => {
      const response = await request(app)
        .get(`/api/admin/events?college_id=${collegeId}`)
        .set('x-admin-token', adminToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.events).toHaveLength(1);
      expect(response.body.events[0].title).toBe('Test Workshop');
    });

    test('PUT /api/admin/events/:id - should update event', async () => {
      const updateData = {
        title: 'Updated Test Workshop',
        type: 'Workshop',
        description: 'Updated description',
        start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
        capacity: 75
      };

      const response = await request(app)
        .put(`/api/admin/events/${eventId}`)
        .set('x-admin-token', adminToken)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.event.title).toBe('Updated Test Workshop');
      expect(response.body.event.capacity).toBe(75);
    });
  });

  describe('Student Event Registration', () => {
    test('GET /api/events - should list public events', async () => {
      const response = await request(app)
        .get(`/api/events?college_id=${collegeId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.events).toHaveLength(1);
      expect(response.body.events[0].title).toBe('Updated Test Workshop');
    });

    test('POST /api/events/:eventId/register - should register existing student', async () => {
      const response = await request(app)
        .post(`/api/events/${eventId}/register`)
        .send({
          student_id: studentId,
          name: 'Test Student',
          email: 'test@example.com'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Successfully registered');
      
      registrationId = response.body.registration.id;
    });

    test('POST /api/events/:eventId/register - should prevent duplicate registration', async () => {
      await request(app)
        .post(`/api/events/${eventId}/register`)
        .send({
          student_id: studentId,
          name: 'Test Student',
          email: 'test@example.com'
        })
        .expect(409);
    });

    test('POST /api/events/:eventId/register - should create new student and register', async () => {
      const response = await request(app)
        .post(`/api/events/${eventId}/register`)
        .send({
          student_id: 'new',
          name: 'New Test Student',
          email: 'newstudent@example.com',
          roll_no: 'NEW001'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Successfully registered');
    });
  });

  describe('Attendance Management', () => {
    test('POST /api/registrations/:registrationId/checkin - should mark attendance', async () => {
      const response = await request(app)
        .post(`/api/registrations/${registrationId}/checkin`)
        .send({ method: 'manual' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Checked in successfully');
      expect(response.body.attendance.present).toBe(1);
    });

    test('POST /api/registrations/:registrationId/checkin - should handle duplicate checkin', async () => {
      const response = await request(app)
        .post(`/api/registrations/${registrationId}/checkin`)
        .send()
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Already checked in');
    });
  });

  describe('Feedback System', () => {
    test('POST /api/registrations/:registrationId/feedback - should submit feedback', async () => {
      const response = await request(app)
        .post(`/api/registrations/${registrationId}/feedback`)
        .send({
          rating: 5,
          comment: 'Great workshop! Learned a lot.'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.feedback.rating).toBe(5);
      expect(response.body.feedback.comment).toBe('Great workshop! Learned a lot.');
    });

    test('POST /api/registrations/:registrationId/feedback - should prevent duplicate feedback', async () => {
      await request(app)
        .post(`/api/registrations/${registrationId}/feedback`)
        .send({
          rating: 4,
          comment: 'Another feedback'
        })
        .expect(409);
    });

    test('POST /api/registrations/:registrationId/feedback - should validate rating range', async () => {
      const newRegistrationId = uuidv4();
      
      // Create a dummy registration first
      await db('registrations').insert({
        id: newRegistrationId,
        event_id: eventId,
        student_id: studentId,
        registered_at: new Date().toISOString(),
        status: 'registered'
      });

      await request(app)
        .post(`/api/registrations/${newRegistrationId}/feedback`)
        .send({
          rating: 6, // Invalid rating
          comment: 'Invalid rating test'
        })
        .expect(400);
    });
  });

  describe('Reporting Endpoints', () => {
    test('GET /api/reports/popularity - should return event popularity report', async () => {
      const response = await request(app)
        .get(`/api/reports/popularity?college_id=${collegeId}&limit=5`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.events).toHaveLength(1);
      expect(response.body.events[0].registrations_count).toBeGreaterThan(0);
    });

    test('GET /api/reports/attendance - should return attendance report for event', async () => {
      const response = await request(app)
        .get(`/api/reports/attendance?event_id=${eventId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.event.registrations).toBeGreaterThan(0);
      expect(response.body.event.attended).toBeGreaterThan(0);
      expect(parseFloat(response.body.event.attendance_percentage)).toBeGreaterThan(0);
    });

    test('GET /api/reports/feedback - should return feedback report for event', async () => {
      const response = await request(app)
        .get(`/api/reports/feedback?event_id=${eventId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.event.rating_count).toBeGreaterThan(0);
      expect(parseFloat(response.body.event.avg_rating)).toBeGreaterThan(0);
      expect(response.body.event.feedback_details).toHaveLength(1);
    });

    test('GET /api/reports/student/:studentId/participation - should return student participation', async () => {
      const response = await request(app)
        .get(`/api/reports/student/${studentId}/participation`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.student.events_registered).toBeGreaterThan(0);
      expect(response.body.student.events_attended).toBeGreaterThan(0);
      expect(response.body.student.events).toHaveLength(1);
    });

    test('GET /api/reports/top-active - should return top active students', async () => {
      const response = await request(app)
        .get(`/api/reports/top-active?college_id=${collegeId}&limit=3`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.students).toHaveLength(1);
      expect(response.body.students[0].events_attended).toBeGreaterThan(0);
    });

    test('GET /api/reports/registrations-per-event - should return registration counts', async () => {
      const response = await request(app)
        .get(`/api/reports/registrations-per-event?college_id=${collegeId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.events).toHaveLength(1);
      expect(response.body.events[0].registrations).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('GET /api/events/nonexistent - should return 404 for nonexistent event', async () => {
      await request(app)
        .get('/api/events/nonexistent-id')
        .expect(404);
    });

    test('POST /api/admin/events - should validate required fields', async () => {
      const response = await request(app)
        .post('/api/admin/events')
        .set('x-admin-token', adminToken)
        .send({
          title: 'Test Event'
          // Missing required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('College ID is required');
    });

    test('GET /api/nonexistent - should return 404 for invalid API endpoint', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body.error).toContain('API endpoint not found');
    });
  });
});
