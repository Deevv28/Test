const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'restaurant.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
    console.log('Connected to SQLite database');
});

const runQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this);
            }
        });
    });
};

const getAll = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

async function fixNotificationsSchema() {
    try {
        console.log('Starting notifications schema fix...');

        console.log('Step 1: Creating new notifications table with flexible user reference...');

        await runQuery(`
            CREATE TABLE IF NOT EXISTS notifications_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                user_type TEXT NOT NULL DEFAULT 'customer',
                restaurant_id INTEGER,
                booking_id INTEGER,
                order_id INTEGER,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                type TEXT DEFAULT 'info',
                is_read BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (restaurant_id) REFERENCES restaurants (id),
                FOREIGN KEY (booking_id) REFERENCES bookings (id),
                FOREIGN KEY (order_id) REFERENCES orders (id)
            )
        `);

        console.log('Step 2: Copying existing notifications data...');

        const existingNotifications = await getAll('SELECT * FROM notifications');
        console.log(`Found ${existingNotifications.length} existing notifications to migrate`);

        for (const notif of existingNotifications) {
            await runQuery(`
                INSERT INTO notifications_new (id, user_id, user_type, restaurant_id, booking_id, order_id, title, message, type, is_read, created_at)
                VALUES (?, ?, 'customer', ?, ?, ?, ?, ?, ?, ?, ?)
            `, [notif.id, notif.user_id, notif.restaurant_id, notif.booking_id, notif.order_id, notif.title, notif.message, notif.type, notif.is_read, notif.created_at]);
        }

        console.log('Step 3: Dropping old notifications table...');
        await runQuery('DROP TABLE notifications');

        console.log('Step 4: Renaming new table to notifications...');
        await runQuery('ALTER TABLE notifications_new RENAME TO notifications');

        console.log('Step 5: Creating indexes for performance...');
        await runQuery('CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, user_type)');
        await runQuery('CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read)');
        await runQuery('CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at)');

        console.log('✅ Notifications schema fixed successfully!');
        console.log('✅ Notifications now support customers, admins, and super admins!');

    } catch (error) {
        console.error('Error fixing notifications schema:', error);
        process.exit(1);
    } finally {
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            } else {
                console.log('Database connection closed.');
            }
            process.exit(0);
        });
    }
}

fixNotificationsSchema();
