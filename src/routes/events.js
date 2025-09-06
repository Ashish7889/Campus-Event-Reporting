const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { validateRegistration, validateFeedback } = require('../controllers/validators');

const router = express.Router();

// Get events (public endpoint with filtering)
router.get('/events', async (req, res) => {
  try {
    const { 
      college_id, 
      type, 
      from, 
      to, 
      q, 
      status = 'scheduled',
      page = 1, 
      limit = 20 
    } = req.query;
    
    let query = db('events')
      .select('events.*', 'colleges.name as college_name')
      .leftJoin('colleges', 'events.college_id', 'colleges.id')
      .where('events.status', status)
      .orderBy('events.start_time', 'asc');

    // Apply filters
    if (college_id) query = query.where('events.college_id', college_id);
    if (type) query = query.where('events.type', type);
    if (from) query = query.where('events.start_time', '>=', new Date(from).toISOString().slice(0, 19).replace('T', ' '));
    if (to) query = query.where('events.start_time', '<=', new Date(to).toISOString().slice(0, 19).replace('T', ' '));
    if (q) {
      query = query.where(function() {
        this.where('events.title', 'like', `%${q}%`)
            .orWhere('events.description', 'like', `%${q}%`);
      });
    }

    const offset = (page - 1) * limit;
    query = query.offset(offset).limit(limit);

    const events = await query;
    
    // Add registration count and availability for each event
    for (const event of events) {
      const registrationCount = await db('registrations')
        .where('event_id', event.id)
        .where('status', 'registered')
        .count('* as count')
        .first();
      
      event.registrations_count = registrationCount.count;
      event.available_spots = event.capacity > 0 ? 
        Math.max(0, event.capacity - registrationCount.count) : 
        null;
      event.is_full = event.capacity > 0 && registrationCount.count >= event.capacity;
    }

    res.json({
      success: true,
      events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch events'
    });
  }
});

// Get single event details
router.get('/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const event = await db('events')
      .select('events.*', 'colleges.name as college_name')
      .leftJoin('colleges', 'events.college_id', 'colleges.id')
      .where('events.id', id)
      .first();

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Get registration statistics
    const registrationCount = await db('registrations')
      .where('event_id', id)
      .where('status', 'registered')
      .count('* as count')
      .first();
    
    const attendanceCount = await db('attendance')
      .join('registrations', 'attendance.registration_id', 'registrations.id')
      .where('registrations.event_id', id)
      .where('attendance.present', 1)
      .count('* as count')
      .first();

    event.registrations_count = registrationCount.count;
    event.attendance_count = attendanceCount.count;
    event.available_spots = event.capacity > 0 ? 
      Math.max(0, event.capacity - registrationCount.count) : 
      null;
    event.is_full = event.capacity > 0 && registrationCount.count >= event.capacity;

    res.json({
      success: true,
      event
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch event'
    });
  }
});

// Register for an event
router.post('/events/:eventId/register', validateRegistration, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { student_id, roll_no, name, email, phone } = req.body;
    
    // Check if event exists and is open for registration
    const event = await db('events').where('id', eventId).first();
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    if (event.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Event has been cancelled'
      });
    }

    if (new Date(event.start_time) <= new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Registration closed - event has started'
      });
    }

    // Check if event is full
    if (event.capacity > 0) {
      const currentRegistrations = await db('registrations')
        .where('event_id', eventId)
        .where('status', 'registered')
        .count('* as count')
        .first();

      if (currentRegistrations.count >= event.capacity) {
        return res.status(409).json({
          success: false,
          error: 'Event is full'
        });
      }
    }

    let studentId = student_id;

    // If student doesn't exist, create them
    if (!student_id || student_id === 'new') {
      if (!name || !email) {
        return res.status(400).json({
          success: false,
          error: 'Name and email are required for new students'
        });
      }

      studentId = uuidv4();
      const student = {
        id: studentId,
        college_id: event.college_id,
        roll_no,
        name,
        email,
        phone,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
      };

      try {
        await db('students').insert(student);
      } catch (dbError) {
        if (dbError.message.includes('UNIQUE constraint failed')) {
          return res.status(409).json({
            success: false,
            error: 'Email already exists'
          });
        }
        throw dbError;
      }
    }

    // Check for duplicate registration
    const existingRegistration = await db('registrations')
      .where('event_id', eventId)
      .where('student_id', studentId)
      .first();

    if (existingRegistration) {
      return res.status(409).json({
        success: false,
        error: 'Already registered for this event',
        registration: existingRegistration
      });
    }

    // Create registration
    const registrationId = uuidv4();
    const registration = {
      id: registrationId,
      event_id: eventId,
      student_id: studentId,
      registered_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      status: 'registered'
    };

    await db('registrations').insert(registration);

    res.status(201).json({
      success: true,
      message: 'Successfully registered for event',
      registration: {
        ...registration,
        event_title: event.title
      }
    });
  } catch (error) {
    console.error('Error registering for event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register for event'
    });
  }
});

// Mark attendance (check-in)
router.post('/registrations/:registrationId/checkin', async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { method = 'manual' } = req.body;
    
    const registration = await db('registrations')
      .where('id', registrationId)
      .first();

    if (!registration) {
      return res.status(404).json({
        success: false,
        error: 'Registration not found'
      });
    }

    // Check if already checked in
    const existingAttendance = await db('attendance')
      .where('registration_id', registrationId)
      .first();

    if (existingAttendance) {
      return res.json({
        success: true,
        message: 'Already checked in',
        attendance: existingAttendance
      });
    }

    // Create attendance record
    const attendanceId = uuidv4();
    const attendance = {
      id: attendanceId,
      registration_id: registrationId,
      checked_in_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      present: 1
    };

    await db('attendance').insert(attendance);

    res.status(201).json({
      success: true,
      message: 'Checked in successfully',
      attendance
    });
  } catch (error) {
    console.error('Error checking in:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check in'
    });
  }
});

// Submit feedback
router.post('/registrations/:registrationId/feedback', validateFeedback, async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { rating, comment } = req.body;
    
    const registration = await db('registrations')
      .where('id', registrationId)
      .first();

    if (!registration) {
      return res.status(404).json({
        success: false,
        error: 'Registration not found'
      });
    }

    // Check if feedback already exists
    const existingFeedback = await db('feedback')
      .where('registration_id', registrationId)
      .first();

    if (existingFeedback) {
      return res.status(409).json({
        success: false,
        error: 'Feedback already submitted',
        feedback: existingFeedback
      });
    }

    // Create feedback record
    const feedbackId = uuidv4();
    const feedback = {
      id: feedbackId,
      registration_id: registrationId,
      rating,
      comment: comment || null,
      submitted_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };

    await db('feedback').insert(feedback);

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit feedback'
    });
  }
});

// Get colleges list
router.get('/colleges', async (req, res) => {
  try {
    const colleges = await db('colleges')
      .select('*')
      .orderBy('name');

    res.json({
      success: true,
      colleges
    });
  } catch (error) {
    console.error('Error fetching colleges:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch colleges'
    });
  }
});

// Search registrations by email
router.get('/registrations/search', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email parameter is required'
      });
    }
    
    const registrations = await db('registrations')
      .select(
        'registrations.id',
        'registrations.registered_at', 
        'events.title as event_title',
        'events.start_time as event_date',
        'events.id as event_id'
      )
      .join('students', 'registrations.student_id', 'students.id')
      .join('events', 'registrations.event_id', 'events.id')
      .where('students.email', email)
      .where('registrations.status', 'registered')
      .orderBy('events.start_time', 'desc');
    
    res.json({
      success: true,
      registrations
    });
  } catch (error) {
    console.error('Error searching registrations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search registrations'
    });
  }
});

// Get registration details
router.get('/registrations/:id/details', async (req, res) => {
  try {
    const { id } = req.params;
    
    const registration = await db('registrations')
      .select('registrations.*', 'students.name', 'students.email')
      .join('students', 'registrations.student_id', 'students.id')
      .where('registrations.id', id)
      .first();
      
    if (!registration) {
      return res.status(404).json({
        success: false,
        error: 'Registration not found'
      });
    }
    
    const event = await db('events')
      .select('events.*', 'colleges.name as college_name')
      .join('colleges', 'events.college_id', 'colleges.id')
      .where('events.id', registration.event_id)
      .first();
      
    res.json({
      success: true,
      registration,
      event
    });
  } catch (error) {
    console.error('Error fetching registration details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch registration details'
    });
  }
});

// Check if feedback already exists for a registration
router.get('/registrations/:id/feedback-status', async (req, res) => {
  try {
    const { id } = req.params;
    
    const feedback = await db('feedback')
      .where('registration_id', id)
      .first();
      
    res.json({
      success: true,
      has_feedback: !!feedback,
      feedback: feedback || null
    });
  } catch (error) {
    console.error('Error checking feedback status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check feedback status'
    });
  }
});

module.exports = router;
