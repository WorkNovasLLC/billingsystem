const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, 'billing.db'));

try {
    const loginId = 'administrator';
    const rawPassword = 'password';
    const hashedPassword = bcrypt.hashSync(rawPassword, 10);

    // Check if exists
    const existing = db.prepare('SELECT * FROM admins WHERE login_id = ?').get(loginId);
    if (existing) {
        db.prepare('UPDATE admins SET password = ? WHERE login_id = ?').run(hashedPassword, loginId);
        console.log(`Updated user: ${loginId}`);
    } else {
        db.prepare('INSERT INTO admins (login_id, password) VALUES (?, ?)').run(loginId, hashedPassword);
        console.log(`Created user: ${loginId}`);
    }
} catch (err) {
    console.error('Error creating mock user:', err.message);
} finally {
    db.close();
}
