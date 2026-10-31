sudo docker compose exec api node --input-type=module -e '
import mysql from "mysql2/promise";

const pool = await mysql.createPool({
  host: process.env.DB_HOST || "db",
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME || "track_app",
  user: process.env.DB_USER || "track_user",
  password: process.env.DB_PASSWORD
});

const [rows] = await pool.query(
  "SELECT id, username, display_name FROM admin_users ORDER BY id"
);

console.table(rows);
await pool.end();
'

