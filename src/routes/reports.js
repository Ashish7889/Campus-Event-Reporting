const express = require('express');
const db = require('../db');

const router = express.Router();

// Event Popularity Report (sorted by registrations)
router.get('/popularity', async (req, res) => {
  try {
    const { college_id, type, limit = 10, semester } = req.query;

    let query = db('events')
      .select(
        'events.id',
        'events.title',
        'events.type',
        'events.start_time',
        'events.capacity',
        'colleges.name as college_name'
      )
      .leftJoin('colleges', 'events.college_id', 'colleges.id')
      .leftJoin('registrations', function() {
        this.on('registrations.event_id', '=', 'events.id')
            .andOn('registrations.status', '=', db.raw("'registered'"));
      })
      .groupBy('events.id', 'events.title', 'events.type', 'events.start_time', 'events.capacity', 'colleges.name')
      .orderBy(db.raw('COUNT(registrations.id)'), 'desc');

    // Apply filters
    if (college_id) query = query.where('events.college_id', college_id);
    if (type) query = query.where('events.type', type);
    
    // Add registration count
    query = query.count('registrations.id as registrations_count');

    if (limit) query = query.limit(parseInt(limit));

    const events = await query;

    res.json({
      success: true,
      events: events.map(event => ({
        ...event,
        registrations_count: parseInt(event.registrations_count)
      }))
    });
  } catch (error) {
    console.error('Error fetching popularity report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch popularity report'
    });
  }
});

// Attendance Report - can be for specific event or all events
router.get('/attendance', async (req, res) => {
  try {
    const { event_id, college_id } = req.query;

    // If specific event_id is provided, show that event's report
    if (event_id) {
      return getSingleEventAttendanceReport(req, res);
    }

    // Otherwise, show aggregate attendance report for all events
    let query = db('events')
      .select(
        'events.id',
        'events.title',
        'events.start_time',
        'colleges.name as college_name',
        db.raw('COUNT(registrations.id) as registrations'),
        db.raw('COUNT(attendance.id) as attended'),
        db.raw('CASE WHEN COUNT(registrations.id) = 0 THEN 0 ELSE (CAST(COUNT(attendance.id) AS FLOAT) / COUNT(registrations.id)) * 100 END as attendance_percentage')
      )
      .leftJoin('colleges', 'events.college_id', 'colleges.id')
      .leftJoin('registrations', function() {
        this.on('registrations.event_id', '=', 'events.id')
            .andOn('registrations.status', '=', db.raw("'registered'"));
      })
      .leftJoin('attendance', 'attendance.registration_id', 'registrations.id')
      .groupBy('events.id', 'events.title', 'events.start_time', 'colleges.name')
      .orderBy('events.start_time', 'desc');

    if (college_id) query = query.where('events.college_id', college_id);

    const events = await query;

    res.json({
      success: true,
      events: events.map(event => ({
        id: event.id,
        title: event.title,
        college_name: event.college_name,
        start_time: event.start_time,
        registrations: parseInt(event.registrations),
        attended: parseInt(event.attended),
        attendance_percentage: parseFloat(event.attendance_percentage).toFixed(2)
      }))
    });
  } catch (error) {
    console.error('Error fetching attendance report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch attendance report'
    });
  }
});

// Helper function for single event attendance report
async function getSingleEventAttendanceReport(req, res) {
  try {
    const { event_id } = req.query;
    
    const result = await db('events')
      .select(
        'events.id',
        'events.title',
        db.raw('COUNT(registrations.id) as registrations'),
        db.raw('COUNT(attendance.id) as attended'),
        db.raw('CASE WHEN COUNT(registrations.id) = 0 THEN 0 ELSE (CAST(COUNT(attendance.id) AS FLOAT) / COUNT(registrations.id)) * 100 END as attendance_percentage')
      )
      .leftJoin('registrations', function() {
        this.on('registrations.event_id', '=', 'events.id')
            .andOn('registrations.status', '=', db.raw("'registered'"));
      })
      .leftJoin('attendance', 'attendance.registration_id', 'registrations.id')
      .where('events.id', event_id)
      .groupBy('events.id', 'events.title')
      .first();

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    res.json({
      success: true,
      event: {
        id: result.id,
        title: result.title,
        registrations: parseInt(result.registrations),
        attended: parseInt(result.attended),
        attendance_percentage: parseFloat(result.attendance_percentage).toFixed(2)
      }
    });
  } catch (error) {
    throw error;
  }
}

// Feedback Report - can be for specific event or all events
router.get('/feedback', async (req, res) => {
  try {
    const { event_id, college_id } = req.query;

    // If specific event_id is provided, show that event's feedback
    if (event_id) {
      return getSingleEventFeedbackReport(req, res);
    }

    // Otherwise, show aggregate feedback report for all events
    let query = db('events')
      .select(
        'events.id',
        'events.title',
        'events.start_time',
        'colleges.name as college_name',
        db.raw('AVG(feedback.rating) as avg_rating'),
        db.raw('COUNT(feedback.id) as rating_count')
      )
      .leftJoin('colleges', 'events.college_id', 'colleges.id')
      .leftJoin('registrations', 'registrations.event_id', 'events.id')
      .leftJoin('feedback', 'feedback.registration_id', 'registrations.id')
      .groupBy('events.id', 'events.title', 'events.start_time', 'colleges.name')
      .orderBy('events.start_time', 'desc');

    if (college_id) query = query.where('events.college_id', college_id);

    const events = await query;

    res.json({
      success: true,
      events: events.map(event => ({
        id: event.id,
        title: event.title,
        college_name: event.college_name,
        start_time: event.start_time,
        avg_rating: event.avg_rating ? parseFloat(event.avg_rating).toFixed(2) : null,
        rating_count: parseInt(event.rating_count)
      }))
    });
  } catch (error) {
    console.error('Error fetching feedback report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feedback report'
    });
  }
});

// Helper function for single event feedback report
async function getSingleEventFeedbackReport(req, res) {
  try {
    const { event_id } = req.query;
    
    const result = await db('events')
      .select(
        'events.id',
        'events.title',
        db.raw('AVG(feedback.rating) as avg_rating'),
        db.raw('COUNT(feedback.id) as rating_count')
      )
      .leftJoin('registrations', 'registrations.event_id', 'events.id')
      .leftJoin('feedback', 'feedback.registration_id', 'registrations.id')
      .where('events.id', event_id)
      .groupBy('events.id', 'events.title')
      .first();

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Get feedback details
    const feedbackDetails = await db('feedback')
      .select('feedback.rating', 'feedback.comment', 'feedback.submitted_at', 'students.name')
      .join('registrations', 'feedback.registration_id', 'registrations.id')
      .join('students', 'registrations.student_id', 'students.id')
      .where('registrations.event_id', event_id)
      .orderBy('feedback.submitted_at', 'desc');

    res.json({
      success: true,
      event: {
        id: result.id,
        title: result.title,
        avg_rating: result.avg_rating ? parseFloat(result.avg_rating).toFixed(2) : null,
        rating_count: parseInt(result.rating_count),
        feedback_details: feedbackDetails
      }
    });
  } catch (error) {
    throw error;
  }
}

// Student Participation Report
router.get('/student/:studentId/participation', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { college_id } = req.query;

    let studentQuery = db('students').where('id', studentId);
    if (college_id) studentQuery = studentQuery.where('college_id', college_id);

    const student = await studentQuery.first();
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    // Get participation statistics
    const participationStats = await db('students')
      .select(
        'students.id',
        'students.name',
        'students.email',
        db.raw('COUNT(DISTINCT registrations.event_id) as events_registered'),
        db.raw('COUNT(attendance.id) as events_attended')
      )
      .leftJoin('registrations', 'registrations.student_id', 'students.id')
      .leftJoin('attendance', 'attendance.registration_id', 'registrations.id')
      .where('students.id', studentId)
      .groupBy('students.id', 'students.name', 'students.email')
      .first();

    // Get list of events
    const events = await db('events')
      .select(
        'events.id',
        'events.title',
        'events.type',
        'events.start_time',
        'registrations.registered_at',
        'registrations.status as registration_status',
        db.raw('CASE WHEN attendance.id IS NOT NULL THEN 1 ELSE 0 END as attended')
      )
      .join('registrations', 'registrations.event_id', 'events.id')
      .leftJoin('attendance', 'attendance.registration_id', 'registrations.id')
      .where('registrations.student_id', studentId)
      .orderBy('events.start_time', 'desc');

    res.json({
      success: true,
      student: {
        ...participationStats,
        events_registered: parseInt(participationStats.events_registered),
        events_attended: parseInt(participationStats.events_attended),
        events: events.map(event => ({
          ...event,
          attended: Boolean(event.attended)
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching student participation report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch student participation report'
    });
  }
});

// Top Active Students
router.get('/top-active', async (req, res) => {
  try {
    const { college_id, limit = 3 } = req.query;

    let query = db('students')
      .select(
        'students.id',
        'students.name',
        'students.email',
        'students.roll_no',
        'colleges.name as college_name',
        db.raw('COUNT(attendance.id) as events_attended')
      )
      .join('registrations', 'registrations.student_id', 'students.id')
      .join('attendance', 'attendance.registration_id', 'registrations.id')
      .join('colleges', 'students.college_id', 'colleges.id')
      .groupBy('students.id', 'students.name', 'students.email', 'students.roll_no', 'colleges.name')
      .orderBy('events_attended', 'desc');

    if (college_id) query = query.where('students.college_id', college_id);
    if (limit) query = query.limit(parseInt(limit));

    const students = await query;

    res.json({
      success: true,
      students: students.map(student => ({
        ...student,
        events_attended: parseInt(student.events_attended)
      }))
    });
  } catch (error) {
    console.error('Error fetching top active students:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top active students'
    });
  }
});

// Total registrations per event
router.get('/registrations-per-event', async (req, res) => {
  try {
    const { college_id, status = 'scheduled' } = req.query;

    let query = db('events')
      .select(
        'events.id',
        'events.title',
        'events.type',
        'events.start_time',
        'colleges.name as college_name',
        db.raw('COUNT(registrations.id) as registrations')
      )
      .leftJoin('colleges', 'events.college_id', 'colleges.id')
      .leftJoin('registrations', function() {
        this.on('registrations.event_id', '=', 'events.id')
            .andOn('registrations.status', '=', db.raw("'registered'"));
      })
      .groupBy('events.id', 'events.title', 'events.type', 'events.start_time', 'colleges.name')
      .orderBy('registrations', 'desc');

    if (college_id) query = query.where('events.college_id', college_id);
    if (status) query = query.where('events.status', status);

    const events = await query;

    res.json({
      success: true,
      events: events.map(event => ({
        ...event,
        registrations: parseInt(event.registrations)
      }))
    });
  } catch (error) {
    console.error('Error fetching registrations per event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch registrations per event'
    });
  }
});

// Filter report (bonus)
router.get('/filter', async (req, res) => {
  try {
    const { type, date_from, date_to, college_id, page = 1, limit = 20 } = req.query;

    let query = db('events')
      .select(
        'events.*',
        'colleges.name as college_name',
        db.raw('COUNT(registrations.id) as registrations_count'),
        db.raw('COUNT(attendance.id) as attendance_count')
      )
      .leftJoin('colleges', 'events.college_id', 'colleges.id')
      .leftJoin('registrations', function() {
        this.on('registrations.event_id', '=', 'events.id')
            .andOn('registrations.status', '=', db.raw("'registered'"));
      })
      .leftJoin('attendance', 'attendance.registration_id', 'registrations.id')
      .groupBy('events.id', 'events.title', 'events.type', 'events.start_time', 'events.end_time', 'events.capacity', 'events.status', 'events.created_at', 'events.college_id', 'events.description', 'colleges.name')
      .orderBy('events.start_time', 'desc');

    // Apply filters
    if (college_id) query = query.where('events.college_id', college_id);
    if (type) query = query.where('events.type', type);
    if (date_from) query = query.where('events.start_time', '>=', new Date(date_from).toISOString());
    if (date_to) query = query.where('events.start_time', '<=', new Date(date_to).toISOString());

    // Pagination
    const offset = (page - 1) * limit;
    query = query.offset(offset).limit(parseInt(limit));

    const events = await query;

    res.json({
      success: true,
      events: events.map(event => ({
        ...event,
        registrations_count: parseInt(event.registrations_count),
        attendance_count: parseInt(event.attendance_count),
        attendance_percentage: event.registrations_count > 0 ? 
          ((event.attendance_count / event.registrations_count) * 100).toFixed(2) : 
          '0.00'
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching filtered report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch filtered report'
    });
  }
});

module.exports = router;
