read -rsp "新しい管理者パスワード: " NEW_PASSWORD
echo

printf '%s' "$NEW_PASSWORD" | docker compose exec -T api node --input-type=module -e '
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

let input = "";

process.stdin.on("data", chunk => {
  input += chunk;
});

process.stdin.on("end", async () => {
  const password = input;

  if (password.length < 12) {
    console.error("パスワードは12文字以上にしてください");
    process.exitCode = 1;
    return;
  }

  const hash = await bcrypt.hash(password, 12);

  const pool = await mysql.createPool({
    host: process.env.DB_HOST || "db",
    port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_NAME || "track_app",
    user: process.env.DB_USER || "track_user",
    password: process.env.DB_PASSWORD
  });

  const username = process.env.ADMIN_USERNAME || "official";

  const [result] = await pool.query(
    "UPDATE admin_users SET password_hash = ? WHERE username = ?",
    [hash, username]
  );

  if (result.affectedRows === 0) {
    await pool.query(
      "INSERT INTO admin_users (username, display_name, password_hash) VALUES (?, ?, ?)",
      [username, username, hash]
    );
    console.log("admin user created");
  } else {
    console.log("admin password reset successfully");
  }

  await pool.end();
});
'

unset NEW_PASSWORD

