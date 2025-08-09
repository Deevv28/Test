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
            SELECT 
                rt.id, rt.table_number, rt.capacity, rt.status, rt.type, 
                rt.features, rt.x_position, rt.y_position, rt.min_spend, rt.description,
                ti.image_path as image
            FROM restaurant_tables 
            LEFT JOIN table_images ti ON rt.id = ti.table_id AND ti.is_primary = 1
            WHERE rt.restaurant_id = ?
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
                rt.features, rt.x_position, rt.y_position, rt.min_spend, rt.description,
                ti.image_path as image
            FROM restaurant_tables 
            LEFT JOIN table_images ti ON rt.id = ti.table_id AND ti.is_primary = 1
            WHERE rt.restaurant_id = ?
            ORDER BY table_number
        `, [id]);

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

// GET /api/restaurants/:id/table-photos - Get table photos for a restaurant (public)
router.get('/:id/table-photos', async (req, res) => {
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

        const photos = await db.all(`
            SELECT id, table_type, photo_path, description, created_at
            FROM table_photos 
            WHERE restaurant_id = ? AND is_active = 1
            ORDER BY table_type, created_at DESC
        `, [id]);

        res.status(200).json({
            success: true,
            message: 'Table photos retrieved successfully',
            data: photos
        });

    } catch (error) {
        console.error('Get table photos error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching table photos'
        });
    }
});

// GET /api/restaurants/:id/tables/:tableId/images - Get table images (public)
router.get('/:id/tables/:tableId/images', async (req, res) => {
    try {
        const { id, tableId } = req.params;

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

        // Verify table belongs to restaurant
        const table = await db.get(
            'SELECT id FROM restaurant_tables WHERE id = ? AND restaurant_id = ?',
            [tableId, id]
        );

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Table not found'
            });
        }

        const images = await db.all(`
            SELECT id, image_path, description, is_primary, created_at
            FROM table_images 
            WHERE table_id = ? AND is_active = 1
            ORDER BY is_primary DESC, created_at ASC
        `, [tableId]);

        res.status(200).json({
            success: true,
            message: 'Table images retrieved successfully',
            data: images
        });

    } catch (error) {
        console.error('Get table images error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching table images'
        });
    }
});

module.exports = router;