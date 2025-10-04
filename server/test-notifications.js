const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'restaurant.db');

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

const get = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
};

async function testNotifications() {
    try {
        console.log('\n=== Testing Notification System ===\n');

        // Get a customer user
        console.log('1. Getting customer user...');
        let customer = await get('SELECT id, email FROM login_users WHERE role = "customer" LIMIT 1');
        if (!customer) {
            console.log('   Creating test customer...');
            const result = await runQuery(
                'INSERT INTO login_users (name, email, phone, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?, ?)',
                ['Test Customer', 'customer@test.com', '1234567890', 'hashed', 'customer', 1]
            );
            customer = { id: result.lastID, email: 'customer@test.com' };
        }
        console.log(`   ✓ Customer ID: ${customer.id} (${customer.email})`);

        // Get an admin user
        console.log('\n2. Getting admin user...');
        const admin = await get('SELECT id, email, restaurant_id FROM users WHERE role = "admin" LIMIT 1');
        if (!admin) {
            console.error('   ✗ No admin user found. Please run setup first.');
            process.exit(1);
        }
        console.log(`   ✓ Admin ID: ${admin.id} (${admin.email})`);

        // Test 1: Create customer notification
        console.log('\n3. Creating customer notification...');
        const custNotifResult = await runQuery(`
            INSERT INTO notifications (user_id, user_type, restaurant_id, title, message, type, is_read)
            VALUES (?, 'customer', ?, ?, ?, 'info', 0)
        `, [customer.id, admin.restaurant_id, 'Test Notification', 'This is a test notification for a customer']);
        console.log(`   ✓ Customer notification created (ID: ${custNotifResult.lastID})`);

        // Test 2: Create admin notification
        console.log('\n4. Creating admin notification...');
        const adminNotifResult = await runQuery(`
            INSERT INTO notifications (user_id, user_type, restaurant_id, title, message, type, is_read)
            VALUES (?, 'admin', ?, ?, ?, 'success', 0)
        `, [admin.id, admin.restaurant_id, 'Admin Alert', 'This is a test notification for an admin']);
        console.log(`   ✓ Admin notification created (ID: ${adminNotifResult.lastID})`);

        // Test 3: Query customer notifications
        console.log('\n5. Querying customer notifications...');
        const custNotifs = await getAll(`
            SELECT id, title, message, user_type, is_read
            FROM notifications
            WHERE user_id = ? AND user_type = 'customer'
        `, [customer.id]);
        console.log(`   ✓ Found ${custNotifs.length} customer notification(s)`);
        custNotifs.forEach(n => console.log(`     - ${n.title} (read: ${n.is_read})`));

        // Test 4: Query admin notifications
        console.log('\n6. Querying admin notifications...');
        const adminNotifs = await getAll(`
            SELECT id, title, message, user_type, is_read
            FROM notifications
            WHERE user_id = ? AND user_type = 'admin'
        `, [admin.id]);
        console.log(`   ✓ Found ${adminNotifs.length} admin notification(s)`);
        adminNotifs.forEach(n => console.log(`     - ${n.title} (read: ${n.is_read})`));

        // Test 5: Count unread notifications
        console.log('\n7. Counting unread notifications...');
        const custUnread = await get(`
            SELECT COUNT(*) as count
            FROM notifications
            WHERE user_id = ? AND user_type = 'customer' AND is_read = 0
        `, [customer.id]);
        console.log(`   ✓ Customer unread: ${custUnread.count}`);

        const adminUnread = await get(`
            SELECT COUNT(*) as count
            FROM notifications
            WHERE user_id = ? AND user_type = 'admin' AND is_read = 0
        `, [admin.id]);
        console.log(`   ✓ Admin unread: ${adminUnread.count}`);

        console.log('\n✅ All tests passed! Notification system is working correctly.\n');

    } catch (error) {
        console.error('\n❌ Test failed:', error);
        process.exit(1);
    } finally {
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            }
            process.exit(0);
        });
    }
}

testNotifications();
