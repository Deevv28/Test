const express = require('express');
const db = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/restaurants - Get all restaurants (public)
router.get('/', async (req, res) => {
    try {
        const restaurants = await db.all(`
            SELECT 
                r.id, r.name, r.cuisine, r.rating, r.image, 
                r.address, r.phone, r.description,
                COUNT(rt.id) as total_tables,
                SUM(CASE WHEN rt.status = 'available' THEN 1 ELSE 0 END) as available_tables
            FROM restaurants r
            LEFT JOIN restaurant_tables rt ON r.id = rt.restaurant_id
            WHERE r.is_active = 1
            GROUP BY r.id
            ORDER BY r.rating DESC
        `);

        res.status(200).json({
            success: true,
            message: 'Restaurants retrieved successfully',
            data: restaurants
        });

    } catch (error) {
        console.error('Get restaurants error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching restaurants'
        });
    }
});

// GET /api/restaurants/:id - Get specific restaurant details
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const restaurant = await db.get(`
            SELECT id, name, cuisine, rating, image, address, phone, description
            FROM restaurants 
            WHERE id = ? AND is_active = 1
        `, [id]);

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        // Get restaurant tables
        const tables = await db.all(`
            SELECT id, table_number, capacity, status, type, features, image, x_position, y_position
            FROM restaurant_tables 
            WHERE restaurant_id = ?
            ORDER BY table_number
        `, [id]);

        restaurant.tables = tables;

        res.status(200).json({
            success: true,
            message: 'Restaurant details retrieved successfully',
            data: restaurant
        });

    } catch (error) {
        console.error('Get restaurant details error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching restaurant details'
        });
    }
});

// GET /api/restaurants/:id/menu - Get restaurant menu
router.get('/:id/menu', async (req, res) => {
    try {
        const { id } = req.params;

        // Verify restaurant exists
        const restaurant = await db.get(
            'SELECT id FROM restaurants WHERE id = ? AND is_active = 1',
            [id]
        );

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        const menuItems = await db.all(`
            SELECT id, name, category, price, description, image, dietary, chef_special, available
            FROM menu_items 
            WHERE restaurant_id = ? AND available = 1
            ORDER BY category, name
        `, [id]);

        res.status(200).json({
            success: true,
            message: 'Menu retrieved successfully',
            data: menuItems
        });

    } catch (error) {
        console.error('Get menu error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching menu'
        });
    }
});

// GET /api/restaurants/:id/tables - Get restaurant tables
router.get('/:id/tables', async (req, res) => {
    try {
        const { id } = req.params;

        // Verify restaurant exists
        const restaurant = await db.get(
            'SELECT id FROM restaurants WHERE id = ? AND is_active = 1',
            [id]
        );

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        const tables = await db.all(`
            SELECT 
                rt.id, rt.table_number, rt.capacity, rt.status, rt.type, 
                rt.features, rt.x_position, rt.y_position,
                COUNT(ti.id) as image_count,
                MIN(CASE WHEN ti.is_primary = 1 THEN ti.image_path END) as primary_image
            FROM restaurant_tables rt
            LEFT JOIN table_images ti ON rt.id = ti.table_id AND ti.is_active = 1
            WHERE rt.restaurant_id = ?
            GROUP BY rt.id
            ORDER BY rt.table_number
        `, [id]);

        // Get all images for each table
        for (const table of tables) {
            const images = await db.all(`
                SELECT id, image_path, description, is_primary, created_at
                FROM table_images 
                WHERE table_id = ? AND is_active = 1
                ORDER BY is_primary DESC, created_at ASC
            `, [table.id]);
            table.images = images;
        }
        res.status(200).json({
            success: true,
            message: 'Tables retrieved successfully',
            data: tables
        });

    } catch (error) {
        console.error('Get tables error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching tables'
        });
    }
});

module.exports = router;