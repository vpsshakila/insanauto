// services/database.js
const Database = require("better-sqlite3");
const path = require("path");

class DatabaseService {
  constructor() {
    const dbPath = path.join(__dirname, "../data/scheduler.db");
    this.db = new Database(dbPath);
    this.initializeDatabase();
  }

  initializeDatabase() {
    // Tabel untuk scheduled jobs
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS scheduled_jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id TEXT UNIQUE NOT NULL,
        tid TEXT NOT NULL,
        kondisi_camera TEXT NOT NULL,
        kondisi_nvr TEXT NOT NULL,
        nama TEXT NOT NULL,
        perusahaan TEXT NOT NULL,
        no_pegawai TEXT NOT NULL,
        scheduled_time TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        executed_at TEXT,
        error_message TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_status ON scheduled_jobs(status);
      CREATE INDEX IF NOT EXISTS idx_scheduled_time ON scheduled_jobs(scheduled_time);
    `);

    console.log("✅ Database initialized");
  }

  /**
   * Tambah job baru ke database
   */
  addScheduledJob(formData, scheduledTime) {
    const jobId = `job_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const scheduleDate = new Date(scheduledTime);

    // Validasi waktu
    if (scheduleDate <= new Date()) {
      throw new Error("Scheduled time must be in the future");
    }

    const stmt = this.db.prepare(`
      INSERT INTO scheduled_jobs (
        job_id, tid, kondisi_camera, kondisi_nvr, 
        nama, perusahaan, no_pegawai, scheduled_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    try {
      stmt.run(
        jobId,
        formData.tid,
        formData.kondisiCamera,
        formData.kondisiNVR,
        formData.nama,
        formData.perusahaan,
        formData.noPegawai,
        scheduleDate.toISOString()
      );

      console.log(`✅ Job added to database: ${jobId}`);
      console.log(`   ⏰ Scheduled for: ${scheduleDate.toISOString()}`);

      return this.getJobById(jobId);
    } catch (error) {
      console.error("❌ Failed to add job:", error);
      throw error;
    }
  }

  /**
   * Ambil job berdasarkan ID
   */
  getJobById(jobId) {
    const stmt = this.db.prepare(
      "SELECT * FROM scheduled_jobs WHERE job_id = ?"
    );
    return stmt.get(jobId);
  }

  /**
   * Ambil semua pending jobs yang waktunya sudah tiba
   */
  getPendingJobs() {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      SELECT * FROM scheduled_jobs 
      WHERE status = 'pending' 
      AND scheduled_time <= ? 
      ORDER BY scheduled_time ASC
    `);
    return stmt.all(now);
  }

  /**
   * Update status job setelah execution
   */
  updateJobStatus(jobId, status, errorMessage = null) {
    const stmt = this.db.prepare(`
      UPDATE scheduled_jobs 
      SET status = ?, 
          executed_at = CURRENT_TIMESTAMP,
          error_message = ?
      WHERE job_id = ?
    `);

    stmt.run(status, errorMessage, jobId);
    console.log(`   📝 Job ${jobId} status updated: ${status}`);
  }

  /**
   * Ambil semua jobs (untuk list di frontend)
   */
  getAllJobs(limit = 50) {
    const stmt = this.db.prepare(`
      SELECT * FROM scheduled_jobs 
      ORDER BY created_at DESC 
      LIMIT ?
    `);
    return stmt.all(limit);
  }

  /**
   * Hapus job berdasarkan ID
   */
  deleteJob(jobId) {
    const stmt = this.db.prepare("DELETE FROM scheduled_jobs WHERE job_id = ?");
    const result = stmt.run(jobId);
    return result.changes > 0;
  }

  /**
   * Cancel job yang masih pending
   */
  cancelJob(jobId) {
    const stmt = this.db.prepare(`
      UPDATE scheduled_jobs 
      SET status = 'cancelled' 
      WHERE job_id = ? AND status = 'pending'
    `);
    const result = stmt.run(jobId);
    return result.changes > 0;
  }
}

module.exports = new DatabaseService();
