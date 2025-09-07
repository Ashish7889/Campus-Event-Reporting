# 🎓 Campus Event Reporting System

A modern, comprehensive web application for managing campus events, registrations, and feedback. Built with a clean, professional design using contemporary UI principles.

## 🎨 Design Features

### Modern Color Palette
- **Cream (#F7F1E3)**: Primary background
- **Burgundy (#8B1E3F)**: Buttons, highlights, and accents
- **Cool Gray (#555555)**: Text and headings
- **Light Taupe (#C4A484)**: Secondary elements and borders
- **Soft White (#FFFFFF)**: Cards, forms, and overlays

### UI/UX Highlights
- **Clean, professional design** without distracting effects
- **High contrast ratios** for excellent readability
- **Responsive layout** that works on all devices
- **Large, prominent buttons** and form elements
- **Professional table styling** for data display
- **Smooth animations** and micro-interactions

## ✨ Features

### 👥 For Students
- **Browse Events**: View upcoming campus events with detailed information
- **Easy Registration**: Simple registration process with instant confirmation
- **Submit Feedback**: Rate and review attended events
- **Event Discovery**: Filter events by type and college
- **Mobile-Friendly**: Optimized for smartphones and tablets

### 👨‍🏫 For Administrators
- **Event Management**: Create, edit, and manage campus events
- **Attendance Tracking**: Mark and track student attendance
- **Comprehensive Reports**: Generate detailed analytics and reports
- **Student Management**: View registrations and participant data
- **Professional Dashboard**: Clean, dark-themed admin interface

### 📊 Reports & Analytics
- **Event Popularity Reports**: Track which events are most popular
- **Attendance Analytics**: Monitor attendance rates and patterns  
- **Feedback Analysis**: Analyze student satisfaction and feedback
- **College-wise Statistics**: Compare performance across institutions
- **Export Capabilities**: Generate reports for further analysis

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v14 or higher)
- **npm** (comes with Node.js)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ashish7889/Campus-Event-Reporting.git
   cd Campus-Event-Reporting
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   - Copy `.env.example` to `.env`
   - Update database settings if needed
   - Default admin token: `admin123456`

4. **Initialize database**
   ```bash
   npm run migrate
   ```

5. **Start the application**
   ```bash
   npm start
   ```

6. **Open in browser**
   ```
   http://localhost:4000
   ```

## 📱 Usage Guide

### Student Access
1. **View Events**: Click "EVENTS" to browse available events
2. **Register**: Click "REGISTER" and fill in your details
3. **Submit Feedback**: Use "FEEDBACK" to rate attended events
4. **View Reports**: Check "REPORTS" for event statistics

### Administrator Access
1. **Login**: Click "ADMIN" and enter the admin token
2. **Create Events**: Use "Create Event" tab to add new events
3. **Manage Events**: Edit or delete existing events
4. **Mark Attendance**: Track who attended each event
5. **Generate Reports**: Create detailed analytics reports

## 🛠️ Technology Stack

### Backend
- **Node.js**: Server runtime
- **Express.js**: Web framework
- **SQLite**: Database (portable and lightweight)
- **Knex.js**: Query builder and migrations

### Frontend
- **HTML5**: Modern semantic markup
- **CSS3**: Advanced styling with custom properties
- **Vanilla JavaScript**: Clean, dependency-free interactions
- **Responsive Design**: Mobile-first approach

### Database Schema
- **Events**: Event details and metadata
- **Registrations**: Student event registrations
- **Feedback**: Event ratings and comments
- **Colleges**: Institution management
- **Attendance**: Attendance tracking

## 📊 API Endpoints

### Public Endpoints
- `GET /api/events` - List all events
- `POST /api/register` - Register for event
- `POST /api/feedback` - Submit feedback
- `GET /api/reports/:type` - Generate reports

### Admin Endpoints (Token Required)
- `POST /api/admin/events` - Create event
- `PUT /api/admin/events/:id` - Update event
- `DELETE /api/admin/events/:id` - Delete event
- `POST /api/admin/attendance` - Mark attendance

## 🎨 Customization

### Styling
The design system uses CSS custom properties for easy customization:

```css
:root {
    --cream: #F7F1E3;
    --burgundy: #8B1E3F;
    --cool-gray: #555555;
    --light-taupe: #C4A484;
    --soft-white: #FFFFFF;
}
```

### Configuration
Key settings in `server.js`:
- Port configuration
- Database connection
- Admin token
- CORS settings

## 📱 Responsive Design

- **Desktop**: Full-featured layout with large elements
- **Tablet**: Optimized spacing and touch-friendly buttons  
- **Mobile**: Stacked layout with simplified navigation
- **Touch-Friendly**: Large tap targets and smooth scrolling

## 🔒 Security Features

- **Admin Authentication**: Token-based admin access
- **Input Validation**: Server-side data validation
- **SQL Injection Protection**: Parameterized queries
- **XSS Prevention**: Sanitized user inputs
- **CORS Configuration**: Controlled cross-origin requests

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production Deployment
1. **Build optimized version**
   ```bash
   npm run build
   ```

2. **Set production environment**
   ```bash
   export NODE_ENV=production
   ```

3. **Start production server**
   ```bash
   npm start
   ```

### Hosting Options
- **Heroku**: Easy deployment with Git integration
- **Vercel**: Optimized for Node.js applications
- **DigitalOcean**: Full control with VPS hosting
- **Railway**: Modern deployment platform

## 📝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Inter Font Family**: Used for modern typography
- **Modern CSS Techniques**: Utilizing latest CSS features
- **Responsive Design Principles**: Mobile-first approach
- **Accessibility Guidelines**: WCAG 2.1 compliance

## 📞 Support

For support, email: [your-email@example.com](mailto:your-email@example.com)

---

**Made with ❤️ for campus communities**
