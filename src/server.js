const app = require('./app');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Campus Event Reporting System API is running on port ${PORT}`);
  console.log(`📱 Frontend available at: http://localhost:4000`);
  console.log(`🔗 API Health Check: http://localhost:4000/api/health`);
  console.log(`📊 Admin Panel: http://localhost:4000/admin`);
});
